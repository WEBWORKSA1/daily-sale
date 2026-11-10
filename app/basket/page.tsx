import { getBasketMatrix, getSiteStats } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { BasketBuilder } from '@/components/BasketBuilder';
import { AdSlot } from '@/components/AdSlot';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Cheapest Basket Builder',
  description: 'Build your grocery list and see the cheapest store for each item, the best one-stop shop, and your total — from this week’s St. Catharines flyers.'
};

export default function BasketPage() {
  const data = getBasketMatrix();
  const stats = getSiteStats();
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Tool · Cheapest basket</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Your list. The cheapest way to buy it.</h1>
      <p className="mt-4 text-slate-600 text-lg max-w-3xl">Add what you need. We total it at the cheapest store per item (split shop) and at the best single store, using this week&apos;s flyer prices. Updated {formatDate(stats.generatedAt)}.</p>
      <div className="mt-10"><BasketBuilder {...data} /></div>
      <AdSlot slot="basket-bottom" />
    </div>
  );
}
