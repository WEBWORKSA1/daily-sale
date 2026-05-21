"""Walmart Canada scraper — JSON-output edition."""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http, match, store

log = logging.getLogger("walmart")
RETAILER_SLUG = "walmart"
SEARCH_URL = "https://www.walmart.ca/api/bsp/v2/products/search"


def search_query_for(product: dict) -> str:
    return f'{product["name"]} {product.get("unit","")}'.strip()


def parse_search_response(payload: dict) -> list[dict]:
    out = []
    products = payload.get("data", {}).get("products") or payload.get("products") or []
    for p in products:
        sku = str(p.get("code") or p.get("id") or "").strip()
        name = (p.get("name") or "").strip()
        cur = p.get("currentPrice") or p.get("priceInfo", {}).get("currentPrice")
        was = p.get("originalPrice") or p.get("priceInfo", {}).get("wasPrice")
        if not (sku and name and cur):
            continue
        try:
            cur_cents = int(round(float(cur) * 100))
            was_cents = int(round(float(was) * 100)) if was else None
        except (TypeError, ValueError):
            continue
        out.append({
            "sku": sku, "name": name,
            "price_cents": cur_cents, "was_cents": was_cents,
            "on_sale": bool(was_cents and was_cents > cur_cents),
        })
    return out


def search_walmart(query: str, external_store_id: str) -> list[dict]:
    headers = {
        "Cookie": f"defaultNearestStoreId={external_store_id}",
        "Origin": "https://www.walmart.ca",
        "Referer": "https://www.walmart.ca/",
    }
    payload = {"query": query, "page": 1, "size": 8,
               "context": {"store": {"id": external_store_id}}}
    r = http.post_json(SEARCH_URL, payload, headers=headers)
    return parse_search_response(r.json())


def run(dry_run: bool = False) -> None:
    retailer = store.get_retailer(RETAILER_SLUG)
    stores = store.get_stores_for_retailer(RETAILER_SLUG)
    products = store.load_products()
    if not stores:
        log.error("No %s stores configured.", RETAILER_SLUG)
        return
    review_log = []
    written = 0
    for st in stores:
        log.info("Scraping %s (%s)", st["name"], st["external_id"])
        for product in products:
            query = search_query_for(product)
            try:
                results = search_walmart(query, st["external_id"])
            except Exception as e:
                log.warning("Search failed for %s: %s", query, e)
                continue
            if not results:
                continue
            best = match.best_match(
                results[0]["name"],
                [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}],
            )
            if not best:
                continue
            top = results[0]
            if not best["auto"]:
                review_log.append({"query": query, "result_name": top["name"], "score": best["score"]})
                continue
            if dry_run:
                log.info("[dry] %s @ %s -> %s = $%.2f",
                         product["name"], st["name"], top["name"], top["price_cents"] / 100)
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
    log.info("Done. Buffered %d price rows. %d items need review.", written, len(review_log))
    if review_log:
        out = Path("scrapers/data/walmart_review.json")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(review_log, indent=2))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    run(dry_run=args.dry_run)
    if not args.dry_run:
        result = store.flush()
        log.info("Flushed %d total rows.", result["price_count"])
