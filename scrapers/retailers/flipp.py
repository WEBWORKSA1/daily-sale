"""
Flipp (Wishabi) flyer scraper — BRIDGE SOURCE. v6: hybrid anchor+fuzzy matching.

⚠️ Sources from Flipp's backend, an aggregator. Owner decision (2026-05-22):
Phase-1 bridge. PLANNED REPLACEMENT: retailer-direct. Objection logged.

PROGRESS:
- v2: flyer ENUMERATION works (116 flyers, 78 merchants incl. Food Basics). ✓
- v3: /items/search?flyer_id= IGNORES flyer_id (returns generic ecom). Dead end.
- v4: shape D works — dam.flippenterprise.net/api/flipp/flyers/{id}/flyer_items. ✓
- v5: per-flyer diagnostics — found Food Basics returns 391 items with brand-led
  names ("SELECTION SALTED OR UNSALTED BUTTER") that fuzzy-78 can't match.
- v6: HYBRID matching. If a product slug has an anchor spec (utils/anchors.py),
  require its core keyword(s) as whole words + reject lookalikes; else fall back
  to fuzzy token_set_ratio >= 78. Anchors tested vs real Food Basics flyer.

Flyer-item endpoint (locked): shape D.
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
from utils.anchors import ANCHORS, anchor_match

log = logging.getLogger("flipp")
RETAILER_SLUG = "flipp"

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

REAL_ITEM_KEYS = ("flyer_items", "items")
AUTO_MATCH_THRESHOLD = 78


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
    if data is None:
        return []
    if isinstance(data, list):
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


def fetch_flyer_items(flyer_id) -> list[dict]:
    url = f"https://dam.flippenterprise.net/api/flipp/flyers/{flyer_id}/flyer_items?locale=en-ca"
    return _extract_real_items(_http_json(url))


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


def match_product(name: str, product: dict):
    """Hybrid: anchor match if slug has a spec, else fuzzy token_set_ratio >= 78.
    Returns a comparable score (anchors return 100) or None."""
    slug = product["slug"]
    if slug in ANCHORS:
        return 100 if anchor_match(name, slug) else None
    canon = [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}]
    mm = match.best_match(name, canon)
    if mm and mm["score"] >= AUTO_MATCH_THRESHOLD:
        return mm["score"]
    return None


def run(dry_run: bool = False) -> None:
    products = store.load_products()
    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)

    flyers = fetch_flyers()
    log.info("Fetched %d flyers for %s via host %s", len(flyers), POSTAL, _flyers_host["base"])

    all_merchants = Counter()
    for f in flyers:
        m = merchant_of(f)
        if m:
            all_merchants[m] += 1

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
    flyer_diag = []

    for fid, store_id, merchant, flyer in wanted:
        items = fetch_flyer_items(fid)
        usable = []
        for it in items:
            if not isinstance(it, dict):
                continue
            nm = item_name(it)
            pr = item_price(it)
            if nm and pr:
                usable.append((nm, pr, valid_to_of(flyer, it)))

        store_written = 0
        for product in products:
            floor, ceiling = get_range(product["slug"])
            best = None  # (name, price, valid_until, score)
            for nm, pr, vto in usable:
                if not (floor <= pr <= ceiling):
                    continue
                sc = match_product(nm, product)
                if sc is None:
                    continue
                if best is None or pr < best[1]:
                    best = (nm, pr, vto, sc)
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
            store_written += 1
            per_store_items[store_id] += 1

        flyer_diag.append({
            "merchant": merchant, "store_id": store_id, "flyer_id": fid,
            "raw_items": len(items), "usable_items": len(usable),
            "matched": store_written,
        })
        log.info("Flyer %s (%s): %d raw, %d usable, %d matched",
                 fid, merchant, len(items), len(usable), store_written)

    log.info("Done. Wrote %d across stores: %s", written, dict(per_store_items))
    (debug_dir / "flipp_summary.json").write_text(json.dumps({
        "flyers_host": _flyers_host["base"], "item_shape": "D",
        "flyer_count": len(flyers), "wanted_flyers": len(wanted),
        "wrote": written, "per_store": dict(per_store_items),
        "flyer_diagnostics": flyer_diag,
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
