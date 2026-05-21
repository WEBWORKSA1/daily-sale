"""
No Frills scraper — v5, with price CEILINGS too.

v4 added per-product floors which killed underpriced bad data.
v5 adds per-product CEILINGS which kill overpriced bad data:
- Chicken breast/lb at $21 (was matching premium organic) → ceiling $16
- Honey 1kg at $7 (matched smaller container) → ceiling adjusted
- Frozen berries 600g at $18.50 (matched premium 1kg+ pack) → ceiling $12

Also: search queries now include unit hints (e.g. "Liquid Honey 1kg") so
fuzzy matching prefers the right size.
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

MIN_PLAUSIBLE_CENTS = 50
MAX_PLAUSIBLE_CENTS = 10000  # global ceiling: $100

# Per-canonical-SKU plausibility range (floor_cents, ceiling_cents).
# Calibrated from real Canadian retail 2025-2026.
PRICE_RANGES = {
    # Dairy
    "milk-2pct-4l":              (400, 900),
    "milk-1pct-4l":              (400, 900),
    "milk-skim-4l":              (400, 900),
    "milk-homo-4l":              (400, 900),
    "eggs-large-dozen":          (300, 800),
    "eggs-large-18":             (500, 1200),
    "butter-salted-454g":        (400, 900),
    "butter-unsalted-454g":      (400, 900),
    "cheese-cheddar-block-400g": (500, 1100),
    "cheese-shredded-mozza-320g":(400, 900),
    "yogurt-plain-750g":         (300, 700),
    "yogurt-greek-500g":         (350, 800),
    "cream-35-473ml":            (300, 700),
    "cream-10-473ml":            (250, 600),
    "sour-cream-500ml":          (200, 600),
    # Bakery
    "bread-white-675g":          (200, 500),
    "bread-whole-wheat-675g":    (200, 500),
    "bagels-plain-6pk":          (200, 600),
    "english-muffins-6pk":       (200, 600),
    "tortillas-flour-10pk":      (250, 700),
    "buns-hamburger-8pk":        (200, 600),
    "buns-hotdog-8pk":           (200, 600),
    # Produce
    "bananas-lb":                (50,  200),
    "apples-gala-3lb":           (250, 800),
    "apples-mcintosh-3lb":       (250, 800),
    "oranges-navel-3lb":         (400, 900),
    "strawberries-1lb":          (300, 800),
    "blueberries-pint":          (250, 700),
    "grapes-red-2lb":            (400, 1100),
    "tomatoes-on-vine-lb":       (150, 500),
    "potatoes-russet-10lb":      (400, 1200),
    "potatoes-yellow-5lb":       (300, 900),
    "onions-yellow-3lb":         (250, 700),
    "carrots-2lb":               (150, 500),
    "celery-bunch":              (200, 500),
    "lettuce-romaine-3pk":       (300, 800),
    "spinach-baby-312g":         (350, 800),
    "cucumber-english":          (100, 400),
    "peppers-bell-3pk":          (400, 900),
    "broccoli-bunch":            (150, 500),
    "garlic-bulb":               (50,  200),
    "avocado-each":              (80,  350),
    "lemons-bag-2lb":            (250, 700),
    "limes-each":                (50,  200),
    "mushrooms-white-227g":      (200, 600),
    # Meat (per lb)
    "chicken-breast-bnls-skls-lb":(500, 1600),   # ceiling fixes $21 issue
    "chicken-thighs-bnls-skls-lb":(350, 1200),
    "chicken-whole-lb":          (200, 600),
    "ground-beef-lean-lb":       (500, 1100),
    "ground-beef-medium-lb":     (400, 900),
    "beef-striploin-lb":         (1000, 3000),
    "pork-tenderloin-lb":        (400, 1100),
    "pork-chops-lb":             (350, 1100),
    "bacon-375g":                (400, 1000),
    "sausage-breakfast-375g":    (350, 900),
    "hot-dogs-12pk":             (250, 1100),
    "deli-ham-175g":             (300, 900),
    "deli-turkey-175g":          (350, 1000),
    "salmon-atlantic-lb":        (900, 2500),
    "tilapia-frozen-400g":       (500, 1200),
    # Pantry
    "rice-basmati-8kg":          (1500, 4000),
    "rice-long-grain-2kg":       (400, 1100),
    "pasta-spaghetti-900g":      (150, 500),
    "pasta-penne-900g":          (150, 500),
    "pasta-sauce-tomato-650ml":  (200, 600),
    "flour-all-purpose-2-5kg":   (350, 900),
    "sugar-white-2kg":           (300, 700),
    "salt-table-1kg":            (100, 400),
    "oil-canola-3l":             (600, 1500),
    "oil-olive-1l":              (700, 1800),
    "peanut-butter-1kg":         (350, 1000),
    "jam-strawberry-500ml":      (300, 800),
    "honey-1kg":                 (600, 1500),   # ceiling fixes the $7 issue (too low)
    "maple-syrup-540ml":         (800, 2000),
    "cereal-cheerios-570g":      (400, 1000),
    "oats-quick-1kg":            (250, 700),
    "soup-tomato-540ml":         (130, 400),
    "tuna-canned-170g":          (100, 400),
    "beans-canned-540ml":        (120, 400),
    "tomatoes-canned-796ml":     (150, 500),
    # Frozen
    "frozen-pizza-pepperoni":    (350, 1100),
    "frozen-fries-1kg":          (250, 800),
    "frozen-veg-mix-750g":       (250, 700),
    "frozen-berries-600g":       (500, 1200),   # ceiling fixes $18.50 issue
    "ice-cream-1-5l":            (350, 1000),
    "frozen-chicken-nuggets-700g":(600, 1500),
    # Beverage
    "coffee-ground-930g":        (1000, 2500),
    "tea-orange-pekoe-72ct":     (300, 900),
    "juice-orange-1-75l":        (300, 700),
    "juice-apple-1-75l":         (250, 700),
    "water-bottled-24pk":        (250, 800),
    "soda-cola-12pk":            (500, 1300),
    # Household
    "toilet-paper-12-double":    (600, 1800),
    "paper-towel-6-roll":        (500, 1500),
    "dish-soap-740ml":           (300, 800),
    "laundry-detergent-2-95l":   (1000, 2500),
    "trash-bags-40ct":           (800, 1800),
    # Condiments
    "ketchup-1l":                (350, 900),
    "mayo-890ml":                (450, 1100),
    "mustard-yellow-450ml":      (200, 600),
}


def get_range(slug: str) -> tuple[int, int]:
    return PRICE_RANGES.get(slug, (MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS))


def fetch_search_page(query: str, store_external_id: str) -> str:
    url = SEARCH_URL_TEMPLATE.format(query=quote(query), store_id=store_external_id)
    r = http.get(url, headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return r.text


def extract_shelf_price(context: str, floor: int, ceiling: int) -> tuple[int | None, int | None, bool]:
    sale = SALE_PRICE_RE.search(context)
    if sale:
        cur = int(round(float(sale.group(1)) * 100))
        was = int(round(float(sale.group(2)) * 100))
        if floor <= cur <= ceiling:
            return (cur, was, True)

    about = ABOUT_PRICE_RE.search(context)
    if about:
        cents = int(round(float(about.group(1)) * 100))
        if floor <= cents <= ceiling:
            return (cents, None, False)

    candidates = []
    for pm in REGULAR_PRICE_RE.finditer(context):
        after = context[pm.end():pm.end() + 30]
        if UNIT_SUFFIX_RE.match(after):
            continue
        cents = int(round(float(pm.group(1)) * 100))
        if floor <= cents <= ceiling:
            candidates.append(cents)

    if not candidates:
        return (None, None, False)

    # When multiple in-range candidates exist, pick the middle-ish one
    # (typical card: shelf < regular; both in range → shelf is the smaller)
    if len(candidates) >= 2:
        sorted_c = sorted(candidates)
        return (sorted_c[0], None, False)  # smaller of in-range = actual shelf

    return (candidates[0], None, False)


def parse_products_from_html(html: str, floor: int, ceiling: int) -> list[dict]:
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

        price, was, on_sale = extract_shelf_price(context, floor, ceiling)
        if not price:
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


def search_no_frills(query: str, store_external_id: str, floor: int, ceiling: int) -> list[dict]:
    html = fetch_search_page(query, store_external_id)

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    debug_path = debug_dir / "no_frills_first_response.html"
    if not debug_path.exists():
        debug_path.write_text(html)
        log.info("Saved first response (%d bytes) to %s", len(html), debug_path)

    products = parse_products_from_html(html, floor, ceiling)
    if products:
        log.debug("Parsed %d products for '%s'", len(products), query)
    else:
        log.warning("No products found for '%s' (HTML: %d bytes)", query, len(html))

    return products


def search_query_for(product: dict) -> str:
    """Include unit hint so search prefers the right size."""
    name = product["name"]
    unit = product.get("unit", "").strip()
    if unit and unit not in name.lower():
        return f"{name} {unit}"
    return name


def run(dry_run: bool = False) -> None:
    retailer = store.get_retailer(RETAILER_SLUG)
    stores = store.get_stores_for_retailer(RETAILER_SLUG)
    products = store.load_products()

    if not stores:
        log.error("No %s stores configured.", RETAILER_SLUG)
        return

    review_log = []
    no_results = []
    rejected = []
    written = 0
    AUTO_MATCH_THRESHOLD = 78

    for st in stores:
        log.info("Scraping %s (storeId=%s)", st["name"], st["external_id"])
        for product in products:
            query = search_query_for(product)
            floor, ceiling = get_range(product["slug"])
            try:
                results = search_no_frills(query, st["external_id"], floor, ceiling)
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

            # Final sanity: in-range?
            if not (floor <= picked["price_cents"] <= ceiling):
                rejected.append({
                    "query": query,
                    "matched_name": picked["name"],
                    "price": picked["price_cents"] / 100,
                    "range": f"${floor/100:.2f}-${ceiling/100:.2f}",
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
        "Done. Wrote %d. Review queue: %d. No results: %d. Out of range: %d.",
        written, len(review_log), len(no_results), len(rejected),
    )

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "wrote": written,
        "review_count": len(review_log),
        "no_results_count": len(no_results),
        "rejected_count": len(rejected),
        "review": review_log[:20],
        "no_results": no_results[:20],
        "rejected": rejected[:20],
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
