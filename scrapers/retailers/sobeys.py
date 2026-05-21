"""Sobeys scraper stub. Parse embedded JSON from sobeys.com/en/flyer/."""
import logging
log = logging.getLogger("sobeys")
RETAILER_SLUG = "sobeys"

def run(dry_run: bool = False) -> None:
    log.warning("sobeys scraper is a stub.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
