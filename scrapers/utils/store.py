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


def flush(merge_with_seed: bool = True) -> dict:
    """
    Write the buffer to data/prices/latest.json.

    Policy:
    - Buffer (new scraped prices) ALWAYS wins for its (store, product) keys.
    - Seed prices ('seed-*') from existing file are preserved as fallback
      for (store, product) keys not in the buffer.
    - Previous scraper prices are DISCARDED unless their store+product was
      not scraped this run.
    """
    out_path = DATA / "prices" / "latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with _lock:
        retailers_scraped = {p["source"].replace("scraper:", "")
                             for p in _buffer if p["source"].startswith("scraper:")}

    final_prices: dict[tuple, dict] = {}

    if merge_with_seed and out_path.exists():
        existing = json.loads(out_path.read_text())
        for p in existing.get("prices", []):
            key = (p["store_id"], p["product_slug"])
            src = p.get("source", "")
            if src.startswith("seed-"):
                final_prices[key] = p
                continue
            if src.startswith("scraper:"):
                retailer = src.replace("scraper:", "")
                if retailer not in retailers_scraped:
                    final_prices[key] = p

    with _lock:
        for p in _buffer:
            final_prices[(p["store_id"], p["product_slug"])] = p
        _buffer.clear()

    rows = list(final_prices.values())
    payload = {
        "generated_at": date.today().isoformat(),
        "flyer_week_expiry": next_flyer_expiry(),
        "store_count": len({r["store_id"] for r in rows}),
        "product_count": len({r["product_slug"] for r in rows}),
        "price_count": len(rows),
        "prices": rows,
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return payload
