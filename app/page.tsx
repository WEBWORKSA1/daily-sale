import Link from 'next/link';
import { getAllRetailers, getAllStores, getTopDeals, getSiteStats, getBasketMatrix } from '@/lib/data';
import { formatPrice, formatDate } from '@/lib/format';
import { PriceAlertSignup } from '@/components/PriceAlertSignup';
import { ExitIntent } from '@/components/ExitIntent';
import { PostalGate } from '@/components/PostalGate';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';
import { DonationWidget } from '@/components/DonationWidget';
import { DealTicker } from '@/components/DealTicker';
import { StoreGrid } from '@/components/StoreGrid';
import { TrustStrip } from '@/components/TrustStrip';
import { HowItWorks } from '@/components/HowItWorks';
import { CategoryTiles } from '@/components/CategoryTiles';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const retailers = getAllRetailers();
  const stores = getAllStores();
  const topDeals = getTopDeals(12);
  const totalSavings = topDeals.reduce((s,d) => s + d.savings_cents, 0);
  const avgSavings = topDeals.length ? Math.round((totalSavings / topDeals.length) / 100) : 0;
  const stats = getSiteStats();
  const { products: alertItems } = getBasketMatrix();

  return (
    <>
      <DealTicker deals={topDeals.slice(0,10)} />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-10">
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          <div className="lg:col-span-3">
            <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold mb-4">Updated {formatDate(stats.generatedAt)} · {stats.livePrices} live flyer prices · {stats.storesWithPrices} stores</div>
            <h1 className="display text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Every grocer&apos;s flyer.
              <br/>
              <span className="italic font-normal">One page.</span>{' '}
              <span className="gradient-text">Ranked cheapest.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
              Stop flipping through 10 flyers. We read every local grocer&apos;s weekly flyer, match the same items, and tell you which store has the lowest price this week.
            </p>
            <div className="mt-8"><PostalGate /></div>
            <div className="mt-6 flex items-center gap-6 text-xs text-slate-500">
              <span>✓ Always free</span>
              <span>✓ No signup required</span>
              <span>✓ Updated daily</span>
              <span>✓ Independent</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/basket" className="btn-secondary py-2 px-4 text-xs">Build my cheapest basket →</Link>
              <Link href="/blog/this-week-st-catharines" className="btn-secondary py-2 px-4 text-xs">This week&apos;s report →</Link>
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="bg-ink text-paper p-6 rounded-sm">
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 mb-2">This week · across all local stores</div>
              <div className="display text-6xl md:text-7xl font-black gradient-text">${avgSavings}</div>
              <div className="text-sm opacity-80 mb-5">average price gap between stores on this week&apos;s top 12 deals — what you keep by buying each at the cheapest store.</div>
              <div className="text-xs tracking-[0.2em] uppercase opacity-70 mb-2">Top 3 deals right now</div>
              <ul className="space-y-2">
                {topDeals.slice(0,3).map(d => (
                  <li key={d.product_id} className="flex justify-between gap-2 text-sm py-1 border-b border-paper/20">
                    <span className="truncate">{d.product_name}</span>
                    <span className="mono font-bold text-accent">save {formatPrice(d.savings_cents)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/deals" className="mt-5 block w-full bg-cart text-paper text-center py-3 font-bold uppercase text-sm tracking-widest hover:bg-accent transition-colors">See all deals →</Link>
            </div>
          </aside>
        </div>
      </section>

      <TrustStrip />

      <AdSlot slot="homepage-top" />

      <HowItWorks />

      {/* CATEGORY TILES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-end justify-between mb-8 rule-thick pt-6">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-slate-500 mb-2">Browse by category</div>
            <h2 className="display text-4xl md:text-5xl font-black">What are you shopping for?</h2>
          </div>
          <Link href="/categories" className="hidden md:inline text-sm font-bold underline hover:text-cart">All categories →</Link>
        </div>
        <CategoryTiles />
      </section>

      <AdSlot slot="homepage-mid" />

      {/* STORE GRID */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-end justify-between mb-8 rule-thick pt-6">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-slate-500 mb-2">{stores.length} stores · {retailers.length} banners</div>
            <h2 className="display text-4xl md:text-5xl font-black">Every flyer, under one roof.</h2>
          </div>
          <Link href="/flyers" className="hidden md:inline text-sm font-bold underline hover:text-cart">All flyers →</Link>
        </div>
        <StoreGrid retailers={retailers} stores={stores} />
      </section>

      {/* LEAD GEN — dedicated, high-intent */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16" id="alerts">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3"><PriceAlertSignup items={alertItems} source="homepage-alerts" /></div>
          <div className="lg:col-span-2 space-y-5">
            <EmailCapture
              title="Never miss a deal."
              subtitle="Every Thursday morning, the 10 biggest savings across your local flyers."
              cta="Get Thursday Alerts"
              source="homepage"
            />
            <Link href="/contests" className="block bg-accent text-ink p-6 border-2 border-ink lift">
              <div className="text-xs uppercase tracking-[0.2em] font-bold">Contest · free to enter</div>
              <div className="display text-2xl font-black mt-1">Win a $100 grocery gift card →</div>
              <div className="text-sm mt-1">No purchase necessary. Open to Canadian residents (excl. QC).</div>
            </Link>
          </div>
        </div>
      </section>

      {/* DONATION */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-save font-bold mb-3">Independent & user-funded</div>
            <h2 className="display text-4xl md:text-5xl font-black leading-tight">We don&apos;t take money from grocers.</h2>
            <p className="mt-4 text-slate-600 text-lg">
              Grocers can&apos;t pay to change our rankings, and we don&apos;t take placement fees from them. Clearly labelled ads, sponsors and reader support keep daily.sale free and honest.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li>✓ No grocer pays us to feature their flyer</li>
              <li>✓ Your email never sold or shared</li>
              <li>✓ Support funds operations, promotion, hiring, contests &amp; new cities</li>
              <li>✓ Quarterly transparency note on what support paid for</li>
            </ul>
          </div>
          <DonationWidget />
        </div>
      </section>

      <AdSlot slot="homepage-bottom" />
      <ExitIntent />
    </>
  );
}
