import { CategoryTiles } from '@/components/CategoryTiles';
import { AdSlot } from '@/components/AdSlot';

export const metadata = {
  title: 'Shop by Category',
  description: 'Browse weekly flyer deals by category: produce, dairy, meat, pantry, frozen, beverages, bakery, household.'
};

export default function CategoriesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="display text-5xl md:text-6xl font-black">Shop by category</h1>
      <p className="mt-4 text-slate-600 text-lg max-w-2xl">Pick a category to see the ranked cheapest deals this week across every store.</p>
      <div className="mt-10"><CategoryTiles /></div>
      <AdSlot slot="categories-bottom" />
    </div>
  );
}
