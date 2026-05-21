"""JSON writer — scrapers buffer prices, then flush to data/prices/latest.json.

Merge policy: existing SEED prices are preserved (so all 100 SKUs show
something in the UI). Existing SCRAPER prices are DROPPED on each run —
the new run is the source of truth for that retailer. This prevents stale
bad data from previous scraper versions surviving fixes.
"""
import json
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


def add_price(*, store_id: str, product_slug: str, price_cents: int,
              was_price_cents: Optional[int], on_sale: bool, source: str) -> None:
    with _lock:
        _buffer.append({
            "store_id": store_id, "product_slug": product_slug,
            "price_cents": price_cents, "was_price_cents": was_price_cents,
            "on_sale": on_sale, "source": source,
        })


def flush(merge_with_seed: bool = True) -> dict:
    """
    Write the buffer to data/prices/latest.json.

    Policy:
    - Buffer (new scraped prices) ALWAYS wins for its (store, product) keys.
    - Seed prices ('seed-*') from existing file are preserved as fallback
      for (store, product) keys not in the buffer.
    - Previous scraper prices are DISCARDED unless their store+product was
      not scraped this run. This means: when scraper drops a SKU (e.g.
      because v5 rejected it), the OLD bad scraper value goes away too.

    Why: prevents stale bad data from earlier scraper versions polluting
    the dataset after fixes.
    """
    from datetime import date

    out_path = DATA / "prices" / "latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Collect which (store, product) pairs the current scrape touched
    with _lock:
        new_keys = {(p["store_id"], p["product_slug"]) for p in _buffer}
        # Group buffered prices by which retailer they came from
        retailers_scraped = {p["source"].replace("scraper:", "")
                             for p in _buffer if p["source"].startswith("scraper:")}

    final_prices: dict[tuple, dict] = {}

    if merge_with_seed and out_path.exists():
        existing = json.loads(out_path.read_text())
        config = load_config()
        store_to_retailer = {s["id"]: s["retailer_slug"] for s in config["stores"]}

        for p in existing.get("prices", []):
            key = (p["store_id"], p["product_slug"])
            src = p.get("source", "")

            # Always keep seed prices that weren't re-scraped
            if src.startswith("seed-"):
                final_prices[key] = p
                continue

            # For scraper prices: keep ONLY if this retailer wasn't scraped this run
            # (i.e., we're not touching this retailer's data, so preserve last good state)
            if src.startswith("scraper:"):
                retailer = src.replace("scraper:", "")
                if retailer not in retailers_scraped:
                    # This retailer wasn't scraped this run — keep its last data
                    final_prices[key] = p
                # else: drop the old scraper data, let the new buffer overwrite

    # Now apply the new buffer (always wins)
    with _lock:
        for p in _buffer:
            final_prices[(p["store_id"], p["product_slug"])] = p
        _buffer.clear()

    rows = list(final_prices.values())
    payload = {
        "generated_at": date.today().isoformat(),
        "store_count": len({r["store_id"] for r in rows}),
        "product_count": len({r["product_slug"] for r in rows}),
        "price_count": len(rows),
        "prices": rows,
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return payload
