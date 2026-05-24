"""
One-shot OCR viability test on real Flipp cutout images.

Question: Flipp's per-item `cutout_image_url` is an isolated product photo. Can
OCR read the SIZE/COUNT off it ("BAG OF 5", "454 G", "/lb") for the items where
size is NOT in the name string? This decides whether per-unit comparison is
achievable while staying 100% on Flipp/flyers.

Fetches a Food Basics flyer's items, picks a sample biased toward produce/pack
items (where size is image-only), downloads each cutout, runs Tesseract, and
dumps name + price + OCR text to scrapers/data/flipp_ocr_test.json.

Requires: tesseract-ocr (apt), pytesseract, pillow (pip).
"""
from __future__ import annotations
import json
import sys
import io
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http

POSTAL = "L2R3M3"


def gj(url):
    try:
        return http.get(url, headers={"Accept": "application/json"}).json()
    except Exception as e:
        print("ERR json", url, e)
        return None


def main():
    out = Path("scrapers/data")
    out.mkdir(parents=True, exist_ok=True)

    try:
        import pytesseract
        from PIL import Image
    except Exception as e:
        (out / "flipp_ocr_test.json").write_text(json.dumps({"error": f"deps missing: {e}"}))
        print("deps missing", e)
        return

    data = gj(f"https://cdn-gateflipp.flippback.com/bf/flipp/flyers?locale=en-ca&postal_code={POSTAL}")
    flyers = data if isinstance(data, list) else (data or {}).get("flyers", [])
    target = None
    for f in flyers:
        if "food basics" in (f.get("merchant") or f.get("merchant_name") or "").lower():
            target = f
            break
    if not target:
        print("no food basics flyer")
        return
    fid = target.get("id") or target.get("flyer_id")
    items_data = gj(f"https://dam.flippenterprise.net/api/flipp/flyers/{fid}/flyer_items?locale=en-ca")
    items = items_data if isinstance(items_data, list) else (items_data or {}).get("items") or (items_data or {}).get("flyer_items") or []

    keywords = ["avocado", "pepper", "grape", "cucumber", "onion", "potato", "apple",
                "orange", "banana", "lemon", "lime", "tomato", "mango", "berries",
                "chicken", "beef", "pork", "fish", "shrimp"]
    picked = []
    for it in items:
        nm = (it.get("name") or "").lower()
        if not it.get("cutout_image_url"):
            continue
        if any(k in nm for k in keywords):
            picked.append(it)
        if len(picked) >= 12:
            break
    if len(picked) < 12:
        for it in items:
            if it.get("cutout_image_url") and it not in picked:
                picked.append(it)
            if len(picked) >= 12:
                break

    results = []
    for it in picked:
        url = it.get("cutout_image_url")
        rec = {"name": it.get("name"), "price": it.get("price"), "url": url}
        try:
            raw = http.get(url).content
            im = Image.open(io.BytesIO(raw))
            txt = pytesseract.image_to_string(im)
            rec["ocr_text"] = " | ".join(t.strip() for t in txt.splitlines() if t.strip())
            rec["img_size"] = f"{im.width}x{im.height}"
        except Exception as e:
            rec["ocr_text"] = f"ERR: {e}"
        results.append(rec)

    (out / "flipp_ocr_test.json").write_text(json.dumps({
        "flyer_id": fid, "tested": len(results), "results": results,
    }, indent=2))
    print(f"OCR-tested {len(results)} cutout images.")


if __name__ == "__main__":
    main()
