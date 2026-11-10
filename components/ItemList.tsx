'use client';
import { useState } from 'react';
import type { CheapestRow } from '@/lib/types';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export function ItemList({ items }: { items: CheapestRow[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  function toggle(id: number) {
    const n = new Set(open);
    if (n.has(id)) n.delete(id); else n.add(id);
    setOpen(n);
  }
  return (
    <ul className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map(i => {
        const isOpen = open.has(i.product_id);
        const hasOthers = i.prices_at_other_stores.length > 0;
        return (
          <li key={i.product_id} className="py-4">
            <button onClick={() => toggle(i.product_id)}
              className="w-full flex items-center gap-3 md:gap-5 text-left"
              aria-expanded={isOpen}>
              <span className="text-xs mono text-slate-400 w-10 shrink-0">#{String(i.product_rank).padStart(3,'0')}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{i.product_name}</div>
                <div className="text-xs text-slate-500">{i.product_unit || ''}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Cheapest at</div>
                <div className="font-bold text-sm">{i.cheapest.retailer_name}</div>
              </div>
              <div className="text-right shrink-0 min-w-[80px]">
                {i.cheapest.on_sale && <span className="inline-block bg-cart text-paper text-[9px] font-bold px-1 tracking-wider mr-1">SALE</span>}
                <div className="price-tag text-xl md:text-2xl">{formatPrice(i.cheapest.price_cents)}</div>
                {i.savings_cents > 0 && (
                  <div className="text-xs text-save font-bold">save {formatPrice(i.savings_cents)}</div>
                )}
              </div>
              <span className="ml-2 text-slate-400 w-4 text-right">{hasOthers ? (isOpen ? '−' : '+') : ''}</span>
            </button>
            {isOpen && hasOthers && (
              <div className="mt-3 pl-14 space-y-1 animate-slide-up">
                {i.prices_at_other_stores.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm py-1">
                    <span className="flex-1 text-slate-600">{p.retailer_name}</span>
                    {p.on_sale && <span className="text-[9px] bg-cart text-paper px-1 tracking-wider">SALE</span>}
                    <span className="mono font-medium">{formatPrice(p.price_cents)}</span>
                    <span className="text-xs text-slate-400 w-16 text-right">
                      +{formatPrice(p.price_cents - i.cheapest.price_cents)}
                    </span>
                  </div>
                ))}
                <Link href={`/item/${i.product_slug}`} className="inline-block mt-2 text-xs font-bold underline hover:text-cart">Full comparison &amp; store details →</Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
