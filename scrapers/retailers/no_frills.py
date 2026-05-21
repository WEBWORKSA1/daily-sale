"""
No Frills scraper — v2, HTML link-based parsing.

Previous version walked __NEXT_DATA__ JSON heuristically. That failed because
Loblaw's Next.js bundle contains many non-product objects with similar shape.

This version uses a much simpler approach: find every <a> link to a product
page (URL pattern /en/{slug}/p/{sku}), then look backwards in the HTML for
the price text that precedes it. Tested locally against real No Frills HTML.

URL pattern (verified 2026-05-21):
    https://www.nofrills.ca/en/search?search-bar={query}&storeId={store_id}

No auth needed. Same pattern works for Zehrs and other Loblaw banners.
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

# Match: <a href="/en/{slug}/p/{sku}?...">  capturing both the SKU and any
# preceding text up to the previous product link.
# SKU format: digits + _EA or _KG
PRODUCT_LINK_RE = re.compile(
    r'href="(/en/[^/"]+/p/(\d+_[A-Z]{2,3}))(?:\?[^"]*)?"',
    re.IGNORECASE,
)

# Match prices in surrounding text
SALE_PRICE_RE = re.compile(
    r'sale[^$]{0,30}\$(\d+\.\d{2})[^$]{0,40}formerly[^$]{0,30}\$(\d+\.\d{2})',
    re.IGNORECASE,
)
ABOUT_PRICE_RE = re.compile(r'about\s*\$(\d+\.\d{2})', re.IGNORECASE)
REGULAR_PRICE_RE = re.compile(r'\$(\d+\.\d{2})')

# Optional product image alt text (gives us the brand + full name)
# <img alt="Brand Product Name Size, $/100g" ...
IMG_ALT_RE = re.compile(r'<img[^>]+alt="([^"]+)"', re.IGNORECASE)


def fetch_search_page(query: str, store_external_id: str) -> str:
    url = SEARCH_URL_TEMPLATE.format(query=quote(query), store_id=store_external_id)
    r = http.get(url, headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return r.text


def parse_products_from_html(html: str) -> list[dict]:
    """
    Walk the HTML. For each product link found, look at the ~1000 chars
    BEFORE it (the product card content) to extract price + image alt + name.
    """
    matches = list(PRODUCT_LINK_RE.finditer(html))
    results = []
    seen_skus = set()

    for i, m in enumerate(matches):
        sku = m.group(2)
        if sku in seen_skus:
            continue
        seen_skus.add(sku)

        # Context = chars between previous match and current
        ctx_start = matches[i - 1].end() if i > 0 else max(0, m.start() - 2000)
        context = html[ctx_start:m.start()]

        # Skip "sponsored" cards (ads from other products that don't match the query)
        if re.search(r'\bsponsored\b', context, re.IGNORECASE):
            continue

        # Determine price
        price = None
        was = None
        on_sale = False

        sale = SALE_PRICE_RE.search(context)
        if sale:
            price = int(round(float(sale.group(1)) * 100))
            was = int(round(float(sale.group(2)) * 100))
            on_sale = True
        else:
            about = ABOUT_PRICE_RE.search(context)
            if about:
                price = int(round(float(about.group(1)) * 100))
            else:
                # Find all $X.XX matches, take the LAST one (closest to the link)
                # Filter out per-unit prices like $0.24/100g
                price_candidates = []
                for pm in REGULAR_PRICE_RE.finditer(context):
                    # Check chars after the match — if it's "/100g" or similar, skip
                    after = context[pm.end():pm.end() + 10]
                    if re.match(r'\s*/(?:100g|1kg|1lb|kg|lb|oz|ml|l\b)', after, re.IGNORECASE):
                        continue
                    price_candidates.append(pm.group(1))
                if price_candidates:
                    price = int(round(float(price_candidates[-1]) * 100))

        if not price or price < 10:
            continue

        # Extract product name from img alt text (most reliable)
        # Look for image alt within context — usually the IMG comes before the price
        name = ""
        alts = IMG_ALT_RE.findall(context)
        if alts:
            # Take the last alt (most likely belongs to this product card)
            alt = alts[-1]
            # Strip trailing price/size suffixes like "$0.24/100g"
            alt = re.sub(r'\s*\$[\d.]+/[\w%]+\s*$', '', alt).strip()
            alt = re.sub(r'\s+\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\s*$', '', alt, flags=re.IGNORECASE).strip()
            name = alt

        # Fallback: use the URL slug
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

    # Always dump the first response for inspection
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
        # Save the failing HTML alongside for debugging
        fail_path = debug_dir / f"no_frills_fail_{query[:20].replace(' ', '_')}.html"
        if not fail_path.exists():
            fail_path.write_text(html)

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

            # Fuzzy match: try top 5 results against canonical name
            picked = None
            picked_score = 0
            canon = [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}]
            for r in results[:5]:
                best = match.best_match(r["name"], canon)
                if best and best["score"] > picked_score:
                    picked = r
                    picked_score = best["score"]
                    picked_auto = best["auto"]

            if not picked:
                no_results.append(query)
                continue

            if not picked_auto:
                review_log.append({
                    "query": query,
                    "result_name": picked["name"],
                    "score": picked_score,
                    "price": picked["price_cents"] / 100,
                })
                continue

            if dry_run:
                log.info(
                    "[dry] %s -> %s = $%.2f%s",
                    product["name"], picked["name"],
                    picked["price_cents"] / 100,
                    " (SALE)" if picked["on_sale"] else "",
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
