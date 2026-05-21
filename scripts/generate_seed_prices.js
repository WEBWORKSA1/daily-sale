// Generates data/prices/latest.json with realistic seed prices for all 7 stores × 100 products.
// Runs at build time (npm prebuild) so Vercel deploys never have empty data.
// Real scrapers (Python) will eventually overwrite this with live prices via GitHub Actions.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const targetPath = path.join(DATA, 'prices', 'latest.json');
if (fs.existsSync(targetPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const hasRealData = (existing.prices || []).some((p) => !p.source.startsWith('seed-'));
    if (hasRealData) {
      console.log('[seed] Real scraper data present — skipping seed.');
      process.exit(0);
    }
  } catch {}
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand, mean, std) {
  const u = 1 - rand(), v = rand();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const BASE_CENTS = {
  "milk-2pct-4l":599,"milk-1pct-4l":599,"milk-skim-4l":599,"milk-homo-4l":619,
  "eggs-large-dozen":459,"eggs-large-18":649,
  "butter-salted-454g":649,"butter-unsalted-454g":649,
  "cheese-cheddar-block-400g":699,"cheese-shredded-mozza-320g":599,
  "yogurt-plain-750g":449,"yogurt-greek-500g":499,
  "cream-35-473ml":549,"cream-10-473ml":379,"sour-cream-500ml":349,
  "bread-white-675g":279,"bread-whole-wheat-675g":299,"bagels-plain-6pk":379,
  "english-muffins-6pk":349,"tortillas-flour-10pk":449,
  "buns-hamburger-8pk":249,"buns-hotdog-8pk":249,
  "bananas-lb":88,"apples-gala-3lb":499,"apples-mcintosh-3lb":449,
  "oranges-navel-3lb":549,"strawberries-1lb":449,"blueberries-pint":549,
  "grapes-red-2lb":699,"tomatoes-on-vine-lb":299,
  "potatoes-russet-10lb":549,"potatoes-yellow-5lb":449,
  "onions-yellow-3lb":349,"carrots-2lb":249,"celery-bunch":299,
  "lettuce-romaine-3pk":449,"spinach-baby-312g":549,"cucumber-english":199,
  "peppers-bell-3pk":599,"broccoli-bunch":299,"garlic-bulb":99,
  "avocado-each":149,"lemons-bag-2lb":449,"limes-each":79,"mushrooms-white-227g":299,
  "chicken-breast-bnls-skls-lb":749,"chicken-thighs-bnls-skls-lb":549,
  "chicken-whole-lb":349,"ground-beef-lean-lb":699,"ground-beef-medium-lb":599,
  "beef-striploin-lb":1599,"pork-tenderloin-lb":599,"pork-chops-lb":549,
  "bacon-375g":649,"sausage-breakfast-375g":549,"hot-dogs-12pk":399,
  "deli-ham-175g":449,"deli-turkey-175g":549,
  "salmon-atlantic-lb":1399,"tilapia-frozen-400g":749,
  "rice-basmati-8kg":2299,"rice-long-grain-2kg":599,
  "pasta-spaghetti-900g":249,"pasta-penne-900g":249,"pasta-sauce-tomato-650ml":299,
  "flour-all-purpose-2-5kg":549,"sugar-white-2kg":449,"salt-table-1kg":199,
  "oil-canola-3l":899,"oil-olive-1l":1099,"peanut-butter-1kg":549,
  "jam-strawberry-500ml":449,"honey-1kg":899,"maple-syrup-540ml":1199,
  "cereal-cheerios-570g":599,"oats-quick-1kg":399,
  "soup-tomato-540ml":219,"tuna-canned-170g":169,"beans-canned-540ml":199,
  "tomatoes-canned-796ml":249,
  "frozen-pizza-pepperoni":599,"frozen-fries-1kg":349,
  "frozen-veg-mix-750g":399,"frozen-berries-600g":749,
  "ice-cream-1-5l":549,"frozen-chicken-nuggets-700g":899,
  "coffee-ground-930g":1699,"tea-orange-pekoe-72ct":499,
  "juice-orange-1-75l":449,"juice-apple-1-75l":399,
  "water-bottled-24pk":399,"soda-cola-12pk":699,
  "toilet-paper-12-double":949,"paper-towel-6-roll":899,
  "dish-soap-740ml":449,"laundry-detergent-2-95l":1599,"trash-bags-40ct":1299,
  "ketchup-1l":549,"mayo-890ml":699,"mustard-yellow-450ml":349,
};

const RETAILER_INDEX = {
  "walmart":     { mean: 0.97, spread: 0.05, saleRate: 0.10 },
  "no-frills":   { mean: 0.94, spread: 0.05, saleRate: 0.15 },
  "freshco":     { mean: 0.96, spread: 0.06, saleRate: 0.18 },
  "sobeys":      { mean: 1.10, spread: 0.07, saleRate: 0.12 },
  "food-basics": { mean: 0.93, spread: 0.05, saleRate: 0.16 },
  "zehrs":       { mean: 1.06, spread: 0.06, saleRate: 0.10 },
  "giant-tiger": { mean: 0.92, spread: 0.06, saleRate: 0.08 },
};

const GIANT_TIGER_SKIPS = new Set([
  "salmon-atlantic-lb","beef-striploin-lb","pork-tenderloin-lb",
  "cheese-shredded-mozza-320g","frozen-chicken-nuggets-700g",
  "maple-syrup-540ml","tilapia-frozen-400g","pasta-sauce-tomato-650ml",
  "rice-basmati-8kg","yogurt-greek-500g",
]);

function main() {
  const products = JSON.parse(fs.readFileSync(path.join(DATA, 'products.json'), 'utf8'));
  const config = JSON.parse(fs.readFileSync(path.join(DATA, 'config.json'), 'utf8'));

  const rand = rng(42);
  const rows = [];

  for (const store of config.stores) {
    const idx = RETAILER_INDEX[store.retailer_slug];
    if (!idx) continue;
    for (const p of products) {
      const slug = p.slug;
      if (store.retailer_slug === 'giant-tiger' && GIANT_TIGER_SKIPS.has(slug)) continue;
      const base = BASE_CENTS[slug];
      if (!base) continue;

      let mult = gauss(rand, idx.mean, idx.spread);
      mult = Math.max(0.78, Math.min(1.25, mult));
      let price = Math.max(49, Math.round((base * mult) / 10) * 10 - 1);

      const onSale = rand() < idx.saleRate;
      let was = null;
      if (onSale) {
        let w = Math.round(price / (0.6 + rand() * 0.25));
        w = Math.max(Math.round(w / 10) * 10 - 1, price + 30);
        was = w;
      }

      rows.push({
        store_id: store.id,
        product_slug: slug,
        price_cents: price,
        was_price_cents: was,
        on_sale: onSale,
        source: 'seed-demo',
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    generated_at: today,
    store_count: config.stores.length,
    product_count: products.length,
    price_count: rows.length,
    prices: rows,
  };

  fs.mkdirSync(path.join(DATA, 'prices'), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2));
  console.log(`[seed] Wrote ${rows.length} prices for ${config.stores.length} stores.`);
}

main();
