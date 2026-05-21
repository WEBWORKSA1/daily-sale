"""JSON writer — scrapers buffer prices, then flush to data/prices/latest.json."""
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
    from datetime import date
    out_path = DATA / "prices" / "latest.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if merge_with_seed and out_path.exists():
        existing = json.loads(out_path.read_text())
        existing_prices = {(p["store_id"], p["product_slug"]): p for p in existing.get("prices", [])}
    else:
        existing_prices = {}
    with _lock:
        for p in _buffer:
            existing_prices[(p["store_id"], p["product_slug"])] = p
        _buffer.clear()
    rows = list(existing_prices.values())
    payload = {
        "generated_at": date.today().isoformat(),
        "store_count": len({r["store_id"] for r in rows}),
        "product_count": len({r["product_slug"] for r in rows}),
        "price_count": len(rows),
        "prices": rows,
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return payload
