"""
No Frills scraper — v4, per-product price plausibility.

v3 fixes still left bad data:
- Apples 3lb at $1.15 (per-unit leaked: real ~$4.99)
- Carrots 2lb at $0.57 (per-unit: real ~$2.49)
- Garlic bulb at $7.00 (fuzzy matched to garlic powder jar)

v4 improvements:
- PRICE_FLOORS: per-canonical-SKU minimum plausible shelf price
- "median-bias" price picker instead of max — handles 3-price contexts
  ($0.57 per-unit, $2.49 shelf, $4.99 regular ref) correctly
- AUTO_MATCH_THRESHOLD raised 70 -> 78 (kills garlic-powder-for-garlic-bulb)
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http, match, store

log = logging.getLogger("no-frills")
RETAILER_SLUG = "no-frills"

SEARCH_URL_TEMPLATE = "https://www.nofrills.ca/en/search?search-bar={query}&storeId={store_id}"

PRODUCT_LINK_RE = re.compile(
    r'href="(/en/[^/"]+/p/(\d+_[A-Z]{2,3}))(?:\?[^"]*)?"',
    re.IGNORECASE,
)

SALE_PRICE_RE = re.compile(
    r'sale[^$]{0,30}\$(\d+\.\d{2})[^$]{0,40}formerly[^$]{0,30}\$(\d+\.\d{2})',
    re.IGNORECASE,
)
ABOUT_PRICE_RE = re.compile(r'about\s*\$(\d+\.\d{2})', re.IGNORECASE)
REGULAR_PRICE_RE = re.compile(r'\$(\d+\.\d{2})')

UNIT_SUFFIX_RE = re.compile(
    r'\s*/\s*(?:100\s*g|100g|1\s*kg|1kg|1\s*lb|1lb|kg|lb|oz|ml|l\b|ea\b|each|pkg|pk|pc|piece)',
    re.IGNORECASE,
)

IMG_ALT_RE = re.compile(r'<img[^>]+alt="([^"]+)"', re.IGNORECASE)

MIN_PLAUSIBLE_CENTS = 50  # global floor

# Per-canonical-SKU plausibility floors (cents). If scraped price is below
# this, we reject it — it's almost certainly a per-unit price leak.
# Numbers calibrated from real Canadian retail 2025-2026.
PRICE_FLOORS = {
    # Dairy
    "milk-2pct-4l": 400, "milk-1pct-4l": 400, "milk-skim-4l": 400, "milk-homo-4l": 400,
    "eggs-large-dozen": 300, "eggs-large-18": 500,
    "butter-salted-454g": 400, "butter-unsalted-454g": 400,
    "cheese-cheddar-block-400g": 500, "cheese-shredded-mozza-320g": 400,
    "yogurt-plain-750g": 300, "yogurt-greek-500g": 350,
    "cream-35-473ml": 300, "cream-10-473ml": 250, "sour-cream-500ml": 200,
    # Bakery
    "bread-white-675g": 200, "bread-whole-wheat-675g": 200,
    "bagels-plain-6pk": 200, "english-muffins-6pk": 200, "tortillas-flour-10pk": 250,
    "buns-hamburger-8pk": 200, "buns-hotdog-8pk": 200,
    # Produce — these are the ones that bit us
    "bananas-lb": 50, "apples-gala-3lb": 250, "apples-mcintosh-3lb": 250,
    "oranges-navel-3lb": 400, "strawberries-1lb": 300, "blueberries-pint": 250,
    "grapes-red-2lb": 400, "tomatoes-on-vine-lb": 150,
    "potatoes-russet-10lb": 400, "potatoes-yellow-5lb": 300,
    "onions-yellow-3lb": 250, "carrots-2lb": 150, "celery-bunch": 200,
    "lettuce-romaine-3pk": 300, "spinach-baby-312g": 350, "cucumber-english": 100,
    "peppers-bell-3pk": 400, "broccoli-bunch": 150, "garlic-bulb": 50,
    "avocado-each": 80, "lemons-bag-2lb": 250, "limes-each": 50,
    "mushrooms-white-227g": 200,
    # Meat
    "chicken-breast-bnls-skls-lb": 500, "chicken-thighs-bnls-skls-lb": 350,
    "chicken-whole-lb": 200, "ground-beef-lean-lb": 500, "ground-beef-medium-lb": 400,
    "beef-striploin-lb": 1000, "pork-tenderloin-lb": 400, "pork-chops-lb": 350,
    "bacon-375g": 400, "sausage-breakfast-375g": 350, "hot-dogs-12pk": 250,
    "deli-ham-175g": 300, "deli-turkey-175g": 350,
    "salmon-atlantic-lb": 900, "tilapia-frozen-400g": 500,
    # Pantry
    "rice-basmati-8kg": 1500, "rice-long-grain-2kg": 400,
    "pasta-spaghetti-900g": 150, "pasta-penne-900g": 150,
    "pasta-sauce-tomato-650ml": 200, "flour-all-purpose-2-5kg": 350,
    "sugar-white-2kg": 300, "salt-table-1kg": 100,
    "oil-canola-3l": 600, "oil-olive-1l": 700, "peanut-butter-1kg": 350,
    "jam-strawberry-500ml": 300, "honey-1kg": 600, "maple-syrup-540ml": 800,
    "cereal-cheerios-570g": 400, "oats-quick-1kg": 250,
    "soup-tomato-540ml": 130, "tuna-canned-170g": 100, "beans-canned-540ml": 120,
    "tomatoes-canned-796ml": 150,
    # Frozen
    "frozen-pizza-pepperoni": 350, "frozen-fries-1kg": 250,
    "frozen-veg-mix-750g": 250, "frozen-berries-600g": 500,
    "ice-cream-1-5l": 350, "frozen-chicken-nuggets-700g": 600,
    # Beverage
    "coffee-ground-930g": 1000, "tea-orange-pekoe-72ct": 300,
    "juice-orange-1-75l": 300, "juice-apple-1-75l": 250,
    "water-bottled-24pk": 250, "soda-cola-12pk": 500,
    # Household
    "toilet-paper-12-double": 600, "paper-towel-6-roll": 500,
    "dish-soap-740ml": 300, "laundry-detergent-2-95l": 1000, "trash-bags-40ct": 800,
    # Condiments
    "ketchup-1l": 350, "mayo-890ml": 450, "mustard-yellow-450ml": 200,
}


def fetch_search_page(query: str, store_external_id: str) -> str:
    url = SEARCH_URL_TEMPLATE.format(query=quote(query), store_id=store_external_id)
    r = http.get(url, headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return r.text


def extract_shelf_price(context: str, floor_cents: int = MIN_PLAUSIBLE_CENTS) -> tuple[int | None, int | None, bool]:
    """
    Pull shelf price from a product card context, with a per-product floor.

    Strategy:
    1. Sale prices have specific 'sale: $X formerly: $Y' format — find first
    2. 'about $X' is for weight-priced items — accept if ≥ floor
    3. Collect all $X candidates, filter unit suffixes, filter < floor.
       From what remains, pick the SECOND-LARGEST (median bias) if there
       are 3+, else MAX. This handles the typical 3-price card layout:
       [unit_ref, shelf, regular_strike] correctly.
    """
    sale = SALE_PRICE_RE.search(context)
    if sale:
        cur = int(round(float(sale.group(1)) * 100))
        was = int(round(float(sale.group(2)) * 100))
        if cur >= floor_cents:
            return (cur, was, True)

    about = ABOUT_PRICE_RE.search(context)
    if about:
        cents = int(round(float(about.group(1)) * 100))
        if cents >= floor_cents:
            return (cents, None, False)

    candidates = []
    for pm in REGULAR_PRICE_RE.finditer(context):
        after = context[pm.end():pm.end() + 30]
        if UNIT_SUFFIX_RE.match(after):
            continue
        cents = int(round(float(pm.group(1)) * 100))
        if cents >= floor_cents:
            candidates.append(cents)

    if not candidates:
        return (None, None, False)

    if len(candidates) >= 3:
        # Median bias: sort, pick second-largest
        # (largest = "regular" reference, second = actual shelf, smaller = unit refs)
        sorted_c = sorted(candidates, reverse=True)
        return (sorted_c[1], None, False)

    return (max(candidates), None, False)


def parse_products_from_html(html: str, floor_cents: int = MIN_PLAUSIBLE_CENTS) -> list[dict]:
    matches = list(PRODUCT_LINK_RE.finditer(html))
    results = []
    seen_skus = set()

    for i, m in enumerate(matches):
        sku = m.group(2)
        if sku in seen_skus:
            continue
        seen_skus.add(sku)

        ctx_start = matches[i - 1].end() if i > 0 else max(0, m.start() - 2000)
        context = html[ctx_start:m.start()]

        if re.search(r'\bsponsored\b', context, re.IGNORECASE):
            continue

        price, was, on_sale = extract_shelf_price(context, floor_cents)
        if not price or price < floor_cents:
            continue

        name = ""
        alts = IMG_ALT_RE.findall(context)
        if alts:
            alt = alts[-1]
            alt = re.sub(r'\s*\$[\d.]+/[\w%]+.*$', '', alt).strip()
            alt = re.sub(r'\s+\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\s*$', '', alt, flags=re.IGNORECASE).strip()
            name = alt

        if not name:
            slug_match = re.search(r'/en/([^/]+)/p/', m.group(1))
            if slug_match:
                name = slug_match.group(1).replace('-', ' ').title()

        if not name:
            continue

        results.append({
            "sku": sku,
            "name": name,
            "price_cents": price,
            "was_cents": was,
            "on_sale": on_sale,
        })

    return results


def search_no_frills(query: str, store_external_id: str, floor_cents: int = MIN_PLAUSIBLE_CENTS) -> list[dict]:
    html = fetch_search_page(query, store_external_id)

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    debug_path = debug_dir / "no_frills_first_response.html"
    if not debug_path.exists():
        debug_path.write_text(html)
        log.info("Saved first response (%d bytes) to %s", len(html), debug_path)

    products = parse_products_from_html(html, floor_cents)
    if products:
        log.debug("Parsed %d products for '%s'", len(products), query)
    else:
        log.warning("No products found for '%s' (HTML: %d bytes)", query, len(html))

    return products


def search_query_for(product: dict) -> str:
    return product["name"]


def run(dry_run: bool = False) -> None:
    retailer = store.get_retailer(RETAILER_SLUG)
    stores = store.get_stores_for_retailer(RETAILER_SLUG)
    products = store.load_products()

    if not stores:
        log.error("No %s stores configured.", RETAILER_SLUG)
        return

    review_log = []
    no_results = []
    rejected_low = []
    written = 0
    AUTO_MATCH_THRESHOLD = 78  # raised from 70 — kills wrong-product matches

    for st in stores:
        log.info("Scraping %s (storeId=%s)", st["name"], st["external_id"])
        for product in products:
            query = search_query_for(product)
            floor = PRICE_FLOORS.get(product["slug"], MIN_PLAUSIBLE_CENTS)
            try:
                results = search_no_frills(query, st["external_id"], floor_cents=floor)
            except Exception as e:
                log.warning("Search failed for '%s': %s", query, e)
                continue

            if not results:
                no_results.append(query)
                continue

            picked = None
            picked_score = 0
            canon = [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}]
            for r in results[:8]:
                best = match.best_match(r["name"], canon)
                if best and best["score"] > picked_score:
                    picked = r
                    picked_score = best["score"]

            if not picked:
                no_results.append(query)
                continue

            if picked_score < AUTO_MATCH_THRESHOLD:
                review_log.append({
                    "query": query,
                    "result_name": picked["name"],
                    "score": picked_score,
                    "price": picked["price_cents"] / 100,
                })
                continue

            if picked["price_cents"] < floor:
                rejected_low.append({
                    "query": query,
                    "price": picked["price_cents"] / 100,
                    "floor": floor / 100,
                })
                continue

            if dry_run:
                log.info(
                    "[dry] %s -> %s = $%.2f%s [match=%d]",
                    product["name"], picked["name"],
                    picked["price_cents"] / 100,
                    " (SALE)" if picked["on_sale"] else "",
                    picked_score,
                )
                continue

            store.add_price(
                store_id=st["id"],
                product_slug=product["slug"],
                price_cents=picked["price_cents"],
                was_price_cents=picked["was_cents"],
                on_sale=picked["on_sale"],
                source=f"scraper:{RETAILER_SLUG}",
            )
            written += 1

    log.info(
        "Done. Wrote %d prices. %d review queue, %d no results, %d rejected as too low.",
        written, len(review_log), len(no_results), len(rejected_low),
    )

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "wrote": written,
        "review_count": len(review_log),
        "no_results_count": len(no_results),
        "rejected_low_count": len(rejected_low),
        "review": review_log[:20],
        "no_results": no_results[:20],
        "rejected_low": rejected_low[:20],
    }
    (debug_dir / "no_frills_summary.json").write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verbose", "-v", action="store_true")
    args = ap.parse_args()
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    run(dry_run=args.dry_run)
    if not args.dry_run:
        result = store.flush()
        log.info("Flushed %d total rows to data/prices/latest.json", result["price_count"])
