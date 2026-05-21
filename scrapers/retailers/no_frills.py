"""No Frills scraper stub. Loblaw banner — pcexpress.ca backend.
Next session: capture cURL from DevTools and adapt walmart.py pattern."""
import logging
log = logging.getLogger("no-frills")
RETAILER_SLUG = "no-frills"

def run(dry_run: bool = False) -> None:
    log.warning("no-frills scraper is a stub. Capture pcexpress.ca cURL first.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
