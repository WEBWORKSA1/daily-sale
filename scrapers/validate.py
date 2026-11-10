#!/usr/bin/env python3
"""Gate before committing: refuse to publish an empty or broken price file."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
p = ROOT / "data" / "prices" / "latest.json"
MIN_ROWS = 20

try:
    d = json.loads(p.read_text())
except Exception as e:
    print(f"::error::latest.json unreadable: {e}")
    sys.exit(1)

rows = d.get("prices", [])
stores = {r["store_id"] for r in rows}
print(f"generated_at={d.get('generated_at')} expiry={d.get('flyer_week_expiry')} "
      f"rows={len(rows)} stores={len(stores)} products={d.get('product_count')} dropped={d.get('dropped')}")
for s in sorted(stores):
    print(f"  {s}: {sum(1 for r in rows if r['store_id'] == s)}")

if len(rows) < MIN_ROWS:
    print(f"::error::only {len(rows)} price rows (< {MIN_ROWS}); not publishing")
    sys.exit(1)
