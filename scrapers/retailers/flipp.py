"""
Flipp (Wishabi) flyer scraper — BRIDGE SOURCE. v3: flyer-enum + robust item fetch.

⚠️ Sources from Flipp's backend, an aggregator. Owner decision (2026-05-22):
Phase-1 bridge. PLANNED REPLACEMENT: retailer-direct. Objection logged.

v2 proved flyer ENUMERATION works (116 flyers, 78 merchants incl. Food Basics)
but item-fetch returned 0 — wrong item endpoint. v3 tries multiple known Flipp
item-endpoint shapes per flyer and dumps the first raw response for inspection:
  A) /items/search?flyer_id={id}&locale=&postal_code=   (search filtered by flyer)
  B) /flyers/{id}?locale=                                 (flyer w/ embedded items)
  C) /flyers/{id}/flyer_items?locale=                     (v2's guess)
First shape that yields items wins and is reused for all flyers.
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

HOSTS = [
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

_host = {"base": None}
_item_shape = {"id": None}  # which item-endpoint shape works: 'A','B','C'


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


def _get_json(path: str, force_host: str | None = None):
    hosts = [force_host] if force_host else ([_host["base"]] if _host["base"] else HOSTS)
    for base in hosts:
        if not base:
            continue
        url = f"{base}{path}"
        try:
            r = http.get(url, headers={"Accept": "application/json"})
            data = r.json()
            if not force_host:
                _host["base"] = base
            return data, base
        except Exception as e:
            log.debug("host %s failed for %s: %s", base, path, e)
            continue
    return None, None


def fetch_flyers() -> list[dict]:
    data, _ = _get_json(f"/flyers?locale=en-ca&postal_code={POSTAL}")
    if data is None:
        return []
    if isinstance(data, list):
        return data
    for key in ("flyers", "items", "data"):
        if isinstance(data.get(key), list):
            return data[key]
    return []


def _extract_items(data):
    """Pull an item list out of whatever shape the response is."""
    if data is None:
        return []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # direct item arrays
        for key in ("items", "flyer_items", "data", "results"):
            v = data.get(key)
            if isinstance(v, list) and v:
                return v
        # nested under 'flyer'
        fl = data.get("flyer")
        if isinstance(fl, dict):
            for key in ("items", "flyer_items"):
                v = fl.get(key)
                if isinstance(v, list) and v:
                    return v
    return []


def fetch_flyer_items(flyer_id, debug_dir: Path, dump: bool) -> list[dict]:
    base = _host["base"] or HOSTS[0]
    shapes = {
        "A": f"/items/search?locale=en-ca&postal_code={POSTAL}&flyer_id={flyer_id}",
        "B": f"/flyers/{flyer_id}?locale=en-ca",
        "C": f"/flyers/{flyer_id}/flyer_items?locale=en-ca",
    }
    # If we already know which shape works, use only it
    order = [_item_shape["id"]] if _item_shape["id"] else ["A", "B", "C"]
    for sid in order:
        if not sid:
            continue
        data, _ = _get_json(shapes[sid], force_host=base)
        if dump:
            (debug_dir / f"flipp_itemfetch_raw_{sid}.json").write_text(
                json.dumps(data, indent=2)[:8000] if data is not None else "null")
        items = _extract_items(data)
        if items:
            _item_shape["id"] = sid
            log.info("Item-endpoint shape '%s' works (%d items)", sid, len(items))
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
    log.info("Fetched %d flyers for %s via host %s", len(flyers), POSTAL, _host["base"])

    all_merchants = Counter()
    for f in flyers:
        m = merchant_of(f)
        if m:
            all_merchants[m] += 1

    (debug_dir / "flipp_flyers.json").write_text(json.dumps({
        "postal": POSTAL, "host": _host["base"], "flyer_count": len(flyers),
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
        if not dumped:
            dumped = True  # only dump raw for the first flyer attempt
        log.info("Flyer %s (%s -> %s): %d items", fid, merchant, store_id, len(items))

        flyer_items = []
        for it in items:
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
        "host": _host["base"], "item_shape": _item_shape["id"],
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
