import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';
import { GUIDES } from '@/lib/guides';

export const metadata = {
  title: 'Grocery Savings Guides',
  description: 'In-depth guides to saving at Canadian grocery stores — loyalty programs, flyer stacking, coupon strategies, meal budgeting.'
};



export default function GuidesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold mb-3">Savings guides</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight">Learn to save, not just scan.</h1>
      <p className="mt-4 text-slate-600 text-lg max-w-2xl">
        Practical playbooks for Canadian shoppers — price matching, loyalty programs, coupon stacking, unit prices and meal planning.
      </p>

      <AdSlot slot="guides-top" />

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {GUIDES.map(g => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card p-6 lift group">
            <div className="text-xs tracking-wider uppercase text-slate-500">{g.category} · {g.readTime} read</div>
            <h2 className="display text-2xl font-bold mt-2 group-hover:text-cart">{g.title}</h2>
            <p className="text-sm text-slate-600 mt-2">{g.excerpt}</p>
            <div className="mt-3 text-xs font-bold uppercase tracking-wider text-cart">Read →</div>
          </Link>
        ))}
      </div>

      <div className="mt-16"><EmailCapture source="guides" cta="Get new guides by email" title="Get new guides by email" /></div>
    </div>
  );
}
