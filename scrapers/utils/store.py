"""JSON writer — scrapers buffer prices, then flush to data/prices/latest.json.

Merge policy: existing SEED prices are preserved (so all 100 SKUs show
something in the UI). Existing SCRAPER prices are DROPPED on each run —
the new run is the source of truth for that retailer. This prevents stale
bad data from previous scraper versions surviving fixes.

Weekly-flyer model: each price can carry a valid_until date (the flyer's
expiry, usually the next Wednesday). The UI shows "deals valid through X".
"""
import json
from datetime import date, timedelta
from pathlib import Path
from threading import Lock
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "data"

_lock = Lock()
_buffer: list[dict] = []


def load_config() -> dict:
    return json.loads((DATA / "config.json").read_text())


def load_products() -> list[dict]:
    return json.loads((DATA / "products.json").read_text())


def get_retailer(slug: str) -> Optional[dict]:
    for r in load_config()["retailers"]:
        if r["slug"] == slug:
            return r
    return None


def get_stores_for_retailer(slug: str) -> list[dict]:
    return [s for s in load_config()["stores"] if s["retailer_slug"] == slug]


def next_flyer_expiry() -> str:
    """Canadian grocery flyers run Thu–Wed. Return the upcoming Wednesday (ISO date)."""
    today = date.today()
    # weekday(): Mon=0 ... Wed=2 ... Sun=6
    days_until_wed = (2 - today.weekday()) % 7
    if days_until_wed == 0:
        days_until_wed = 7  # today is Wed → next Wed
    return (today + timedelta(days=days_until_wed)).isoformat()


def add_price(*, store_id: str, product_slug: str, price_cents: int,
              was_price_cents: Optional[int], on_sale: bool, source: str,
              valid_until: Optional[str] = None) -> None:
    with _lock:
        _buffer.append({
            "store_id": store_id, "product_slug": product_slug,
            "price_cents": price_cents, "was_price_cents": was_price_cents,
            "on_sale": on_sale, "source": source,
            "valid_until": valid_until or next_flyer_expiry(),
        })


# Sanity bounds vs data/reference_prices.json (typical regular price per SKU).
# Mirrors lib/data.ts so bad matches never reach the site.
MIN_RATIO_PRODUCE = 0.25
MIN_RATIO = 0.40
MAX_RATIO = 3.0


def _load_reference() -> dict:
    p = DATA / "reference_prices.json"
    try:
        return json.loads(p.read_text())
    except Exception:
        return {}


def _plausible(row: dict, reference: dict, category_by_slug: dict) -> bool:
    cents = row.get("price_cents") or 0
    if cents <= 0:
        return False
    ref = reference.get(row.get("product_slug"))
    if not ref:
        return True
    floor = MIN_RATIO_PRODUCE if category_by_slug.get(row.get("product_slug")) == "produce" else MIN_RATIO
    ratio = cents / ref
    return floor <= ratio <= MAX_RATIO


def _source_family(src: str) -> str:
    """'flipp:walmart' -> 'flipp:walmart', 'scraper:no-frills' -> 'scraper:no-frills', 'seed-x' -> 'seed'."""
    return "seed" if src.startswith("seed-") else src


def flush(merge_with_seed: bool = True) -> dict:
    """
    Write the buffer to data/prices/latest.json.

    Policy (safe for daily runs and partial failures):
    - Buffer rows (this run) always win for their (store, product) key.
    - Existing rows whose source family was re-scraped this run are dropped
      (the new run is the truth for that retailer/source).
    - Existing rows from sources NOT scraped this run are kept while their
      flyer is still valid, so one failing scraper never blanks the site.
    - Expired rows (valid_until < today) are dropped.
    - Implausible prices (vs reference_prices.json) are dropped.
    """
    out_path = DATA / "prices" / "latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    reference = _load_reference()
    category_by_slug = {p["slug"]: p.get("category") for p in load_products()}

    with _lock:
        fresh_sources = {_source_family(p["source"]) for p in _buffer}

    final_prices: dict[tuple, dict] = {}
    dropped = {"expired": 0, "implausible": 0, "replaced": 0}

    if merge_with_seed and out_path.exists():
        try:
            existing = json.loads(out_path.read_text())
        except Exception:
            existing = {}
        for p in existing.get("prices", []):
            src = p.get("source", "")
            fam = _source_family(src)
            if fam in fresh_sources:
                dropped["replaced"] += 1
                continue
            if p.get("valid_until") and p["valid_until"] < today and not src.startswith("seed-"):
                dropped["expired"] += 1
                continue
            final_prices[(p["store_id"], p["product_slug"])] = p

    with _lock:
        for p in _buffer:
            if not _plausible(p, reference, category_by_slug):
                dropped["implausible"] += 1
                continue
            final_prices[(p["store_id"], p["product_slug"])] = p
        _buffer.clear()

    rows = sorted(final_prices.values(), key=lambda r: (r["product_slug"], r["price_cents"]))
    from collections import Counter
    expiries = Counter(r.get("valid_until") for r in rows if r.get("valid_until") and r.get("valid_until") >= today)
    payload = {
        "generated_at": today,
        "flyer_week_expiry": expiries.most_common(1)[0][0] if expiries else next_flyer_expiry(),
        "store_count": len({r["store_id"] for r in rows}),
        "product_count": len({r["product_slug"] for r in rows}),
        "price_count": len(rows),
        "dropped": dropped,
        "prices": rows,
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return payload
