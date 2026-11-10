import type { CheapestRow } from '@/lib/types';
import { formatPrice } from '@/lib/format';

export function DealTicker({ deals }: { deals: CheapestRow[] }) {
  if (!deals.length) return null;
  const items = [...deals, ...deals]; // duplicate for seamless loop
  return (
    <div className="bg-cart text-paper overflow-hidden border-b-2 border-ink">
      <div className="flex items-center">
        <div className="shrink-0 bg-ink py-2 px-4 text-xs tracking-[0.2em] uppercase font-bold">
          🔥 Hot Now
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1 min-w-0">
          <div className="marquee inline-flex gap-8 py-2">
            {items.map((d, i) => (
              <span key={i} className="text-sm">
                <span className="font-bold">{d.product_name}</span>
                <span className="opacity-80"> @ {d.cheapest.retailer_name}</span>
                <span className="mono ml-2 font-bold">{formatPrice(d.cheapest.price_cents)}</span>
                <span className="opacity-80 mono ml-2">· save {formatPrice(d.savings_cents)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
