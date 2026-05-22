"""
Flipp (Wishabi) flyer scraper — BRIDGE SOURCE. v2: flyer-enumeration approach.

⚠️ Sources from Flipp's backend, an aggregator. Per explicit owner decision
(2026-05-22): Phase-1 bridge to prove the product. PLANNED REPLACEMENT:
retailer-direct flyer scraping. Objection logged in build history.

WHY v2: v1 used items/search with our 100 product names and only read the
`items` array. That MISSED Food Basics even though its flyer is on Flipp —
because our search terms didn't match Food Basics' item titles. v2 instead:
  1. ENUMERATE all flyers for the postal code  (GET /flyers?postal_code=)
  2. For each flyer of a merchant we want, pull ALL its items
     (GET /flyers/{flyer_id}/flyer_items)
  3. Match those complete-flyer items against our 100 SKUs
This reads entire flyers (not search-filtered), so we catch every merchant
Flipp carries — Food Basics now, and the dozens of other stores later.

Endpoints (Flipp's own web app uses these — from flipp.com page config):
  flyers list:  https://cdn-gateflipp.flippback.com/bf/flipp/flyers?locale=en-ca&postal_code={P}
  flyer items:  https://cdn-gateflipp.flippback.com/bf/flipp/flyers/{flyer_id}/flyer_items?locale=en-ca
  (fallback host: backflipp.wishabi.com/flipp/...)
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

HOSTS = [
    "https://cdn-gateflipp.flippback.com/bf/flipp",
    "https://backflipp.wishabi.com/flipp",
]
POSTAL = "L2R3M3"  # St. Catharines

# Merchants we map into the comparison (the ones we DON'T scrape retailer-direct).
MERCHANT_TO_STORE = {
    "food basics": "foodbasics-welland",
    "walmart": "walmart-stcatharines",
    "sobeys": "sobeys-glendale",
    "freshco": "freshco-scott",
    "giant tiger": "gianttiger-stcatharines",
}
# Loblaw banners we scrape retailer-direct — skip in Flipp to avoid double-source.
SKIP_MERCHANTS = ["no frills", "nofrills", "zehrs", "real canadian superstore", "superstore",
                  "independent", "fortinos", "valu-mart", "loblaws"]

try:
    from retailers.no_frills import PRICE_RANGES, MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS
except Exception:
    PRICE_RANGES = {}
    MIN_PLAUSIBLE_CENTS = 50
    MAX_PLAUSIBLE_CENTS = 10000

_host = {"base": None}  # remember which host works


def get_range(slug: str):
    return PRICE_RANGES.get(slug, (MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS))


def map_merchant(name: str):
    if not name:
        return None
    low = name.lower()
    for skip in SKIP_MERCHANTS:
        if skip in low:
            return None
    for key, store_id in MERCHANT_TO_STORE.items():
        if key in low:
            return store_id
    return None


def _get_json(path: str):
    """GET {host}{path} trying each host; returns parsed JSON or None."""
    hosts = [_host["base"]] if _host["base"] else HOSTS
    for base in hosts:
        if not base:
            continue
        url = f"{base}{path}"
        try:
            r = http.get(url, headers={"Accept": "application/json"})
            data = r.json()
            _host["base"] = base
            return data
        except Exception as e:
            log.debug("host %s failed for %s: %s", base, path, e)
            continue
    return None


def fetch_flyers() -> list[dict]:
    """All flyers live for the postal code. Each has id, merchant, valid dates."""
    sep = "&" if "?" in "" else "?"
    data = _get_json(f"/flyers?locale=en-ca&postal_code={POSTAL}")
    if data is None:
        return []
    # Response may be a bare list or wrapped under a key
    if isinstance(data, list):
        return data
    for key in ("flyers", "items", "data"):
        if isinstance(data.get(key), list):
            return data[key]
    return []


def fetch_flyer_items(flyer_id) -> list[dict]:
    data = _get_json(f"/flyers/{flyer_id}/flyer_items?locale=en-ca")
    if data is None:
        return []
    if isinstance(data, list):
        return data
    for key in ("items", "flyer_items", "data"):
        if isinstance(data.get(key), list):
            return data[key]
    return []


def normalize_price(value):
    if value is None:
        return None
    try:
        return int(round(float(value) * 100))
    except (TypeError, ValueError):
        return None


def merchant_of(flyer: dict) -> str:
    return (flyer.get("merchant") or flyer.get("merchant_name")
            or flyer.get("name") or "").strip()


def valid_to_of(flyer: dict, item: dict):
    v = (item.get("valid_to") or item.get("end_date")
         or flyer.get("valid_to") or flyer.get("end_date"))
    return v[:10] if isinstance(v, str) else None


def item_name(it: dict) -> str:
    return (it.get("name") or it.get("title") or it.get("description") or "").strip()


def item_price(it: dict):
    return normalize_price(it.get("current_price") or it.get("price")
                           or it.get("sale_price") or it.get("item_price"))


def run(dry_run: bool = False) -> None:
    products = store.load_products()
    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    AUTO_MATCH_THRESHOLD = 78

    flyers = fetch_flyers()
    log.info("Fetched %d flyers for %s via host %s", len(flyers), POSTAL, _host["base"])

    # Census of every merchant Flipp carries here (for the "dozens of stores" map)
    all_merchants = Counter()
    for f in flyers:
        m = merchant_of(f)
        if m:
            all_merchants[m] += 1

    # Dump the full flyer list + merchant census for inspection
    (debug_dir / "flipp_flyers.json").write_text(json.dumps({
        "postal": POSTAL, "host": _host["base"],
        "flyer_count": len(flyers),
        "all_merchants": dict(all_merchants.most_common()),
        "sample_flyer": flyers[0] if flyers else None,
    }, indent=2))

    if not flyers:
        log.error("No flyers returned — endpoint shape differs. See flipp_flyers.json (empty).")
        return

    # Which flyers map to a store we want?
    wanted = []
    for f in flyers:
        m = merchant_of(f)
        sid = map_merchant(m)
        if sid:
            fid = f.get("id") or f.get("flyer_id")
            if fid is not None:
                wanted.append((fid, sid, m, f))

    log.info("Matched %d flyers to our stores: %s",
             len(wanted), sorted({w[2] for w in wanted}))

    written = 0
    per_store_items = Counter()
    first_items_dumped = False

    for fid, store_id, merchant, flyer in wanted:
        items = fetch_flyer_items(fid)
        if not first_items_dumped and items:
            (debug_dir / "flipp_flyer_items_sample.json").write_text(
                json.dumps(items[:8], indent=2))
            first_items_dumped = True
        log.info("Flyer %s (%s -> %s): %d items", fid, merchant, store_id, len(items))

        # Build candidate (name, price) list once per flyer
        flyer_items = []
        for it in items:
            nm = item_name(it)
            pr = item_price(it)
            if nm and pr:
                flyer_items.append((nm, pr, valid_to_of(flyer, it)))

        # Match each of our products against this flyer's items
        for product in products:
            floor, ceiling = get_range(product["slug"])
            canon = [{"id": product["rank"], "name": product["name"],
                      "unit": product.get("unit", "")}]
            best = None
            for nm, pr, vto in flyer_items:
                if not (floor <= pr <= ceiling):
                    continue
                mm = match.best_match(nm, canon)
                if not mm or mm["score"] < AUTO_MATCH_THRESHOLD:
                    continue
                if best is None or pr < best[1]:
                    best = (nm, pr, vto, mm["score"])
            if not best:
                continue
            nm, pr, vto, sc = best
            if dry_run:
                log.info("[dry] %s @ %s -> %s = $%.2f (valid %s)",
                         product["name"], store_id, nm, pr / 100, vto or "?")
                continue
            store.add_price(
                store_id=store_id,
                product_slug=product["slug"],
                price_cents=pr,
                was_price_cents=None,
                on_sale=True,
                source=f"flipp:{store_id.split('-')[0]}",
                valid_until=vto,
            )
            written += 1
            per_store_items[store_id] += 1

    log.info("Done. Wrote %d flyer-deal prices across stores: %s",
             written, dict(per_store_items))
    (debug_dir / "flipp_summary.json").write_text(json.dumps({
        "host": _host["base"],
        "flyer_count": len(flyers),
        "wanted_flyers": len(wanted),
        "wrote": written,
        "per_store": dict(per_store_items),
        "all_merchants": dict(all_merchants.most_common()),
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
