import Link from 'next/link';
import { toPostalPrefix } from '@/lib/postal';
import { getCheapestForPostal, getConfig } from '@/lib/data';
import type { CheapestRow } from '@/lib/types';
import { ItemList } from '@/components/ItemList';
import { TotalSavings } from '@/components/TotalSavings';

export async function generateStaticParams() {
  const { stores } = getConfig();
  const fsas = Array.from(new Set(stores.map((s) => s.postal_code.slice(0, 3))));
  return fsas.map((postal) => ({ postal }));
}

export const dynamic = 'force-static';
export const dynamicParams = true;

const CATEGORY_ORDER = ['produce', 'dairy', 'bakery', 'meat', 'pantry', 'frozen', 'beverage', 'household'];
const CATEGORY_LABEL: Record<string, string> = {
  produce: 'Produce', dairy: 'Dairy & Eggs', bakery: 'Bakery', meat: 'Meat & Seafood',
  pantry: 'Pantry', frozen: 'Frozen', beverage: 'Beverages', household: 'Household'
};

export default function PostalPage({ params }: { params: { postal: string } }) {
  const prefix = toPostalPrefix(params.postal);
  if (!prefix) {
    return (
      <main className="min-h-screen px-6 md:px-12 py-20">
        <h1 className="display text-5xl font-bold mb-4">Invalid postal code.</h1>
        <Link href="/" className="underline">← Back</Link>
      </main>
    );
  }
  const data = getCheapestForPostal(prefix);
  const items: CheapestRow[] = data.items;
  const today = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const byCategory = new Map<string, CheapestRow[]>();
  for (const i of items) {
    const arr = byCategory.get(i.product_category) || [];
    arr.push(i);
    byCategory.set(i.product_category, arr);
  }
  const totalSavings = items.reduce((s, i) => s + (i.savings_cents || 0), 0);
  return (
    <main className="min-h-screen pb-20">
      <header className="px-6 md:px-12 pt-6 pb-3 rule-thick border-b border-ink">
        <div className="flex items-baseline justify-between">
          <Link href="/" className="text-xs tracking-[0.2em] uppercase hover:underline">← CheapCart</Link>
          <div className="text-xs tracking-[0.2em] uppercase">{today}</div>
        </div>
      </header>
      <section className="px-6 md:px-12 pt-10 pb-6">
        <p className="text-xs tracking-[0.25em] uppercase mb-4">
          Today&apos;s Price Ledger · Postal {prefix} · {data.stores_count} stores
        </p>
        <h1 className="display text-6xl md:text-8xl font-black leading-[0.9] mb-6">
          {items.length > 0
            ? <>{items.length} items.<br/><span className="italic font-normal">Cheapest store, ranked.</span></>
            : <>No prices yet for <span className="tag">{prefix}</span>.</>
          }
        </h1>
        {items.length > 0 && (
          <TotalSavings savingsCents={totalSavings} itemCount={items.length} storeCount={data.stores_count} />
        )}
        {items.length === 0 && (
          <div className="mt-8 max-w-2xl">
            <p className="text-lg">We launched in St. Catharines first. Available postal areas: L2N, L2S, L2T, L2M.</p>
            <Link href="/" className="inline-block mt-6 underline">← Try another postal code</Link>
          </div>
        )}
      </section>
      {items.length > 0 && (
        <div className="px-6 md:px-12 mt-10 space-y-16">
          {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => (
            <section key={cat}>
              <div className="flex items-baseline justify-between mb-4 rule-thick pt-3">
                <h2 className="display text-3xl md:text-4xl font-bold">{CATEGORY_LABEL[cat]}</h2>
                <span className="text-xs tracking-[0.2em] uppercase opacity-70">{(byCategory.get(cat) || []).length} items</span>
              </div>
              <ItemList items={byCategory.get(cat) || []} />
            </section>
          ))}
          <section className="rule-thick pt-8 mt-8">
            <h3 className="display text-3xl md:text-4xl font-bold mb-3">Spotted a different price?</h3>
            <p className="max-w-2xl mb-6">Prices change daily and our data isn&apos;t perfect. If you saw something different in-store today, tell us — every report makes the ledger sharper.</p>
            <Link href="/report" className="inline-block bg-ink text-paper px-6 py-3 text-sm tracking-[0.2em] uppercase font-bold hover:bg-cart transition">Report a Price →</Link>
          </section>
        </div>
      )}
    </main>
  );
}
