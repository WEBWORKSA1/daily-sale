import Link from 'next/link';
import { getAllStores, getAllRetailers } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Stores Directory',
  description: 'Every grocery store we track — browse by banner or city.'
};

export default function StoresPage() {
  const stores = getAllStores();
  const retailers = getAllRetailers();
  const byCity = new Map<string, typeof stores>();
  for (const s of stores) {
    const arr = byCity.get(s.city) || [];
    arr.push(s); byCity.set(s.city, arr);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="display text-5xl md:text-6xl font-black leading-tight">Stores Directory</h1>
      <p className="mt-4 text-slate-600 text-lg max-w-2xl">
        {stores.length} grocery stores across {byCity.size} cit{byCity.size===1?'y':'ies'}, spanning {retailers.length} banners. More cities are added by demand.
      </p>

      <div className="mt-10 space-y-10">
        {Array.from(byCity.entries()).map(([city, cityStores]) => (
          <section key={city}>
            <h2 className="display text-3xl font-black mb-4 rule-thick pt-3">{city}, ON</h2>
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityStores.map(s => (
                <li key={s.id} className="card p-4">
                  <Link href={`/stores/${s.id}`} className="block group">
                    <div className="font-bold text-lg group-hover:text-cart">{s.name}</div>
                    <div className="text-sm text-slate-600">{s.address}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.postal_code}</div>
                    <div className="mt-3 text-xs text-cart font-bold uppercase tracking-wider">See flyer →</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
