import fs from 'node:fs';
import path from 'node:path';
import type { CheapestRow } from './types';

type Retailer = { slug: string; name: string; country: string; flyer_url: string; };
type Store = { id: string; retailer_slug: string; external_id: string; name: string; address: string; city: string; province: string; postal_code: string; };
type Product = { rank: number; slug: string; name: string; category: string; unit?: string; unit_size?: number; unit_label?: string; };
type PriceRow = { store_id: string; product_slug: string; price_cents: number; was_price_cents: number | null; on_sale: boolean; source: string; valid_until?: string | null; };
type PricesFile = { generated_at: string; flyer_week_expiry?: string; store_count: number; product_count: number; price_count: number; prices: PriceRow[]; };

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8'));
}

let cache: { retailers: Retailer[]; stores: Store[]; products: Product[]; prices: PricesFile; } | null = null;

function load() {
  if (cache) return cache;
  const config = readJSON<{ retailers: Retailer[]; stores: Store[] }>('config.json');
  const products = readJSON<Product[]>('products.json');
  const prices = readJSON<PricesFile>('prices/latest.json');
  cache = { ...config, products, prices };
  return cache;
}

export function getConfig() { return load(); }

export function getKnownFsas(): string[] {
  const { stores } = load();
  return Array.from(new Set(stores.map((s) => s.postal_code.slice(0, 3)))).sort();
}

export function getCheapestForPostal(postalPrefix: string): {
  postal_prefix: string; stores_count: number; items: CheapestRow[]; generated_at: string; flyer_week_expiry: string | null;
} {
  const { retailers, stores, products, prices } = load();
  const expiry = prices.flyer_week_expiry || null;
  const matchingStores = stores.filter((s) => s.postal_code.slice(0, 3).toUpperCase() === postalPrefix.toUpperCase());
  if (matchingStores.length === 0) {
    return { postal_prefix: postalPrefix, stores_count: 0, items: [], generated_at: prices.generated_at, flyer_week_expiry: expiry };
  }
  const storeIds = new Set(matchingStores.map((s) => s.id));
  const storeById = new Map(matchingStores.map((s) => [s.id, s]));
  const retailerBySlug = new Map(retailers.map((r) => [r.slug, r]));
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const byProduct = new Map<string, PriceRow[]>();
  for (const row of prices.prices) {
    if (!storeIds.has(row.store_id)) continue;
    const arr = byProduct.get(row.product_slug) || [];
    arr.push(row);
    byProduct.set(row.product_slug, arr);
  }
  const items: CheapestRow[] = [];
  for (const [slug, rows] of byProduct.entries()) {
    const product = productBySlug.get(slug);
    if (!product) continue;
    rows.sort((a, b) => a.price_cents - b.price_cents);
    const cheapest = rows[0];
    const mostExpensive = rows[rows.length - 1];
    const cheapestStore = storeById.get(cheapest.store_id)!;
    const cheapestRetailer = retailerBySlug.get(cheapestStore.retailer_slug)!;
    items.push({
      product_id: product.rank,
      product_name: product.name,
      product_unit: product.unit || null,
      product_category: product.category,
      product_rank: product.rank,
      cheapest: {
        store_id: cheapest.store_id as unknown as number,
        retailer_name: cheapestRetailer.name,
        store_name: cheapestStore.name,
        address: cheapestStore.address,
        price_cents: cheapest.price_cents,
        was_price_cents: cheapest.was_price_cents,
        on_sale: cheapest.on_sale,
      },
      most_expensive_cents: mostExpensive.price_cents,
      savings_cents: mostExpensive.price_cents - cheapest.price_cents,
      prices_at_other_stores: rows.slice(1).map((r) => {
        const s = storeById.get(r.store_id)!;
        const ret = retailerBySlug.get(s.retailer_slug)!;
        return { retailer_name: ret.name, store_name: s.name, price_cents: r.price_cents, on_sale: r.on_sale };
      }),
    });
  }
  items.sort((a, b) => (a.product_rank || 999) - (b.product_rank || 999));
  return { postal_prefix: postalPrefix.toUpperCase(), stores_count: matchingStores.length, items, generated_at: prices.generated_at, flyer_week_expiry: expiry };
}
