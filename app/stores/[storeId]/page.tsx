import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllStores, getDealsByStore, formatPrice, daysUntil } from '@/lib/data';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';

const CAT_LABEL: Record<string,string> = {
  produce:'Produce', dairy:'Dairy & Eggs', bakery:'Bakery', meat:'Meat & Seafood',
  pantry:'Pantry', frozen:'Frozen', beverage:'Beverages', household:'Household'
};

export default function StorePage({ params }: { params: { storeId: string } }) {
  const { store, deals } = getDealsByStore(params.storeId);
  if (!store) return notFound();

  const byCat = new Map<string, typeof deals>();
  for (const d of deals) {
    const arr = byCat.get(d.product.category) || [];
    arr.push(d); byCat.set(d.product.category, arr);
  }
  const sorted = Object.keys(CAT_LABEL).filter(c => byCat.has(c));

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <nav className="text-xs uppercase tracking-wider text-slate-500 mb-4">
        <Link href="/stores" className="hover:text-ink">Stores</Link> › <span className="text-ink font-bold">{store.name}</span>
      </nav>
      <h1 className="display text-4xl md:text-6xl font-black leading-tight">{store.name}</h1>
      <div className="text-slate-600 mt-2">{store.address} · {store.city}, {store.province} {store.postal_code}</div>
      <div className="mt-2 text-sm">
        <span className="tag mr-2">{deals.length} items this week</span>
      </div>

      <AdSlot slot="store-top" />

      <div className="mt-8 space-y-10">
        {sorted.map(cat => (
          <section key={cat}>
            <h2 className="display text-2xl font-black mb-3 rule-thick pt-3">{CAT_LABEL[cat]}</h2>
            <ul className="divide-y divide-slate-200 border-y">
              {(byCat.get(cat)||[]).map(d => (
                <li key={d.row.product_slug} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold">{d.product.name}</div>
                    <div className="text-xs text-slate-500">{d.product.unit}</div>
                  </div>
                  <div className="text-right">
                    {d.row.on_sale && <span className="text-[9px] bg-cart text-paper px-1 tracking-wider mr-1 font-bold">SALE</span>}
                    <span className="mono font-bold text-lg">{formatPrice(d.row.price_cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {deals.length === 0 && <p className="text-slate-500">No data yet for this store this week. Check back after next scrape.</p>}
      </div>

      <div className="mt-16">
        <EmailCapture source={`store-${store.id}`} cta="Get alerts for this store" />
      </div>
    </div>
  );
}
