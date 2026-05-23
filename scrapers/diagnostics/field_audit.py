"""
One-shot diagnostic: dump EVERY field Flipp returns per flyer item.

Purpose: test the hypothesis "the size/count data is there, just unused."
We currently read only name + current_price. This dumps the COMPLETE raw item
object for a Food Basics flyer (the produce-heavy one) so we can see whether
Flipp exposes size, count, unit, pre/post-price text, or sale-story fields we've
been ignoring — vs. confirming the size is image-only.

Writes scrapers/data/flipp_field_audit.json.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http

POSTAL = "L2R3M3"
FLYERS_URL = f"https://cdn-gateflipp.flippback.com/bf/flipp/flyers?locale=en-ca&postal_code={POSTAL}"


def gj(url):
    try:
        return http.get(url, headers={"Accept": "application/json"}).json()
    except Exception as e:
        print("ERR", url, e)
        return None


def main():
    out = Path("scrapers/data")
    out.mkdir(parents=True, exist_ok=True)

    data = gj(FLYERS_URL)
    flyers = data if isinstance(data, list) else (data or {}).get("flyers", [])
    # find a Food Basics flyer (produce-heavy, where count/pack matters)
    target = None
    for f in flyers:
        m = (f.get("merchant") or f.get("merchant_name") or "").lower()
        if "food basics" in m:
            target = f
            break
    if not target:
        target = flyers[0] if flyers else None
    if not target:
        print("no flyers")
        return

    fid = target.get("id") or target.get("flyer_id")
    merchant = target.get("merchant") or target.get("merchant_name")
    items_data = gj(f"https://dam.flippenterprise.net/api/flipp/flyers/{fid}/flyer_items?locale=en-ca")
    items = items_data if isinstance(items_data, list) else (items_data or {}).get("items") or (items_data or {}).get("flyer_items") or []

    # Collect the UNION of all keys across items, plus 5 full sample items
    all_keys = {}
    for it in items:
        if isinstance(it, dict):
            for k, v in it.items():
                all_keys[k] = all_keys.get(k, 0) + (1 if v not in (None, "", []) else 0)

    audit = {
        "merchant": merchant,
        "flyer_id": fid,
        "item_count": len(items),
        "ALL_FIELDS_with_nonempty_counts": dict(sorted(all_keys.items(), key=lambda x: -x[1])),
        "FLYER_OBJECT_fields": list(target.keys()),
        "five_full_sample_items": items[:5],
    }
    (out / "flipp_field_audit.json").write_text(json.dumps(audit, indent=2)[:60000])
    print(f"Audited {len(items)} items from {merchant}. Fields found: {list(all_keys.keys())}")


if __name__ == "__main__":
    main()
