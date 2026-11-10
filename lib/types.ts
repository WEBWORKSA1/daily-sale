export type Retailer = { slug: string; name: string; country: string; flyer_url: string; };
export type Store = {
  id: string; retailer_slug: string; external_id: string; name: string;
  address: string; city: string; province: string; postal_code: string;
};
export type Product = {
  rank: number; slug: string; name: string; category: string;
  unit?: string; unit_size?: number; unit_label?: string;
};
export type PriceRow = {
  store_id: string; product_slug: string;
  price_cents: number; was_price_cents: number | null;
  on_sale: boolean; source: string; valid_until?: string | null;
};
export type PricesFile = {
  generated_at: string; flyer_week_expiry?: string;
  store_count: number; product_count: number; price_count: number;
  prices: PriceRow[];
};
export type CheapestRow = {
  product_id: number; product_slug: string; product_name: string; product_unit: string | null;
  product_category: string; product_rank: number;
  cheapest: {
    store_id: string | number;
    retailer_name: string; store_name: string; address: string;
    price_cents: number; was_price_cents: number | null; on_sale: boolean;
    valid_until?: string | null; retailer_slug?: string;
  };
  most_expensive_cents: number;
  savings_cents: number;
  prices_at_other_stores: Array<{
    store_id?: string; retailer_name: string; store_name: string;
    price_cents: number; on_sale: boolean;
  }>;
};
