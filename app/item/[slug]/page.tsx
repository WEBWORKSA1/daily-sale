import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllProducts, getProduct, getProductPrices, getSiteStats, CATEGORY_LABELS } from '@/lib/data';
import { formatPrice, formatDate } from '@/lib/format';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getProduct(params.slug);
  if (!p) return { title: 'Item not found' };
  const prices = getProductPrices(p.slug);
  const low = prices[0];
  const title = `Cheapest ${p.name}${p.unit ? ' ' + p.unit : ''} this week — St. Catharines`;
  const description = low
    ? `${p.name} is cheapest at ${low.retailer?.name || low.store.name} for ${formatPrice(low.row.price_cents)} this week. Compare ${prices.length} local store prices, updated daily.`
    : `Compare ${p.name} prices across St. Catharines grocers. Updated daily from weekly flyers.`;
  return { title, description, alternates: { canonical: `/item/${p.slug}` } };
}

export default function ItemPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) return notFound();
  const prices = getProductPrices(product.slug);
  const stats = getSiteStats();
  const low = prices[0];
  const high = prices[prices.length - 1];
  const related = getAllProducts().filter(p => p.category === product.category && p.slug !== product.slug).slice(0, 8);
  const cat = CATEGORY_LABELS[product.category] || product.category;

  const ld = low ? {
    '@context': 'https://schema.org', '@type': 'Product', name: `${product.name}${product.unit ? ' ' + product.unit : ''}`, category: cat,
    offers: {
      '@type': 'AggregateOffer', priceCurrency: 'CAD', lowPrice: (low.row.price_cents / 100).toFixed(2),
      highPrice: (high.row.price_cents / 100).toFixed(2), offerCount: prices.length
    }
  } : null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <nav className="text-xs uppercase tracking-wider text-slate-500 mb-4" aria-label="Breadcrumb">
        <Link href="/deals" className="hover:text-ink">Deals</Link> › <Link href={`/categories/${product.category}`} className="hover:text-ink">{cat}</Link> › <span className="text-ink font-bold">{product.name}</span>
      </nav>
      <h1 className="display text-4xl md:text-6xl font-black leading-tight">{product.name} <span className="text-slate-400 font-normal text-3xl md:text-4xl">{product.unit}</span></h1>
      <p className="mt-3 text-sm text-slate-500">Updated {formatDate(stats.generatedAt)} · St. Catharines &amp; Niagara · from this week&apos;s flyers</p>

      {low ? (
        <>
          <section className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-ink text-paper p-6 md:col-span-2">
              <div className="text-xs uppercase tracking-[0.2em] opacity-70">Cheapest this week</div>
              <div className="display text-5xl md:text-6xl font-black mt-2 text-accent">{formatPrice(low.row.price_cents)}</div>
              <div className="mt-2 text-lg font-bold">{low.retailer?.name} — {low.store.name}</div>
              <div className="text-sm opacity-80">{low.store.address}, {low.store.city}</div>
              {low.row.valid_until && <div className="mt-3 text-xs opacity-70">Flyer price valid until {formatDate(low.row.valid_until)}</div>}
            </div>
            <div className="card p-6">
              <div className="text-xs uppercase tracking-wider text-slate-500">Price gap between stores</div>
              <div className="display text-4xl font-black text-save mt-2">{formatPrice(high.row.price_cents - low.row.price_cents)}</div>
              <p className="text-sm text-slate-600 mt-2">Buying at the cheapest store instead of the most expensive across {prices.length} stores.</p>
            </div>
          </section>

          <AdSlot slot="item-top" />

          <section className="mt-8">
            <h2 className="display text-2xl font-black mb-3">Every local price, cheapest first</h2>
            <table className="w-full text-sm border-2 border-ink">
              <thead className="bg-ink text-paper text-left">
                <tr><th className="p-3">#</th><th className="p-3">Store</th><th className="p-3 text-right">Price</th><th className="p-3 text-right hidden sm:table-cell">vs. cheapest</th></tr>
              </thead>
              <tbody>
                {prices.map((p, i) => (
                  <tr key={p.store.id} className={i === 0 ? 'bg-save/10 font-bold' : 'border-t border-slate-200'}>
                    <td className="p-3 mono">{i + 1}</td>
                    <td className="p-3">
                      <Link href={`/stores/${p.store.id}`} className="hover:underline">{p.retailer?.name}</Link>
                      <div className="text-xs text-slate-500 font-normal">{p.store.name}</div>
                    </td>
                    <td className="p-3 text-right mono">
                      {p.row.on_sale && <span className="bg-cart text-paper text-[9px] px-1 mr-1 align-middle">SALE</span>}
                      {formatPrice(p.row.price_cents)}
                      {p.row.was_price_cents && p.row.was_price_cents > p.row.price_cents && <div className="text-xs line-through text-slate-400">{formatPrice(p.row.was_price_cents)}</div>}
                    </td>
                    <td className="p-3 text-right mono hidden sm:table-cell">{i === 0 ? '—' : `+${formatPrice(p.row.price_cents - low.row.price_cents)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">Prices from retailer flyers; may vary by store and change without notice. Confirm in store. <Link href="/report" className="underline">Report a different price</Link>.</p>
          </section>
        </>
      ) : (
        <div className="mt-8 card p-8">
          <h2 className="display text-2xl font-black">No flyer deal on {product.name} this week</h2>
          <p className="text-slate-600 mt-2">None of the stores we track is advertising this item in the current flyers. We check again every day — set an alert and we&apos;ll email you when it goes on sale.</p>
        </div>
      )}

      <section className="mt-10 grid md:grid-cols-2 gap-6 items-start">
        <div className="card p-6">
          <h2 className="display text-xl font-black">Tips for buying {product.name.toLowerCase()}</h2>
          <ul className="mt-3 text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>Compare the unit price on the shelf tag, not just the sticker price.</li>
            <li>Stores that price match will usually honour a competitor&apos;s current flyer — bring the retailer&apos;s own flyer.</li>
            <li>Most flyers run Thursday to Wednesday; the best {cat.toLowerCase()} deals often appear at the start of the cycle.</li>
          </ul>
          <Link href="/guides" className="inline-block mt-4 text-sm font-bold underline">More savings guides →</Link>
        </div>
        <EmailCapture source={`item-${product.slug}`} title={`Get alerted when ${product.name} drops`} subtitle="One short email when it hits its best price in your area, plus the Thursday top-10." cta="Alert me" />
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="display text-2xl font-black mb-3">More {cat.toLowerCase()} prices</h2>
          <div className="flex flex-wrap gap-2">
            {related.map(r => <Link key={r.slug} href={`/item/${r.slug}`} className="px-3 py-1.5 border-2 border-slate-300 hover:border-ink text-sm">{r.name}</Link>)}
          </div>
        </section>
      )}
    </div>
  );
}
