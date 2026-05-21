"""Giant Tiger scraper stub."""
import logging
log = logging.getLogger("giant-tiger")
RETAILER_SLUG = "giant-tiger"

def run(dry_run: bool = False) -> None:
    log.warning("giant-tiger scraper is a stub.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
