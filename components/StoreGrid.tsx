import Link from 'next/link';
import type { Retailer, Store } from '@/lib/types';

export function StoreGrid({ retailers, stores }: { retailers: Retailer[]; stores: Store[] }) {
  const byRetailer = new Map<string, Store[]>();
  for (const s of stores) {
    const arr = byRetailer.get(s.retailer_slug) || [];
    arr.push(s); byRetailer.set(s.retailer_slug, arr);
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {retailers.map(r => {
        const count = byRetailer.get(r.slug)?.length || 0;
        const first = byRetailer.get(r.slug)?.[0];
        return (
          <Link key={r.slug} href={first ? `/stores/${first.id}` : '/stores'}
            className="card p-6 lift group">
            <div className="display text-2xl font-black mb-1 group-hover:text-cart">{r.name}</div>
            <div className="text-xs text-slate-500">{count} location{count===1?'':'s'}</div>
            <div className="mt-3 text-xs text-slate-600">
              Current flyer · auto-refreshed
            </div>
          </Link>
        );
      })}
    </div>
  );
}
