"""
Flipp (Wishabi) flyer scraper — BRIDGE SOURCE. v4: dam host item fetch.

⚠️ Sources from Flipp's backend, an aggregator. Owner decision (2026-05-22):
Phase-1 bridge. PLANNED REPLACEMENT: retailer-direct. Objection logged.

PROGRESS:
- v2: flyer ENUMERATION works (116 flyers, 78 merchants incl. Food Basics). ✓
- v3: found /items/search?flyer_id= IGNORES flyer_id — returns generic ecom_items
  (Shoppers/Brick/Hisense), NOT the flyer's grocery items. Dead end.
- v4: flyer-item data lives on dam.flippenterprise.net (page config meta-api_server).
  Try the dam host + several path shapes. _extract_items now REJECTS junk
  responses that only carry ecom_items/coupons/ads (no real flyer items).
  Dumps raw response of EVERY shape attempted for the first flyer.

Flyer-item endpoint candidates (per flyer_id):
  D) dam.flippenterprise.net/api/flipp/flyers/{id}/flyer_items
  E) dam.flippenterprise.net/api/flipp/flyers/{id}
  F) cdn-gateflipp.flippback.com/bf/flipp/flyers/{id}/flyer_items   (v2 guess, on cdn host)
  G) backflipp.wishabi.com/flipp/flyers/{id}/flyer_items
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http, match, store

log = logging.getLogger("flipp")
RETAILER_SLUG = "flipp"

# Host for flyer ENUMERATION (proven working in v2/v3)
FLYERS_HOSTS = [
    "https://cdn-gateflipp.flippback.com/bf/flipp",
    "https://backflipp.wishabi.com/flipp",
]
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

_flyers_host = {"base": None}
_item_shape = {"id": None}  # which item shape works: D/E/F/G

# Keys that mean "this is a real flyer-item list" vs junk (ecom/coupons)
REAL_ITEM_KEYS = ("flyer_items", "items")
JUNK_ONLY_KEYS = {"ecom_items", "coupons", "coupons_v2", "ads"}


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


def _http_json(url: str):
    try:
        r = http.get(url, headers={"Accept": "application/json"})
        return r.json()
    except Exception as e:
        log.debug("GET %s failed: %s", url, e)
        return None


def fetch_flyers() -> list[dict]:
    for base in FLYERS_HOSTS:
        data = _http_json(f"{base}/flyers?locale=en-ca&postal_code={POSTAL}")
        if data is None:
            continue
        _flyers_host["base"] = base
        if isinstance(data, list):
            return data
        for key in ("flyers", "items", "data"):
            if isinstance(data.get(key), list):
                return data[key]
    return []


def _extract_real_items(data):
    """Return a flyer-item list ONLY if it's real flyer items, not ecom/coupons junk."""
    if data is None:
        return []
    if isinstance(data, list):
        # bare list of items — accept if entries look like flyer items
        return data if data and isinstance(data[0], dict) else []
    if isinstance(data, dict):
        for key in REAL_ITEM_KEYS:
            v = data.get(key)
            if isinstance(v, list) and v:
                return v
        fl = data.get("flyer")
        if isinstance(fl, dict):
            for key in REAL_ITEM_KEYS:
                v = fl.get(key)
                if isinstance(v, list) and v:
                    return v
    return []


def item_shapes(flyer_id):
    return {
        "D": f"https://dam.flippenterprise.net/api/flipp/flyers/{flyer_id}/flyer_items?locale=en-ca",
        "E": f"https://dam.flippenterprise.net/api/flipp/flyers/{flyer_id}?locale=en-ca",
        "F": f"https://cdn-gateflipp.flippback.com/bf/flipp/flyers/{flyer_id}/flyer_items?locale=en-ca",
        "G": f"https://backflipp.wishabi.com/flipp/flyers/{flyer_id}/flyer_items?locale=en-ca",
    }


def fetch_flyer_items(flyer_id, debug_dir: Path, dump: bool) -> list[dict]:
    shapes = item_shapes(flyer_id)
    order = [_item_shape["id"]] if _item_shape["id"] else list(shapes.keys())
    for sid in order:
        if not sid:
            continue
        data = _http_json(shapes[sid])
        if dump:
            (debug_dir / f"flipp_itemfetch_raw_{sid}.json").write_text(
                json.dumps(data, indent=2)[:6000] if data is not None else "null")
        items = _extract_real_items(data)
        if items:
            _item_shape["id"] = sid
            log.info("Item shape '%s' works (%d items): %s", sid, len(items), shapes[sid])
            return items
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
    return (it.get("name") or it.get("title") or it.get("description")
            or it.get("item_name") or "").strip()


def item_price(it: dict):
    return normalize_price(it.get("current_price") or it.get("price")
                           or it.get("sale_price") or it.get("item_price"))


def run(dry_run: bool = False) -> None:
    products = store.load_products()
    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)
    AUTO_MATCH_THRESHOLD = 78

    flyers = fetch_flyers()
    log.info("Fetched %d flyers for %s via host %s", len(flyers), POSTAL, _flyers_host["base"])

    all_merchants = Counter()
    for f in flyers:
        m = merchant_of(f)
        if m:
            all_merchants[m] += 1

    (debug_dir / "flipp_flyers.json").write_text(json.dumps({
        "postal": POSTAL, "host": _flyers_host["base"], "flyer_count": len(flyers),
        "all_merchants": dict(all_merchants.most_common()),
        "sample_flyer": flyers[0] if flyers else None,
    }, indent=2))

    if not flyers:
        log.error("No flyers returned.")
        return

    wanted = []
    for f in flyers:
        m = merchant_of(f)
        sid = map_merchant(m)
        if sid:
            fid = f.get("id") or f.get("flyer_id")
            if fid is not None:
                wanted.append((fid, sid, m, f))
    log.info("Matched %d flyers: %s", len(wanted), sorted({w[2] for w in wanted}))

    written = 0
    per_store_items = Counter()
    dumped = False

    for fid, store_id, merchant, flyer in wanted:
        items = fetch_flyer_items(fid, debug_dir, dump=(not dumped))
        dumped = True
        log.info("Flyer %s (%s -> %s): %d items", fid, merchant, store_id, len(items))

        flyer_items = []
        for it in items:
            if not isinstance(it, dict):
                continue
            nm = item_name(it)
            pr = item_price(it)
            if nm and pr:
                flyer_items.append((nm, pr, valid_to_of(flyer, it)))

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
                log.info("[dry] %s @ %s -> %s = $%.2f", product["name"], store_id, nm, pr / 100)
                continue
            store.add_price(
                store_id=store_id, product_slug=product["slug"], price_cents=pr,
                was_price_cents=None, on_sale=True,
                source=f"flipp:{store_id.split('-')[0]}", valid_until=vto,
            )
            written += 1
            per_store_items[store_id] += 1

    log.info("Done. Wrote %d across stores: %s (item shape=%s)",
             written, dict(per_store_items), _item_shape["id"])
    (debug_dir / "flipp_summary.json").write_text(json.dumps({
        "flyers_host": _flyers_host["base"], "item_shape": _item_shape["id"],
        "flyer_count": len(flyers), "wanted_flyers": len(wanted),
        "wrote": written, "per_store": dict(per_store_items),
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
