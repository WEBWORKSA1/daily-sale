#!/usr/bin/env python3
"""Run all retailer scrapers; flush combined results to data/prices/latest.json."""
import argparse
import importlib
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from utils import store

RETAILERS = ["walmart", "no_frills", "zehrs", "sobeys", "freshco", "food_basics", "giant_tiger"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="run only this retailer (module name)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    log = logging.getLogger("run_all")
    targets = [args.only] if args.only else RETAILERS
    for r in targets:
        log.info("=" * 60)
        log.info("RUNNING: %s", r)
        log.info("=" * 60)
        try:
            mod = importlib.import_module(f"retailers.{r}")
            mod.run(dry_run=args.dry_run)
        except Exception as e:
            log.exception("Scraper %s failed: %s", r, e)
        time.sleep(5)
    if not args.dry_run:
        result = store.flush()
        log.info("Final flush: %d rows across %d stores × %d products",
                 result["price_count"], result["store_count"], result["product_count"])


if __name__ == "__main__":
    main()
