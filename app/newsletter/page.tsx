import { getBasketMatrix } from '@/lib/data';
import { PriceAlertSignup } from '@/components/PriceAlertSignup';
import { EmailCapture } from '@/components/EmailCapture';

export const metadata = { title: 'Free Deal Alerts — Thursday Email & Price-Drop Alerts', description: 'Free weekly grocery deal email every Thursday plus price-drop alerts on the items you buy. No spam, unsubscribe anytime.' };
export const dynamic = 'force-dynamic';

const BENEFITS = [
  { n: 'Thu', l: 'Top-10 price gaps in your area, every Thursday morning' },
  { n: '12', l: 'Staples you can watch for price drops' },
  { n: '2 min', l: 'To read — then shop knowing where it’s cheapest' },
  { n: '$0', l: 'Free forever. Never sold, never spammed' }
];

export default function NewsletterPage() {
  const { products } = getBasketMatrix();
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Free deal alerts</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Know where it&apos;s cheapest before you leave home.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-3xl">Two free alerts: a Thursday email with the week&apos;s biggest price gaps between local stores, and price-drop alerts on the exact staples you buy.</p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {BENEFITS.map(s => (
          <div key={s.l} className="card p-4">
            <div className="display text-3xl font-black text-cart">{s.n}</div>
            <div className="text-xs mt-1 text-slate-600">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-10"><PriceAlertSignup items={products} source="newsletter-page" /></div>
      <div className="mt-10"><EmailCapture source="newsletter-page-simple" title="Just the Thursday email" subtitle="The 10 biggest savings in your area, once a week." cta="Subscribe free" /></div>
    </div>
  );
}
