import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';

export const metadata = { title: 'Coupon Directory (Canada)', description: 'Every legit Canadian grocery coupon source in one place — printable, digital, loyalty, and cashback apps.' };

const SOURCES = [
  { cat: 'Printable coupons', items: [
    { n: 'WebSaver', u: 'https://websaver.ca', d: 'Free printable + mail-delivered coupons. Canada’s largest manufacturer source.' },
    { n: 'SmartSource', u: 'https://smartsource.ca', d: 'Printable P&G, Unilever, Kraft Heinz coupons.' },
    { n: 'Save.ca', u: 'https://save.ca', d: 'Aggregator of printable + mail-order coupons.' }
  ]},
  { cat: 'Cashback & receipt apps', items: [
    { n: 'Checkout 51', u: 'https://checkout51.com', d: 'Snap your receipt for weekly cashback offers.' },
    { n: 'Caddle', u: 'https://caddle.ca', d: 'Surveys + receipt scans.' },
    { n: 'Rakuten Canada', u: 'https://rakuten.ca', d: 'Online grocery cashback (Instacart, Voilà).' }
  ]},
  { cat: 'Loyalty programs', items: [
    { n: 'PC Optimum', u: 'https://pcoptimum.ca', d: 'Loblaw banners: No Frills, Zehrs, Real Canadian Superstore, Shoppers.' },
    { n: 'Scene+', u: 'https://sceneplus.ca', d: 'Sobeys, FreshCo, Safeway, Foodland.' },
    { n: 'Metro & Moi', u: 'https://metro.ca', d: 'Metro banners (Ontario & Quebec).' },
    { n: 'Walmart Rewards', u: 'https://walmart.ca', d: 'Cashback on Walmart Rewards Mastercard.' }
  ]},
  { cat: 'Near-expiry apps', items: [
    { n: 'Flashfood', u: 'https://flashfood.com', d: 'Up to 50% off near-expiry at Loblaw banners.' },
    { n: 'Too Good To Go', u: 'https://toogoodtogo.com', d: 'Surprise bags from bakeries & grocers.' }
  ]}
];

export default function CouponsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Coupons</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Coupon Directory · Canada</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-2xl">
        Every legit Canadian grocery coupon and cashback source, vetted. We don&apos;t earn commissions on the ones below unless marked.
      </p>
      <AdSlot slot="coupons-top" />
      <div className="mt-10 space-y-10">
        {SOURCES.map(s => (
          <section key={s.cat}>
            <h2 className="display text-3xl font-black rule-thick pt-3 mb-4">{s.cat}</h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {s.items.map(i => (
                <li key={i.n} className="card p-5">
                  <a href={i.u} target="_blank" rel="nofollow noopener sponsored" className="block group">
                    <div className="font-bold text-lg group-hover:text-cart">{i.n} ↗</div>
                    <p className="text-sm text-slate-600 mt-1">{i.d}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-12 text-xs text-slate-500">See our <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.</p>
    </div>
  );
}
