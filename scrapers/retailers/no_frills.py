"""
No Frills scraper.

Fetches the public search results page for each canonical product,
parses prices from the server-side-rendered HTML.

The No Frills site (Next.js) embeds product data in two places:
1. <script id="__NEXT_DATA__">  — full JSON of page state
2. Visible HTML product cards   — fallback if __NEXT_DATA__ structure shifts

This scraper tries __NEXT_DATA__ first (cleaner), falls back to HTML parsing.

URL pattern (verified from DevTools 2026-05-21):
    https://www.nofrills.ca/en/search?search-bar={query}&storeId={store_id}

No auth needed. No API key needed. Just a User-Agent header.
Same pattern works for Zehrs (storeId 1024) and other Loblaw banners.
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
from selectolax.parser import HTMLParser

log = logging.getLogger("no-frills")
RETAILER_SLUG = "no-frills"

SEARCH_URL_TEMPLATE = "https://www.nofrills.ca/en/search?search-bar={query}&storeId={store_id}"


def fetch_search_page(query: str, store_external_id: str) -> str:
    url = SEARCH_URL_TEMPLATE.format(query=quote(query), store_id=store_external_id)
    r = http.get(url, headers={
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return r.text


def extract_next_data(html: str) -> dict | None:
    m = re.search(
        r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    )
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def find_products_in_next_data(data: dict) -> list[dict]:
    found = []

    def walk(node):
        if isinstance(node, dict):
            if "name" in node and ("price" in node or "prices" in node or "currentPrice" in node):
                found.append(node)
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return found


def normalize_price(value) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(round(float(value) * 100))
    if isinstance(value, str):
        cleaned = re.sub(r"[^\d.]", "", value)
        if cleaned:
            try:
                return int(round(float(cleaned) * 100))
            except ValueError:
                pass
    if isinstance(value, dict):
        for key in ("value", "amount", "price", "currentPrice"):
            if key in value:
                result = normalize_price(value[key])
                if result is not None:
                    return result
    return None


def extract_product_info(p: dict) -> dict | None:
    name = (p.get("name") or "").strip()
    if not name:
        return None

    sku = str(
        p.get("code") or p.get("productId") or p.get("id") or p.get("sku") or ""
    ).strip()

    cur = None
    for key in ("price", "currentPrice", "salePrice"):
        if key in p:
            cur = normalize_price(p[key])
            if cur:
                break
    if not cur and "prices" in p and isinstance(p["prices"], dict):
        for key in ("price", "currentPrice", "salePrice"):
            if key in p["prices"]:
                cur = normalize_price(p["prices"][key])
                if cur:
                    break

    was = None
    for key in ("wasPrice", "regularPrice", "originalPrice", "comparePrice"):
        if key in p:
            was = normalize_price(p[key])
            if was:
                break
    if not was and "prices" in p and isinstance(p["prices"], dict):
        for key in ("wasPrice", "regularPrice"):
            if key in p["prices"]:
                was = normalize_price(p["prices"][key])
                if was:
                    break

    if not cur:
        return None

    return {
        "sku": sku,
        "name": name,
        "price_cents": cur,
        "was_cents": was,
        "on_sale": bool(was and was > cur),
    }


def parse_html_fallback(html: str) -> list[dict]:
    tree = HTMLParser(html)
    results = []
    for card in tree.css('[data-testid="product-tile"]'):
        name_el = card.css_first('[data-testid="product-tile--product-name"]')
        price_el = card.css_first('[data-testid="price"]') or card.css_first(".price")
        if not (name_el and price_el):
            continue
        name = name_el.text(strip=True)
        price_text = price_el.text(strip=True)
        cur = normalize_price(price_text)
        if cur:
            results.append({
                "sku": card.attributes.get("data-code", ""),
                "name": name,
                "price_cents": cur,
                "was_cents": None,
                "on_sale": False,
            })
    return results


def search_no_frills(query: str, store_external_id: str) -> list[dict]:
    html = fetch_search_page(query, store_external_id)

    data = extract_next_data(html)
    if data:
        raw_products = find_products_in_next_data(data)
        parsed = [extract_product_info(p) for p in raw_products]
        parsed = [p for p in parsed if p]
        if parsed:
            log.debug("Parsed %d products from __NEXT_DATA__ for '%s'", len(parsed), query)
            return parsed

    parsed = parse_html_fallback(html)
    if parsed:
        log.debug("Parsed %d products from HTML fallback for '%s'", len(parsed), query)
    else:
        log.warning("No products found for '%s' (HTML: %d bytes)", query, len(html))
        dump_path = Path("scrapers/data/no_frills_debug.html")
        dump_path.parent.mkdir(parents=True, exist_ok=True)
        if not dump_path.exists():
            dump_path.write_text(html)
            log.warning("Saved failing HTML to %s", dump_path)

    return parsed


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

            best = match.best_match(
                results[0]["name"],
                [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}],
            )
            if not best:
                for r in results[1:5]:
                    best = match.best_match(
                        r["name"],
                        [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}],
                    )
                    if best and best["auto"]:
                        results = [r]
                        break
                if not best:
                    continue

            top = results[0]
            if not best["auto"]:
                review_log.append({
                    "query": query,
                    "result_name": top["name"],
                    "score": best["score"],
                    "price": top["price_cents"] / 100,
                })
                continue

            if dry_run:
                log.info(
                    "[dry] %s @ %s -> %s = $%.2f%s",
                    product["name"], st["name"], top["name"],
                    top["price_cents"] / 100,
                    " (SALE)" if top["on_sale"] else "",
                )
                continue

            store.add_price(
                store_id=st["id"],
                product_slug=product["slug"],
                price_cents=top["price_cents"],
                was_price_cents=top["was_cents"],
                on_sale=top["on_sale"],
                source=f"scraper:{RETAILER_SLUG}",
            )
            written += 1

    log.info(
        "Done. Wrote %d prices. %d need review. %d had no results.",
        written, len(review_log), len(no_results),
    )

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    if review_log:
        (debug_dir / "no_frills_review.json").write_text(json.dumps(review_log, indent=2))
    if no_results:
        (debug_dir / "no_frills_no_results.json").write_text(json.dumps(no_results, indent=2))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Don't write to JSON")
    ap.add_argument("--verbose", "-v", action="store_true")
    args = ap.parse_args()
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    run(dry_run=args.dry_run)
    if not args.dry_run:
        result = store.flush()
        log.info("Flushed %d total rows to data/prices/latest.json", result["price_count"])
