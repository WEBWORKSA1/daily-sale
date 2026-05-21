'use client';

import { useState } from 'react';
import type { CheapestRow } from '@/lib/types';

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export function ItemList({ items }: { items: CheapestRow[] }) {
  return (
    <div className="divide-y divide-ink/30 border-t border-b border-ink/30">
      {items.map((item) => <ItemRow key={item.product_id} item={item} />)}
    </div>
  );
}

function ItemRow({ item }: { item: CheapestRow }) {
  const [open, setOpen] = useState(false);
  if (!item.cheapest) return null;
  const c = item.cheapest;
  const savings = item.savings_cents;
  const savingsPct = item.most_expensive_cents ? Math.round((savings / item.most_expensive_cents) * 100) : 0;
  return (
    <div className="lift py-5 px-2 hover:bg-ink/5 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="grid grid-cols-12 gap-3 md:gap-6 items-baseline">
        <div className="col-span-1 tag text-xs opacity-50">#{item.product_rank?.toString().padStart(3, '0')}</div>
        <div className="col-span-11 md:col-span-5">
          <div className="display text-xl md:text-2xl font-bold leading-tight">{item.product_name}</div>
          {item.product_unit && <div className="text-xs uppercase tracking-wider opacity-60 mt-0.5">{item.product_unit}</div>}
        </div>
        <div className="col-span-7 md:col-span-3">
          <div className="text-xs tracking-[0.15em] uppercase opacity-60">Cheapest at</div>
          <div className="font-semibold">{c.retailer_name}</div>
          {c.on_sale && <span className="stamp text-cart mt-1">Sale</span>}
        </div>
        <div className="col-span-3 md:col-span-2 text-right">
          <div className="tag text-2xl md:text-3xl font-bold">{fmt(c.price_cents)}</div>
          {c.was_price_cents && c.was_price_cents > c.price_cents && (
            <div className="tag text-xs line-through opacity-50">{fmt(c.was_price_cents)}</div>
          )}
        </div>
        <div className="col-span-2 md:col-span-1 text-right">
          {savings > 0 && (
            <div className="text-save font-bold text-sm">
              −{fmt(savings)}
              <div className="text-[10px] opacity-70">save {savingsPct}%</div>
            </div>
          )}
        </div>
      </div>
      {open && item.prices_at_other_stores.length > 0 && (
        <div className="mt-4 ml-[8.33%] pl-3 border-l-2 border-ink/30">
          <div className="text-xs tracking-[0.15em] uppercase opacity-60 mb-2">Same item, other stores</div>
          <div className="space-y-1">
            {item.prices_at_other_stores.map((p, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-sm">
                <span>{p.retailer_name} {p.on_sale && <span className="stamp text-cart text-[9px]">Sale</span>}</span>
                <span className="tag opacity-70">{fmt(p.price_cents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
