import Link from 'next/link';

const CATEGORIES = [
  { slug: 'produce', name: 'Produce', emoji: '🥬', color: 'bg-green-100' },
  { slug: 'dairy', name: 'Dairy & Eggs', emoji: '🥛', color: 'bg-blue-100' },
  { slug: 'meat', name: 'Meat & Seafood', emoji: '🥩', color: 'bg-red-100' },
  { slug: 'bakery', name: 'Bakery', emoji: '🍞', color: 'bg-yellow-100' },
  { slug: 'pantry', name: 'Pantry', emoji: '🥫', color: 'bg-orange-100' },
  { slug: 'frozen', name: 'Frozen', emoji: '🧊', color: 'bg-cyan-100' },
  { slug: 'beverage', name: 'Beverages', emoji: '☕', color: 'bg-amber-100' },
  { slug: 'household', name: 'Household', emoji: '🧴', color: 'bg-purple-100' }
];

export function CategoryTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CATEGORIES.map(c => (
        <Link key={c.slug} href={`/categories/${c.slug}`}
          className={`${c.color} p-6 rounded-sm border-2 border-transparent hover:border-ink lift`}>
          <div className="text-4xl mb-2">{c.emoji}</div>
          <div className="font-bold text-lg">{c.name}</div>
          <div className="text-xs text-slate-600 mt-1">See deals →</div>
        </Link>
      ))}
    </div>
  );
}
