import { getCheapestForPostal } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { ItemList } from '@/components/ItemList';
import { TotalSavings } from '@/components/TotalSavings';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';
import { PostalGate } from '@/components/PostalGate';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'This Week’s Deals — Ranked Across Every Store',
  description: 'The cheapest grocery deal for every item this week, ranked across every local grocer’s flyer. Updated daily, free.'
};

const CATEGORY_ORDER = ['produce','dairy','bakery','meat','pantry','frozen','beverage','household'];
const CATEGORY_LABEL: Record<string,string> = {
  produce:'Produce', dairy:'Dairy & Eggs', bakery:'Bakery', meat:'Meat & Seafood',
  pantry:'Pantry', frozen:'Frozen', beverage:'Beverages', household:'Household'
};

export default function DealsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q || '').trim().toLowerCase().slice(0, 60);
  const all = getCheapestForPostal('L2');
  const data = q ? { ...all, items: all.items.filter(i => i.product_name.toLowerCase().includes(q) || i.product_category.includes(q)) } : all;
  const totalSavings = data.items.reduce((s,i) => s + i.savings_cents, 0);
  const byCategory = new Map<string, typeof data.items>();
  for (const i of data.items) {
    const arr = byCategory.get(i.product_category) || [];
    arr.push(i); byCategory.set(i.product_category, arr);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold mb-3">This week&apos;s deals · auto-updated</div>
      <h1 className="display text-5xl md:text-7xl font-black leading-[0.95]">
        Every store.<br/><span className="italic font-normal">Every price.</span> Ranked cheapest.
      </h1>

      <p className="mt-4 text-sm text-slate-500">Last updated {formatDate(all.generated_at)}{all.flyer_week_expiry ? ` · most flyer prices valid until ${formatDate(all.flyer_week_expiry)}` : ''}{all.stale ? ' · flyers refreshing — confirm prices in store' : ''}</p>
      <form action="/deals" method="get" className="mt-6 flex gap-2 max-w-xl" role="search">
        <input name="q" defaultValue={q} placeholder="Search items: milk, eggs, chicken…" aria-label="Search deals" className="input-primary flex-1" />
        <button className="btn-primary">Search</button>
      </form>
      {q && <p className="mt-3 text-sm">{data.items.length} result{data.items.length === 1 ? '' : 's'} for “{q}” · <Link href="/deals" className="underline">clear</Link></p>}
      <div className="mt-6 max-w-xl"><PostalGate cta="Localize to my city →" /></div>

      <TotalSavings savingsCents={totalSavings} itemCount={data.items.length} storeCount={data.stores_count} />

      <AdSlot slot="deals-top" />

      <div className="space-y-12 mt-10">
        {CATEGORY_ORDER.filter(c => byCategory.has(c)).map(cat => (
          <section key={cat}>
            <div className="flex items-baseline justify-between mb-3 rule-thick pt-3">
              <h2 className="display text-2xl md:text-3xl font-black">{CATEGORY_LABEL[cat]}</h2>
              <Link href={`/categories/${cat}`} className="text-xs tracking-[0.2em] uppercase opacity-70 hover:text-cart">
                View all {(byCategory.get(cat)||[]).length} →
              </Link>
            </div>
            <ItemList items={byCategory.get(cat)||[]} />
          </section>
        ))}
      </div>

      <div className="mt-16"><EmailCapture source="deals-page" /></div>
    </div>
  );
}
