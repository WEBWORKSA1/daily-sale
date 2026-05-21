"""Zehrs scraper stub. Same Loblaw backend as no-frills."""
import logging
log = logging.getLogger("zehrs")
RETAILER_SLUG = "zehrs"

def run(dry_run: bool = False) -> None:
    log.warning("zehrs scraper is a stub. Same pattern as no-frills once that's done.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
