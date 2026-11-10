import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDealsByCategory } from '@/lib/data';
import { ItemList } from '@/components/ItemList';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';

const LABEL: Record<string,string> = {
  produce:'Produce', dairy:'Dairy & Eggs', bakery:'Bakery', meat:'Meat & Seafood',
  pantry:'Pantry', frozen:'Frozen', beverage:'Beverages', household:'Household'
};

export default function CategoryPage({ params }: { params: { cat: string } }) {
  const label = LABEL[params.cat];
  if (!label) return notFound();
  const items = getDealsByCategory(params.cat);
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <nav className="text-xs uppercase tracking-wider text-slate-500 mb-4">
        <Link href="/categories" className="hover:text-ink">Categories</Link> › <span className="text-ink font-bold">{label}</span>
      </nav>
      <h1 className="display text-5xl md:text-6xl font-black">{label}</h1>
      <p className="mt-4 text-slate-600 text-lg">{items.length} items ranked cheapest this week across every store.</p>

      <AdSlot slot="category-top" />

      <div className="mt-8"><ItemList items={items} /></div>

      <div className="mt-16"><EmailCapture source={`category-${params.cat}`} /></div>
    </div>
  );
}
