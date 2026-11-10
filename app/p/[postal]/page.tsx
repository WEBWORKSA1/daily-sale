import Link from 'next/link';
import { toPostalPrefix } from '@/lib/postal';
import { getCheapestForPostal } from '@/lib/data';
import type { CheapestRow } from '@/lib/types';
import { ItemList } from '@/components/ItemList';
import { TotalSavings } from '@/components/TotalSavings';
import { EmailCapture } from '@/components/EmailCapture';
import { AdSlot } from '@/components/AdSlot';
import { PostalGate } from '@/components/PostalGate';

export const dynamic = 'force-dynamic';

const CATEGORY_ORDER = ['produce','dairy','bakery','meat','pantry','frozen','beverage','household'];
const CATEGORY_LABEL: Record<string,string> = {
  produce:'Produce', dairy:'Dairy & Eggs', bakery:'Bakery', meat:'Meat & Seafood',
  pantry:'Pantry', frozen:'Frozen', beverage:'Beverages', household:'Household'
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
}

export default function PostalPage({ params }: { params: { postal: string } }) {
  const prefix = toPostalPrefix(params.postal);
  if (!prefix) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-20">
        <h1 className="display text-4xl md:text-5xl font-bold mb-4">That doesn&apos;t look like a postal code.</h1>
        <p className="text-slate-600 mb-8">Try again below.</p>
        <PostalGate />
      </div>
    );
  }
  const data = getCheapestForPostal(prefix);
  const items: CheapestRow[] = data.items;
  const validThrough = fmtDate(data.flyer_week_expiry || null);
  const byCategory = new Map<string, CheapestRow[]>();
  for (const i of items) {
    const arr = byCategory.get(i.product_category) || [];
    arr.push(i); byCategory.set(i.product_category, arr);
  }
  const totalSavings = items.reduce((s,i) => s + (i.savings_cents||0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wider pt-6 text-slate-500">
        <Link href="/" className="hover:text-ink">Home</Link><span>›</span>
        <Link href="/deals" className="hover:text-ink">Deals</Link><span>›</span>
        <span className="text-ink font-bold">{prefix}</span>
      </nav>

      <header className="pt-6 pb-4">
        <div className="text-xs tracking-[0.25em] uppercase mb-3">
          {validThrough ? `Valid through ${validThrough}` : 'This week'} · Postal {prefix} · {data.stores_count} stores
        </div>
        <h1 className="display text-5xl md:text-7xl font-black leading-[0.95]">
          {items.length > 0
            ? <>{items.length} items.<br/><span className="italic font-normal">Cheapest store, ranked.</span></>
            : <>No deals yet for <span className="tag">{prefix}</span>.</>}
        </h1>
        {items.length > 0 && <TotalSavings savingsCents={totalSavings} itemCount={items.length} storeCount={data.stores_count} />}
        {items.length === 0 && (
          <div className="mt-8 max-w-2xl">
            <p className="text-lg mb-6">We launched in St. Catharines &amp; Niagara (L2) first — new cities launch by demand.</p>
            <PostalGate cta="Try a St. Catharines postal →" />
            <div className="mt-6">
              <EmailCapture inline
                title="Tell us when your city goes live"
                source={`waitlist-${prefix}`}
                cta="Notify me" />
            </div>
          </div>
        )}
      </header>

      {items.length > 0 && (
        <>
          <AdSlot slot="postal-top" />
          <div className="space-y-12">
            {CATEGORY_ORDER.filter(c => byCategory.has(c)).map(cat => (
              <section key={cat}>
                <div className="flex items-baseline justify-between mb-3 rule-thick pt-3">
                  <h2 className="display text-2xl md:text-3xl font-black">{CATEGORY_LABEL[cat]}</h2>
                  <span className="text-xs tracking-[0.2em] uppercase opacity-70">{(byCategory.get(cat)||[]).length} items</span>
                </div>
                <ItemList items={byCategory.get(cat)||[]} />
              </section>
            ))}
          </div>

          <AdSlot slot="postal-mid" />

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <section className="card p-6">
              <h3 className="display text-2xl font-black mb-2">Spotted a different price?</h3>
              <p className="text-sm text-slate-600 mb-4">Flyer prices shift — if you saw something different, tell us. Every report sharpens the data for everyone.</p>
              <Link href={`/report?postal=${prefix}`} className="btn-primary">Report a Price →</Link>
            </section>
            <section className="card p-6">
              <h3 className="display text-2xl font-black mb-2">Weekly email, Thursday 7 a.m.</h3>
              <p className="text-sm text-slate-600 mb-4">The 10 biggest savings the moment new flyers drop.</p>
              <EmailCapture inline cta="Subscribe" source={`postal-${prefix}`} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: { postal: string } }) {
  const prefix = (params.postal || '').toUpperCase().slice(0,3);
  return {
    title: `This Week’s Grocery Deals · Postal ${prefix}`,
    description: `Cheapest grocery deals across every major flyer for postal ${prefix}. Updated daily.`,
    alternates: { canonical: `https://daily.sale/p/${prefix}` }
  };
}
