"""
Food Basics scraper (Metro Inc. backend) — proxy-enabled.

Metro 403s bare requests AND Playwright. Path B: route through a residential
proxy (PacketStream) so the request comes from a real home IP that Akamai
can't distinguish from a normal shopper.

Set SCRAPER_PROXY_URL (GitHub secret) to enable. Without it, runs direct
(and will get blocked — that's expected without the proxy).

URL pattern:
    Search:  https://www.foodbasics.ca/search?filter={query}
    Product: https://www.foodbasics.ca/aisles/.../p/{UPC}   (10-14 digit UPC)
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import http, match, store

log = logging.getLogger("food-basics")
RETAILER_SLUG = "food-basics"

HOMEPAGE = "https://www.foodbasics.ca/"
SEARCH_URL_TEMPLATE = "https://www.foodbasics.ca/search?filter={query}"

PRODUCT_LINK_RE = re.compile(r'href="(/aisles/[^"]+/p/(\d{10,14}))"', re.IGNORECASE)
SALE_PRICE_RE = re.compile(
    r'sale[^$]{0,30}\$(\d+\.\d{2})[^$]{0,40}(?:was|reg|regular)[^$]{0,30}\$(\d+\.\d{2})',
    re.IGNORECASE,
)
PRICE_RE = re.compile(r'\$\s*(\d+\.\d{2})')
UNIT_SUFFIX_RE = re.compile(
    r'\s*/\s*(?:100\s*g|100g|1\s*kg|1kg|1\s*lb|1lb|kg|lb|oz|ml|l\b|ea\b|each|pkg|pk|pc|piece)',
    re.IGNORECASE,
)
IMG_ALT_RE = re.compile(r'<img[^>]+alt="([^"]+)"', re.IGNORECASE)

try:
    from retailers.no_frills import PRICE_RANGES, MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS
except Exception:
    PRICE_RANGES = {}
    MIN_PLAUSIBLE_CENTS = 50
    MAX_PLAUSIBLE_CENTS = 10000


def get_range(slug: str):
    return PRICE_RANGES.get(slug, (MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS))


def extract_shelf_price(context: str, floor: int, ceiling: int):
    sale = SALE_PRICE_RE.search(context)
    if sale:
        cur = int(round(float(sale.group(1)) * 100))
        was = int(round(float(sale.group(2)) * 100))
        if floor <= cur <= ceiling:
            return (cur, was, True)
    candidates = []
    for pm in PRICE_RE.finditer(context):
        after = context[pm.end():pm.end() + 30]
        if UNIT_SUFFIX_RE.match(after):
            continue
        cents = int(round(float(pm.group(1)) * 100))
        if floor <= cents <= ceiling:
            candidates.append(cents)
    if not candidates:
        return (None, None, False)
    return (sorted(candidates)[0], None, False)


def parse_products_from_html(html: str, floor: int, ceiling: int) -> list[dict]:
    matches = list(PRODUCT_LINK_RE.finditer(html))
    results = []
    seen = set()
    for i, m in enumerate(matches):
        upc = m.group(2)
        if upc in seen:
            continue
        seen.add(upc)
        ctx_start = matches[i - 1].end() if i > 0 else max(0, m.start() - 2000)
        context = html[ctx_start:m.start()]
        price, was, on_sale = extract_shelf_price(context, floor, ceiling)
        if not price:
            continue
        name = ""
        alts = IMG_ALT_RE.findall(context)
        if alts:
            name = re.sub(r'\s*\$[\d.]+/[\w%]+.*$', '', alts[-1]).strip()
        if not name:
            slug_m = re.search(r'/aisles/(?:[^/]+/)*([^/]+)/p/', m.group(1))
            if slug_m:
                name = slug_m.group(1).replace('-', ' ').title()
        if not name:
            continue
        results.append({
            "sku": upc, "name": name,
            "price_cents": price, "was_cents": was, "on_sale": on_sale,
        })
    return results


def run(dry_run: bool = False) -> None:
    retailer = store.get_retailer(RETAILER_SLUG)
    stores = store.get_stores_for_retailer(RETAILER_SLUG)
    products = store.load_products()

    if not stores:
        log.error("No %s stores configured.", RETAILER_SLUG)
        return

    debug_dir = Path("scrapers/data")
    debug_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    no_results = []
    review_log = []
    blocked = False
    AUTO_MATCH_THRESHOLD = 78

    use_proxy = http.get_proxy_url() is not None
    log.info("Proxy configured: %s", "YES" if use_proxy else "NO (direct — expect block)")

    with http.make_browser_session(use_proxy=use_proxy) as client:
        try:
            warm = http.session_get(client, HOMEPAGE)
            log.info("Warm-up homepage: %d, %d cookies", warm.status_code, len(client.cookies))
        except Exception as e:
            log.error("Warm-up failed: %s — blocked even via proxy? Check SCRAPER_PROXY_URL.", e)
            (debug_dir / "food_basics_blocked.txt").write_text(
                f"Warm-up failed: {e}\nProxy was {'ON' if use_proxy else 'OFF'}."
            )
            return

        for st in stores:
            log.info("Scraping %s", st["name"])
            for product in products:
                query = product["name"]
                floor, ceiling = get_range(product["slug"])
                url = SEARCH_URL_TEMPLATE.format(query=quote(query))
                try:
                    r = http.session_get(client, url, referer=HOMEPAGE)
                    html = r.text
                except Exception as e:
                    msg = str(e)
                    if "403" in msg:
                        blocked = True
                        log.error("403 on '%s' even via proxy.", query)
                        (debug_dir / "food_basics_blocked.txt").write_text(
                            f"403 on query '{query}'.\nProxy was {'ON' if use_proxy else 'OFF'}.\n"
                            f"Cookies: {len(client.cookies)}\n"
                            "If proxy ON and still 403: Metro fingerprints browser too — "
                            "need Playwright routed through the same proxy."
                        )
                        break
                    log.warning("Search failed for '%s': %s", query, e)
                    continue

                first = debug_dir / "food_basics_first_response.html"
                if not first.exists():
                    first.write_text(html)
                    log.info("Saved first response (%d bytes)", len(html))

                results = parse_products_from_html(html, floor, ceiling)
                if not results:
                    no_results.append(query)
                    continue

                picked, picked_score = None, 0
                canon = [{"id": product["rank"], "name": product["name"], "unit": product.get("unit", "")}]
                for cand in results[:8]:
                    best = match.best_match(cand["name"], canon)
                    if best and best["score"] > picked_score:
                        picked, picked_score = cand, best["score"]

                if not picked or picked_score < AUTO_MATCH_THRESHOLD:
                    if picked:
                        review_log.append({"query": query, "result_name": picked["name"], "score": picked_score})
                    else:
                        no_results.append(query)
                    continue

                if dry_run:
                    log.info("[dry] %s -> %s = $%.2f [match=%d]",
                             product["name"], picked["name"], picked["price_cents"] / 100, picked_score)
                    continue

                store.add_price(
                    store_id=st["id"], product_slug=product["slug"],
                    price_cents=picked["price_cents"], was_price_cents=picked["was_cents"],
                    on_sale=picked["on_sale"], source=f"scraper:{RETAILER_SLUG}",
                )
                written += 1
            if blocked:
                break

    log.info("Done. Wrote %d. No results: %d. Review: %d. Blocked: %s",
             written, len(no_results), len(review_log), blocked)
    summary = {
        "wrote": written, "blocked": blocked, "proxy_used": use_proxy,
        "no_results_count": len(no_results), "review_count": len(review_log),
        "no_results": no_results[:20], "review": review_log[:20],
    }
    (debug_dir / "food_basics_summary.json").write_text(json.dumps(summary, indent=2))


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
