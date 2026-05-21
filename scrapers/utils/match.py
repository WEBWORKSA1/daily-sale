"""Fuzzy match retailer product names to canonical top-100 SKUs."""
from typing import Optional
from rapidfuzz import fuzz, process

AUTO_MATCH = 85
REVIEW = 70


def best_match(retailer_name: str, canonical_products: list[dict]) -> Optional[dict]:
    if not retailer_name:
        return None
    choices = {p["id"]: f'{p["name"]} {p.get("unit", "")}'.strip() for p in canonical_products}
    by_id = {p["id"]: p for p in canonical_products}
    result = process.extractOne(retailer_name, choices, scorer=fuzz.token_set_ratio)
    if not result:
        return None
    matched_text, score, matched_id = result
    if score < REVIEW:
        return None
    return {"product": by_id[matched_id], "score": score, "auto": score >= AUTO_MATCH}
