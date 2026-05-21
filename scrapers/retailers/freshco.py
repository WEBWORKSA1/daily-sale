"""FreshCo scraper stub. Sobeys-owned, same flyer pattern."""
import logging
log = logging.getLogger("freshco")
RETAILER_SLUG = "freshco"

def run(dry_run: bool = False) -> None:
    log.warning("freshco scraper is a stub.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
