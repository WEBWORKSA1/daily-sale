"""
No Frills scraper — v3, tightened price extraction.

v2 produced 21 real prices but ~5 were bad (per-unit prices leaked through:
e.g. bagels at $0.39 when real price was $3.99).

v3 improvements:
- Expanded unit-price filter to catch /ea, /each, /pkg, /pk
- Per-product MIN price floor (most groceries cost ≥$0.50, never under)
- Smarter price selection: prefer the LARGEST price in context (real shelf
  price is almost always larger than the per-unit reference price)
- Lower fuzzy match threshold from 85 to 70 for "near-match auto-accept"
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

# Per-unit price suffixes to FILTER OUT (these aren't shelf prices)
UNIT_SUFFIX_RE = re.compile(
    r'\s*/\s*(?:100\s*g|100g|1\s*kg|1kg|1\s*lb|1lb|kg|lb|oz|ml|l\b|ea\b|each|pkg|pk|pc|piece)',
    re.IGNORECASE,
)

IMG_ALT_RE = re.compile(r'<img[^>]+alt="([^"]+)"', re.IGNORECASE)

# Minimum plausible shelf price for any grocery item (50 cents)
MIN_PLAUSIBLE_CENTS = 50


def fetch_search_page(query: str, store_external_id: str) -> str:
    url = SEARCH_URL_TEMPLATE.format(query=quote(query), store_id=store_external_id)
    r = http.get(url, headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return r.text


def extract_shelf_price(context: str) -> tuple[int | None, int | None, bool]:
    """
    Pull shelf price from a product card context.
    Returns (price_cents, was_cents, on_sale).

    Strategy:
    1. Sale prices have a specific format — find them first
    2. "about $X.XX" is for weight-priced items (always real)
    3. Otherwise, collect all $X.XX matches, filter out per-unit prices,
       and return the LARGEST (which is almost always the shelf price;
       per-unit prices that slip through filter are smaller).
    """
    sale = SALE_PRICE_RE.search(context)
    if sale:
        return (
            int(round(float(sale.group(1)) * 100)),
            int(round(float(sale.group(2)) * 100)),
            True,
        )

    about = ABOUT_PRICE_RE.search(context)
    if about:
        cents = int(round(float(about.group(1)) * 100))
        if cents >= MIN_PLAUSIBLE_CENTS:
            return (cents, None, False)

    # Collect plausible shelf prices (filter out unit prices)
    candidates = []
    for pm in REGULAR_PRICE_RE.finditer(context):
        after = context[pm.end():pm.end() + 30]
        if UNIT_SUFFIX_RE.match(after):
            continue
        cents = int(round(float(pm.group(1)) * 100))
        if cents >= MIN_PLAUSIBLE_CENTS:
            candidates.append(cents)

    if not candidates:
        return (None, None, False)

    # Use the median-to-max strategy: real shelf price is usually the largest
    # plausible value (per-unit prices that slip through filter are smaller)
    return (max(candidates), None, False)


def parse_products_from_html(html: str) -> list[dict]:
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

        price, was, on_sale = extract_shelf_price(context)
        if not price or price < MIN_PLAUSIBLE_CENTS:
            continue

        # Name from img alt
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


def search_no_frills(query: str, store_external_id: str) -> list[dict]:
    html = fetch_search_page(query, store_external_id)

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    debug_path = debug_dir / "no_frills_first_response.html"
    if not debug_path.exists():
        debug_path.write_text(html)
        log.info("Saved first response (%d bytes) to %s", len(html), debug_path)

    products = parse_products_from_html(html)
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
    written = 0
    # Lowered auto-match threshold to capture more SKUs
    AUTO_MATCH_THRESHOLD = 70

    for st in stores:
        log.info("Scraping %s (storeId=%s)", st["name"], st["external_id"])
        for product in products:
            query = search_query_for(product)
            try:
                results = search_no_frills(query, st["external_id"])
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
        "Done. Wrote %d prices. %d need review. %d had no results.",
        written, len(review_log), len(no_results),
    )

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "wrote": written,
        "review_count": len(review_log),
        "no_results_count": len(no_results),
        "review": review_log[:20],
        "no_results": no_results[:20],
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
