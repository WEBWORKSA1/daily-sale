"""Food Basics scraper stub. Metro Inc backend.
Capture flyer JSON from foodbasics.ca DevTools."""
import logging
log = logging.getLogger("food-basics")
RETAILER_SLUG = "food-basics"

def run(dry_run: bool = False) -> None:
    log.warning("food-basics scraper is a stub.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
