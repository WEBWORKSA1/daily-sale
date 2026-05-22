"""
Keyword-anchor matcher for flyer item names.

Brand-led flyer names (e.g. "SELECTION SALTED OR UNSALTED BUTTER") defeat plain
fuzzy matching. This module requires a product's CORE keyword(s) to appear as
whole words in the retailer item, with disqualifier words that reject lookalikes
("salt" must not match "salted", "oat" not "goat", etc. via word boundaries).

Usage (hybrid): if a product slug has an anchor spec, use anchor_match(); else
fall back to fuzzy token_set_ratio. Anchors are seeded for ~90 high-frequency
staples and grow as real flyer data reveals gaps.
"""
from __future__ import annotations
import re

ANCHORS = {
    # DAIRY
    "milk-2pct-4l": {"must": [["milk"]], "reject": ["almond","soy","oat","coconut","lactose","chocolate","condensed","evaporated","beverage","goat","cheese"]},
    "milk-1pct-4l": {"must": [["milk"]], "reject": ["almond","soy","oat","coconut","lactose","chocolate","condensed","evaporated","beverage","goat","cheese"]},
    "milk-skim-4l": {"must": [["skim","milk"]], "reject": ["almond","soy","oat","beverage"]},
    "milk-homo-4l": {"must": [["homogenized","milk"]], "reject": ["almond","soy","oat","beverage","lactose","evaporated"]},
    "eggs-large-dozen": {"must": [["eggs"]], "reject": ["substitute","bites","veggie","nog"]},
    "eggs-large-18": {"must": [["eggs"]], "reject": ["substitute","bites","veggie","nog"]},
    "butter-salted-454g": {"must": [["butter"]], "reject": ["peanut","cookie","tart","unsalted","nut"]},
    "butter-unsalted-454g": {"must": [["unsalted","butter"]], "reject": ["peanut","cookie","tart","nut"]},
    "cheese-cheddar-block-400g": {"must": [["cheddar"]], "reject": ["shredded","mac","cream","slices","snack"]},
    "cheese-shredded-mozza-320g": {"must": [["shredded","cheese"],["shredded","mozzarella"],["mozzarella"]], "reject": ["block","mac"]},
    "yogurt-plain-750g": {"must": [["plain","yogurt"]], "reject": ["greek","frozen","drink"]},
    "yogurt-greek-500g": {"must": [["greek","yogurt"]], "reject": ["frozen"]},
    "cream-35-473ml": {"must": [["whipping","cream"]], "reject": ["sour","ice"]},
    "sour-cream-500ml": {"must": [["sour","cream"]], "reject": []},
    # BAKERY
    "bread-white-675g": {"must": [["white","bread"]], "reject": ["gluten","raisin","banana","whole","garlic","bagel"]},
    "bread-whole-wheat-675g": {"must": [["whole","wheat","bread"],["whole","grain","bread"]], "reject": ["gluten","garlic","bagel","bun"]},
    "bagels-plain-6pk": {"must": [["bagels"]], "reject": ["gluten","bread","tortilla","bun"]},
    "english-muffins-6pk": {"must": [["english","muffin"]], "reject": []},
    "tortillas-flour-10pk": {"must": [["tortillas"]], "reject": ["gluten","chip"]},
    "buns-hamburger-8pk": {"must": [["hamburger","buns"],["burger","buns"]], "reject": []},
    "buns-hotdog-8pk": {"must": [["hot","dog","buns"],["hotdog","buns"]], "reject": []},
    # PRODUCE
    "bananas-lb": {"must": [["bananas"]], "reject": ["bread","chip","muffin"]},
    "apples-gala-3lb": {"must": [["gala","apples"]], "reject": ["juice","sauce","chip"]},
    "apples-mcintosh-3lb": {"must": [["mcintosh"]], "reject": ["juice","sauce"]},
    "oranges-navel-3lb": {"must": [["navel","oranges"]], "reject": ["juice","chocolate","pekoe"]},
    "strawberries-1lb": {"must": [["strawberries"]], "reject": ["jam","frozen","ice"]},
    "blueberries-pint": {"must": [["blueberries"]], "reject": ["frozen","muffin","jam","raspberries","blackberries"]},
    "grapes-red-2lb": {"must": [["red","seedless","grapes"]], "reject": ["juice","tomato","tomatoes","green","cucumber","cucumbers"]},
    "tomatoes-on-vine-lb": {"must": [["tomatoes"]], "reject": ["soup","sauce","canned","paste","juice","grape","cherry"]},
    "potatoes-russet-10lb": {"must": [["russet"]], "reject": ["sweet","chip"]},
    "potatoes-yellow-5lb": {"must": [["yellow","potatoes"]], "reject": ["sweet","chip","russet","mini","gourmet"]},
    "onions-yellow-3lb": {"must": [["yellow","onions"],["cooking","onions"]], "reject": ["green","fried","ring","vidalia"]},
    "carrots-2lb": {"must": [["carrots"]], "reject": ["cake","baby","nantes"]},
    "celery-bunch": {"must": [["celery"]], "reject": ["salt","seed"]},
    "lettuce-romaine-3pk": {"must": [["romaine"]], "reject": []},
    "spinach-baby-312g": {"must": [["spinach"]], "reject": []},
    "cucumber-english": {"must": [["english","cucumber"],["seedless","cucumber"]], "reject": ["mini","pickle"]},
    "peppers-bell-3pk": {"must": [["bell","peppers"],["sweet","peppers"]], "reject": ["pepperette","hot","jalapeno","chili","pepperoni"]},
    "broccoli-bunch": {"must": [["broccoli"]], "reject": ["slaw"]},
    "garlic-bulb": {"must": [["garlic"]], "reject": ["bread","finger","fingers","powder","sauce","toast","pizza","pizzeria"]},
    "avocado-each": {"must": [["avocado"],["avocados"]], "reject": ["oil"]},
    "lemons-bag-2lb": {"must": [["lemons"]], "reject": ["juice","cleaner","scent"]},
    "limes-each": {"must": [["limes"]], "reject": ["juice"]},
    "mushrooms-white-227g": {"must": [["mushrooms"]], "reject": ["soup"]},
    # MEAT
    "chicken-breast-bnls-skls-lb": {"must": [["chicken","breast"]], "reject": ["wing","nugget","breaded","cooked","wiener","ground"]},
    "chicken-thighs-bnls-skls-lb": {"must": [["chicken","thighs"]], "reject": ["wing","nugget","breaded","cooked","wiener","ground"]},
    "chicken-whole-lb": {"must": [["whole","chicken"]], "reject": ["breast","thigh","wing","nugget","breaded","wiener"]},
    "ground-beef-lean-lb": {"must": [["lean","ground","beef"]], "reject": ["burger","lamb","pork","chicken","turkey"]},
    "ground-beef-medium-lb": {"must": [["medium","ground","beef"]], "reject": ["burger","lamb","pork","chicken","lean"]},
    "beef-striploin-lb": {"must": [["striploin"]], "reject": ["ground"]},
    "pork-tenderloin-lb": {"must": [["pork","tenderloin"]], "reject": ["chop","ground","sausage","ribs","bacon","wiener"]},
    "pork-chops-lb": {"must": [["pork","chops"]], "reject": ["ground","tenderloin"]},
    "bacon-375g": {"must": [["bacon"]], "reject": ["bits","flavour"]},
    "sausage-breakfast-375g": {"must": [["breakfast","sausage"]], "reject": ["roll"]},
    "hot-dogs-12pk": {"must": [["wieners"]], "reject": ["bun","chicken wieners"]},
    "deli-ham-175g": {"must": [["ham"]], "reject": ["hamburger","graham","shampoo"]},
    "deli-turkey-175g": {"must": [["turkey"]], "reject": ["ground","whole"]},
    "salmon-atlantic-lb": {"must": [["salmon"]], "reject": ["canned","pink","clover leaf"]},
    "tilapia-frozen-400g": {"must": [["tilapia"]], "reject": []},
    # PANTRY
    "rice-basmati-8kg": {"must": [["basmati","rice"]], "reject": ["jasmine"]},
    "rice-long-grain-2kg": {"must": [["long","grain","rice"]], "reject": ["basmati","jasmine"]},
    "pasta-spaghetti-900g": {"must": [["spaghetti"]], "reject": ["sauce","squash"]},
    "pasta-penne-900g": {"must": [["penne"]], "reject": ["sauce"]},
    "pasta-sauce-tomato-650ml": {"must": [["pasta","sauce"]], "reject": ["bbq","soy","hot"]},
    "flour-all-purpose-2-5kg": {"must": [["flour"]], "reject": ["gluten","almond"]},
    "sugar-white-2kg": {"must": [["sugar"]], "reject": ["brown","icing","free"]},
    "salt-table-1kg": {"must": [["salt"]], "reject": ["sea","celery","garlic","bath","salted","butter"]},
    "oil-canola-3l": {"must": [["canola","oil"]], "reject": ["olive"]},
    "oil-olive-1l": {"must": [["olive","oil"]], "reject": ["canola"]},
    "peanut-butter-1kg": {"must": [["peanut","butter"]], "reject": []},
    "jam-strawberry-500ml": {"must": [["jam"]], "reject": ["bbq"]},
    "honey-1kg": {"must": [["honey"]], "reject": ["garlic","mustard","ham","nut","mango","mangoes","tea"]},
    "maple-syrup-540ml": {"must": [["maple","syrup"]], "reject": []},
    "oats-quick-1kg": {"must": [["oats"]], "reject": ["cookie","milk","bar","goat"]},
    "soup-tomato-540ml": {"must": [["tomato","soup"]], "reject": ["noodle"]},
    "tuna-canned-170g": {"must": [["tuna"]], "reject": []},
    "ketchup-1l": {"must": [["ketchup"]], "reject": ["chip"]},
    "mustard-yellow-450ml": {"must": [["mustard"]], "reject": ["honey"]},
    "mayo-890ml": {"must": [["mayonnaise"],["mayo"]], "reject": []},
    # FROZEN
    "frozen-pizza-pepperoni": {"must": [["pizza"]], "reject": ["sauce","express","pocket","flatbread"]},
    "frozen-fries-1kg": {"must": [["french","fries"]], "reject": []},
    "frozen-berries-600g": {"must": [["frozen","berries"]], "reject": ["fresh"]},
    "ice-cream-1-5l": {"must": [["ice","cream"]], "reject": ["sandwich","cone","bar","novelties","novelty"]},
    "frozen-chicken-nuggets-700g": {"must": [["chicken","nuggets"]], "reject": ["fully","cooked"]},
    # BEVERAGE
    "coffee-ground-930g": {"must": [["ground","coffee"]], "reject": ["capsule","pod","mate","iced","cold","enhancer","maker","instant","beans"]},
    "tea-orange-pekoe-72ct": {"must": [["orange","pekoe"]], "reject": ["iced","herbal"]},
    "juice-orange-1-75l": {"must": [["orange","juice"]], "reject": ["soft"]},
    "juice-apple-1-75l": {"must": [["apple","juice"]], "reject": []},
    "soda-cola-12pk": {"must": [["coca-cola"],["pepsi"],["coca"]], "reject": []},
    # HOUSEHOLD
    "paper-towel-6-roll": {"must": [["paper","towels"],["paper","towel"]], "reject": ["bathroom","tissue","facial"]},
    "toilet-paper-12-double": {"must": [["bathroom","tissue"]], "reject": ["facial","paper towel","paper towels","bounty","sponge"]},
    "dish-soap-740ml": {"must": [["dishwashing"],["dish","soap"]], "reject": ["dishwasher","tab"]},
    "laundry-detergent-2-95l": {"must": [["laundry","detergent"]], "reject": ["dish"]},
}

_word_cache = {}
def has_word(low, word):
    # word-boundary match; word may itself be multi-token (e.g. "hot dog")
    pat = _word_cache.get(word)
    if pat is None:
        pat = re.compile(r'\b' + re.escape(word) + r'\b')
        _word_cache[word] = pat
    return bool(pat.search(low))

def anchor_match(name, slug):
    spec = ANCHORS.get(slug)
    if not spec:
        return None
    low = name.lower()
    for r in spec.get("reject", []):
        if has_word(low, r):
            return None
    for group in spec["must"]:
        if all(has_word(low, w) for w in group):
            return ",".join(group)
    return None
