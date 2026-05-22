"""
Food Basics scraper — Playwright (headless Chromium) edition.

Path A: try to beat Metro's Akamai bot detection with a real browser +
stealth evasions, running free on GitHub Actions.

If this proves unreliable (works some days, blocked others), we fall back to
Path C (weekly flyer PDF extraction). Detection of the Akamai block page is
built in so we KNOW when it's blocked rather than silently returning bad data.

Flow:
  1. Launch Chromium with realistic fingerprint (viewport, locale, timezone)
  2. Patch navigator.webdriver = undefined (common headless tell)
  3. Visit homepage, wait, then navigate to each search URL
  4. Wait for product tiles to render, grab HTML
  5. Parse with the same UPC-link logic as the httpx version
  6. If we hit an Akamai "Access Denied / Pardon the interruption", mark blocked

Run locally:  python scrapers/retailers/food_basics_pw.py --dry-run --verbose
Requires:     pip install playwright && playwright install chromium
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import match, store

log = logging.getLogger("food-basics-pw")
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

# Akamai / WAF block-page signatures
BLOCK_SIGNATURES = [
    "access denied", "pardon the interruption", "reference #",
    "akamai", "request unsuccessful", "bot detection", "/_sec/",
]

try:
    from retailers.no_frills import PRICE_RANGES, MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS
except Exception:
    PRICE_RANGES = {}
    MIN_PLAUSIBLE_CENTS = 50
    MAX_PLAUSIBLE_CENTS = 10000

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
Object.defineProperty(navigator, 'languages', {get: () => ['en-CA', 'en']});
Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
window.chrome = { runtime: {} };
"""


def get_range(slug: str):
    return PRICE_RANGES.get(slug, (MIN_PLAUSIBLE_CENTS, MAX_PLAUSIBLE_CENTS))


def looks_blocked(html: str) -> bool:
    low = html[:5000].lower()
    return any(sig in low for sig in BLOCK_SIGNATURES)


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
        results.append({"sku": upc, "name": name, "price_cents": price,
                        "was_cents": was, "on_sale": on_sale})
    return results


def run(dry_run: bool = False) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
        return

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
    blocked_count = 0
    AUTO_MATCH_THRESHOLD = 78

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = browser.new_context(
            user_agent=UA,
            locale="en-CA",
            timezone_id="America/Toronto",
            viewport={"width": 1440, "height": 900},
        )
        ctx.add_init_script(STEALTH_JS)
        page = ctx.new_page()

        # Warm up
        try:
            page.goto(HOMEPAGE, wait_until="domcontentloaded", timeout=45000)
            time.sleep(3)
            home_html = page.content()
            if looks_blocked(home_html):
                log.error("Homepage shows Akamai block page. Metro is blocking Playwright too.")
                (debug_dir / "food_basics_blocked.txt").write_text(
                    "Akamai block detected on homepage even with Playwright stealth.\n"
                    "Recommendation: fall back to Path C (flyer PDF) or Path B (proxy)."
                )
                browser.close()
                return
            log.info("Homepage loaded OK (%d bytes) — not blocked at entry", len(home_html))
        except Exception as e:
            log.error("Homepage navigation failed: %s", e)
            (debug_dir / "food_basics_blocked.txt").write_text(f"Homepage nav failed: {e}")
            browser.close()
            return

        st = stores[0]
        log.info("Scraping %s via Playwright", st["name"])
        first_dumped = False

        for product in products:
            query = product["name"]
            floor, ceiling = get_range(product["slug"])
            url = SEARCH_URL_TEMPLATE.format(query=quote(query))
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                # Give product tiles time to render
                try:
                    page.wait_for_selector('a[href*="/p/"]', timeout=8000)
                except Exception:
                    pass
                time.sleep(1.5)
                html = page.content()
            except Exception as e:
                log.warning("Nav failed for '%s': %s", query, e)
                continue

            if looks_blocked(html):
                blocked_count += 1
                if blocked_count >= 3:
                    log.error("Blocked 3x in a row — Metro detecting Playwright. Aborting.")
                    (debug_dir / "food_basics_blocked.txt").write_text(
                        f"Akamai block after {blocked_count} search attempts via Playwright.\n"
                        "Recommendation: Path C (flyer PDF) or Path B (residential proxy)."
                    )
                    break
                continue

            if not first_dumped:
                (debug_dir / "food_basics_pw_first_response.html").write_text(html)
                first_dumped = True
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

        browser.close()

    log.info("Done. Wrote %d. No results: %d. Blocked hits: %d.",
             written, len(no_results), blocked_count)
    (debug_dir / "food_basics_pw_summary.json").write_text(json.dumps({
        "wrote": written, "no_results_count": len(no_results),
        "blocked_count": blocked_count, "no_results": no_results[:20],
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
