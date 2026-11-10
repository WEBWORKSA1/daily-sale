import Link from 'next/link';
import { getAllRetailers, getAllStores, getDealsByStore, formatPrice } from '@/lib/data';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSlot } from '@/components/AdSlot';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'All Flyers — This Week',
  description: 'Every local grocer’s weekly flyer in one place. Auto-updated daily.'
};

export default function FlyersPage() {
  const retailers = getAllRetailers();
  const stores = getAllStores();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold mb-3">All Flyers · This Week</div>
      <h1 className="display text-5xl md:text-7xl font-black leading-[0.95]">Every flyer. One page.</h1>
      <p className="mt-4 text-slate-600 max-w-2xl text-lg">
        Instead of flipping through each grocer&apos;s app or printed circular, scan all of them here. Tap a store to see its top deals this week.
      </p>

      <AdSlot slot="flyers-top" />

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {retailers.map(r => {
          const storesOfR = stores.filter(s => s.retailer_slug === r.slug);
          const firstStore = storesOfR[0];
          const { deals } = firstStore ? getDealsByStore(firstStore.id) : { deals: [] };
          const sampleDeals = deals.slice(0, 4);

          return (
            <article key={r.slug} className="card p-6 lift">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="display text-3xl font-black">{r.name}</h2>
                  <div className="text-xs text-slate-500 mt-1">{storesOfR.length} location{storesOfR.length===1?'':'s'} · {deals.length} items this week</div>
                </div>
                <Link href={firstStore ? `/stores/${firstStore.id}` : '#'} className="btn-secondary py-1.5 px-3 text-[10px]">View Flyer →</Link>
              </div>
              {sampleDeals.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {sampleDeals.map(d => (
                    <li key={d.row.store_id + d.row.product_slug} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="truncate">{d.product.name}</span>
                      <span className="mono font-bold">{formatPrice(d.row.price_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-2">
                <a href={r.flyer_url} target="_blank" rel="nofollow noopener" className="text-xs text-slate-500 hover:text-cart underline">Visit official flyer</a>
              </div>
            </article>
          );
        })}
      </div>

      <AdSlot slot="flyers-bottom" />

      <div className="mt-16"><EmailCapture source="flyers-page" /></div>
    </div>
  );
}
