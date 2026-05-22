"""
Flipp (Wishabi) flyer scraper — BRIDGE SOURCE.

⚠️ This sources from Flipp's backend (backflipp.wishabi.com), an aggregator.
Per explicit owner decision (2026-05-22): used as a Phase-1 bridge to prove the
product. PLANNED REPLACEMENT: retailer-direct flyer scraping. Do not treat this
as the permanent data source. Objection logged in build history.

Endpoint (public Flipp app search backend):
    GET https://backflipp.wishabi.com/flipp/items/search
        ?locale=en-ca&postal_code={POSTAL}&q={QUERY}

Returns JSON: {"items": [{name, current_price, merchant, valid_from, valid_to,
flyer_item_id, ...}, ...], "ecom_items": [...]}

Strategy:
- Query each of our 100 canonical SKUs
- Keep only results from merchants we DON'T scrape retailer-direct
  (Food Basics, Walmart, Sobeys, FreshCo, Giant Tiger). Loblaw banners
  (No Frills, Zehrs, Superstore) are scraped direct, so we skip them here
  to avoid double-sourcing.
- Map Flipp merchant names → our store IDs
- Carry valid_to → valid_until (weekly flyer model)

DIAGNOSTIC: dumps flipp_merchants.json = census of every unique merchant name
seen across all queries (with hit counts). Lets us see exactly what string
Flipp uses for Food Basics (or confirm it carries none for this postal).
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http, match, store

log = logging.getLogger("flipp")
RETAILER_SLUG = "flipp"

SEARCH_URL = "https://backflipp.wishabi.com/flipp/items/search"
POSTAL = "L2R3M3"  # St. Catharines

MERCHANT_TO_STORE = {
    "food basics": "foodbasics-welland",
    "walmart": "walmart-stcatharines",
    "sobeys": "sobeys-glendale",
    "freshco": "freshco-scott",
    "giant tiger": "gianttiger-stcatharines",
}

SKIP_MERCHANTS = ["no frills", "nofrills", "zehrs", "real canadian superstore", "superstore",
                  "independent", "fortinos", "valu-mart", "loblaws"]

try:
    from retailers.no_frills import PRICE_RANGES, MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS
except Exception:
    PRICE_RANGES = {}
    MIN_PLAUSIBLE_CENTS = 50
    MAX_PLAUSIBLE_CENTS = 10000


def get_range(slug: str):
    return PRICE_RANGES.get(slug, (MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS))


def map_merchant(merchant_name: str):
    if not merchant_name:
        return None
    low = merchant_name.lower()
    for skip in SKIP_MERCHANTS:
        if skip in low:
            return None
    for key, store_id in MERCHANT_TO_STORE.items():
        if key in low:
            return store_id
    return None


def fetch_flipp(query: str) -> list[dict]:
    url = f"{SEARCH_URL}?locale=en-ca&postal_code={POSTAL}&q={quote(query)}"
    r = http.get(url, headers={"Accept": "application/json"})
    try:
        data = r.json()
    except Exception:
        return []
    return list(data.get("items") or [])


def normalize_price(value):
    if value is None:
        return None
    try:
        return int(round(float(value) * 100))
    except (TypeError, ValueError):
        return None


def run(dry_run: bool = False) -> None:
    products = store.load_products()
    written = 0
    no_results = []
    skipped_merchant = 0
    merchant_census = Counter()       # every merchant name seen -> count
    foodbasics_samples = []           # raw items whose merchant looks like food basics
    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    AUTO_MATCH_THRESHOLD = 78
    first_dumped = False

    for product in products:
        query = product["name"]
        floor, ceiling = get_range(product["slug"])
        try:
            items = fetch_flipp(query)
        except Exception as e:
            log.warning("Flipp search failed for '%s': %s", query, e)
            continue

        if not first_dumped and items:
            (debug_dir / "flipp_first_response.json").write_text(json.dumps(items[:5], indent=2))
            first_dumped = True

        if not items:
            no_results.append(query)
            continue

        canon = [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}]
        best_per_store = {}

        for it in items:
            merchant = it.get("merchant") or it.get("merchant_name") or ""
            # DIAGNOSTIC census
            if merchant:
                merchant_census[merchant] += 1
                if "food" in merchant.lower() or "basics" in merchant.lower():
                    if len(foodbasics_samples) < 10:
                        foodbasics_samples.append({
                            "merchant": merchant,
                            "name": it.get("name"),
                            "current_price": it.get("current_price"),
                            "valid_to": it.get("valid_to"),
                        })

            store_id = map_merchant(merchant)
            if not store_id:
                skipped_merchant += 1
                continue

            name = (it.get("name") or it.get("title") or "").strip()
            if not name:
                continue
            price = normalize_price(it.get("current_price") or it.get("price"))
            if not price or not (floor <= price <= ceiling):
                continue

            m = match.best_match(name, canon)
            if not m or m["score"] < AUTO_MATCH_THRESHOLD:
                continue

            valid_to = it.get("valid_to") or it.get("end_date")
            valid_until = valid_to[:10] if isinstance(valid_to, str) else None

            prev = best_per_store.get(store_id)
            cand = {"name": name, "price_cents": price, "score": m["score"],
                    "valid_until": valid_until, "merchant": merchant}
            if not prev or price < prev["price_cents"]:
                best_per_store[store_id] = cand

        if not best_per_store:
            no_results.append(query)
            continue

        for store_id, cand in best_per_store.items():
            if dry_run:
                log.info("[dry] %s @ %s -> %s = $%.2f (valid %s)",
                         product["name"], store_id, cand["name"],
                         cand["price_cents"] / 100, cand["valid_until"] or "?")
                continue
            store.add_price(
                store_id=store_id,
                product_slug=product["slug"],
                price_cents=cand["price_cents"],
                was_price_cents=None,
                on_sale=True,
                source=f"flipp:{store_id.split('-')[0]}",
                valid_until=cand["valid_until"],
            )
            written += 1

    log.info("Done. Wrote %d flyer-deal prices. No results: %d. Skipped merchants: %d",
             written, len(no_results), skipped_merchant)
    log.info("Merchant census (top 25): %s",
             ", ".join(f"{m}({c})" for m, c in merchant_census.most_common(25)))
    if foodbasics_samples:
        log.info("FOOD BASICS-like merchants FOUND: %s",
                 sorted({s["merchant"] for s in foodbasics_samples}))
    else:
        log.info("NO Food Basics-like merchant appeared in any query for postal %s", POSTAL)

    (debug_dir / "flipp_summary.json").write_text(json.dumps({
        "wrote": written, "no_results_count": len(no_results),
        "skipped_merchant": skipped_merchant, "no_results": no_results[:25],
    }, indent=2))
    (debug_dir / "flipp_merchants.json").write_text(json.dumps({
        "postal": POSTAL,
        "unique_merchant_count": len(merchant_census),
        "merchant_census": dict(merchant_census.most_common()),
        "foodbasics_like_samples": foodbasics_samples,
    }, indent=2))


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
        log.info("Flushed %d total rows", result["price_count"])
