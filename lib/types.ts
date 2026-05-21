export type CheapestRow = {
  product_id: number;
  product_name: string;
  product_unit: string | null;
  product_category: string;
  product_rank: number;
  cheapest: {
    store_id: number;
    retailer_name: string;
    store_name: string;
    address: string | null;
    price_cents: number;
    was_price_cents: number | null;
    on_sale: boolean;
  } | null;
  most_expensive_cents: number | null;
  savings_cents: number;
  prices_at_other_stores: Array<{
    retailer_name: string;
    store_name: string;
    price_cents: number;
    on_sale: boolean;
  }>;
};
