import fs from 'node:fs';
import path from 'node:path';
import type { Retailer, Store, Product, PriceRow, PricesFile, CheapestRow } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(rel: string, fallback: T): T {
  const p = path.join(DATA_DIR, rel);
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return fallback; }
}

type Loaded = {
  retailers: Retailer[]; stores: Store[]; products: Product[]; prices: PricesFile;
  reference: Record<string, number>;
};
let cache: Loaded | null = null;

function load(): Loaded {
  if (cache) return cache;
  const config = readJSON<{ retailers: Retailer[]; stores: Store[] }>('config.json', { retailers: [], stores: [] });
  const products = readJSON<Product[]>('products.json', []);
  const reference = readJSON<Record<string, number>>('reference_prices.json', {});
  const prices = readJSON<PricesFile>('prices/latest.json', {
    generated_at: new Date().toISOString().slice(0, 10),
    store_count: 0, product_count: 0, price_count: 0, prices: []
  });
  cache = { ...config, products, prices, reference };
  return cache;
}

/** Today's date in Ontario, YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// Reject obviously mis-matched flyer rows (e.g. "$1 off", per-100g, wrong pack size).
// Produce sold by weight swings harder, so it gets a lower floor. Mirrors scrapers/utils/store.py.
const MIN_RATIO_PRODUCE = 0.25;
const MIN_RATIO = 0.4;
const MAX_RATIO = 3.0;
let categoryBySlug: Map<string, string> | null = null;

function plausible(row: PriceRow, reference: Record<string, number>, products: Product[]): boolean {
  if (!row || !Number.isFinite(row.price_cents) || row.price_cents <= 0) return false;
  const ref = reference[row.product_slug];
  if (!ref) return true;
  if (!categoryBySlug) categoryBySlug = new Map(products.map(p => [p.slug, p.category]));
  const floor = categoryBySlug.get(row.product_slug) === 'produce' ? MIN_RATIO_PRODUCE : MIN_RATIO;
  const r = row.price_cents / ref;
  return r >= floor && r <= MAX_RATIO;
}

/** Clean, current price rows. Falls back to the latest rows (flagged stale) if every flyer has expired. */
export function getPriceRows(): { rows: PriceRow[]; stale: boolean } {
  const { prices, reference, products } = load();
  const sane = prices.prices.filter(r => plausible(r, reference, products));
  const today = todayISO();
  const current = sane.filter(r => !r.valid_until || r.valid_until >= today);
  if (current.length > 0) return { rows: current, stale: false };
  return { rows: sane, stale: sane.length > 0 };
}

export function getConfig() { return load(); }
export function getAllStores() { return load().stores; }
export function getAllRetailers() { return load().retailers; }
export function getAllProducts() { return load().products; }
export function getProduct(slug: string) { return load().products.find(p => p.slug === slug) || null; }
export function getGeneratedAt() { return load().prices.generated_at; }

export function getKnownFsas(): string[] {
  const { stores } = load();
  return Array.from(new Set(stores.map(s => s.postal_code.slice(0, 3)))).sort();
}

const REGION_PREFIX_LEN = 2;

function storesInRegion(postalPrefix: string) {
  const { stores } = load();
  const region = (postalPrefix || '').slice(0, REGION_PREFIX_LEN).toUpperCase();
  return region ? stores.filter(s => s.postal_code.slice(0, REGION_PREFIX_LEN).toUpperCase() === region) : stores;
}

export function getCheapestForPostal(postalPrefix: string) {
  const { retailers, products, prices } = load();
  const expiry = prices.flyer_week_expiry || null;
  const matchingStores = storesInRegion(postalPrefix);
  const { rows: allRows, stale } = getPriceRows();

  if (matchingStores.length === 0) {
    return { postal_prefix: (postalPrefix || '').toUpperCase(), stores_count: 0, items: [] as CheapestRow[],
             generated_at: prices.generated_at, flyer_week_expiry: expiry, stale };
  }

  const storeIds = new Set(matchingStores.map(s => s.id));
  const storeById = new Map(matchingStores.map(s => [s.id, s]));
  const retailerBySlug = new Map(retailers.map(r => [r.slug, r]));
  const productBySlug = new Map(products.map(p => [p.slug, p]));

  const byProduct = new Map<string, PriceRow[]>();
  for (const row of allRows) {
    if (!storeIds.has(row.store_id)) continue;
    const arr = byProduct.get(row.product_slug) || [];
    arr.push(row); byProduct.set(row.product_slug, arr);
  }

  const items: CheapestRow[] = [];
  for (const [slug, rows] of Array.from(byProduct.entries())) {
    const product = productBySlug.get(slug); if (!product) continue;
    rows.sort((a, b) => a.price_cents - b.price_cents);
    const cheapest = rows[0], mostExpensive = rows[rows.length - 1];
    const cheapestStore = storeById.get(cheapest.store_id)!;
    const cheapestRetailer = retailerBySlug.get(cheapestStore.retailer_slug);
    items.push({
      product_id: product.rank, product_slug: product.slug, product_name: product.name,
      product_unit: product.unit || null, product_category: product.category,
      product_rank: product.rank,
      cheapest: {
        store_id: cheapest.store_id, retailer_name: cheapestRetailer?.name || cheapestStore.retailer_slug,
        retailer_slug: cheapestStore.retailer_slug,
        store_name: cheapestStore.name, address: cheapestStore.address,
        price_cents: cheapest.price_cents, was_price_cents: cheapest.was_price_cents,
        on_sale: cheapest.on_sale, valid_until: cheapest.valid_until || null
      },
      most_expensive_cents: mostExpensive.price_cents,
      savings_cents: mostExpensive.price_cents - cheapest.price_cents,
      prices_at_other_stores: rows.slice(1).map(r => {
        const s = storeById.get(r.store_id)!;
        const ret = retailerBySlug.get(s.retailer_slug);
        return { store_id: s.id, retailer_name: ret?.name || s.retailer_slug, store_name: s.name,
                 price_cents: r.price_cents, on_sale: r.on_sale };
      })
    });
  }
  items.sort((a, b) => (a.product_rank || 999) - (b.product_rank || 999));
  return { postal_prefix: (postalPrefix || '').toUpperCase(), stores_count: matchingStores.length,
           items, generated_at: prices.generated_at, flyer_week_expiry: expiry, stale };
}

export const DEFAULT_REGION = 'L2';

export function getTopDeals(n = 20) {
  const all = getCheapestForPostal(DEFAULT_REGION);
  return all.items
    .filter(i => i.savings_cents > 0)
    .sort((a, b) => b.savings_cents - a.savings_cents)
    .slice(0, n);
}

export function getDealsByCategory(category: string) {
  const all = getCheapestForPostal(DEFAULT_REGION);
  return all.items.filter(i => i.product_category === category);
}

export function getDealsByStore(storeId: string) {
  const { stores, products } = load();
  const store = stores.find(s => s.id === storeId);
  if (!store) return { store: null, deals: [] as Array<{ product: Product; row: PriceRow }> };
  const productBySlug = new Map(products.map(p => [p.slug, p]));
  const deals = getPriceRows().rows
    .filter(r => r.store_id === storeId)
    .map(r => ({ product: productBySlug.get(r.product_slug)!, row: r }))
    .filter(d => d.product)
    .sort((a, b) => a.product.rank - b.product.rank);
  return { store, deals };
}

/** Every store's price for one product in a region, cheapest first. */
export function getProductPrices(slug: string, postalPrefix = DEFAULT_REGION) {
  const { retailers } = load();
  const stores = storesInRegion(postalPrefix);
  const storeById = new Map(stores.map(s => [s.id, s]));
  const retailerBySlug = new Map(retailers.map(r => [r.slug, r]));
  return getPriceRows().rows
    .filter(r => r.product_slug === slug && storeById.has(r.store_id))
    .sort((a, b) => a.price_cents - b.price_cents)
    .map(r => {
      const s = storeById.get(r.store_id)!;
      return { row: r, store: s, retailer: retailerBySlug.get(s.retailer_slug) || null };
    });
}

/** Compact matrix for the basket builder: product -> { storeId: cents }. */
export function getBasketMatrix(postalPrefix = DEFAULT_REGION) {
  const { products, retailers } = load();
  const stores = storesInRegion(postalPrefix);
  const ids = new Set(stores.map(s => s.id));
  const matrix: Record<string, Record<string, number>> = {};
  for (const r of getPriceRows().rows) {
    if (!ids.has(r.store_id)) continue;
    (matrix[r.product_slug] ||= {})[r.store_id] = r.price_cents;
  }
  const retailerBySlug = new Map(retailers.map(r => [r.slug, r.name]));
  return {
    products: products.filter(p => matrix[p.slug]).map(p => ({ slug: p.slug, name: p.name, unit: p.unit || '', category: p.category })),
    stores: stores.map(s => ({ id: s.id, name: s.name, retailer: retailerBySlug.get(s.retailer_slug) || s.retailer_slug })),
    matrix
  };
}

export function getSiteStats() {
  const { products, stores, retailers } = load();
  const { rows, stale } = getPriceRows();
  return {
    products: products.length,
    stores: stores.length,
    retailers: retailers.length,
    livePrices: rows.length,
    storesWithPrices: new Set(rows.map(r => r.store_id)).size,
    itemsWithPrices: new Set(rows.map(r => r.product_slug)).size,
    generatedAt: load().prices.generated_at,
    flyerExpiry: load().prices.flyer_week_expiry || null,
    stale
  };
}

export { formatPrice, formatDate, daysUntil } from './format';

export const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce', dairy: 'Dairy & Eggs', meat: 'Meat & Seafood', bakery: 'Bakery',
  pantry: 'Pantry', frozen: 'Frozen', beverage: 'Beverages', household: 'Household'
};
