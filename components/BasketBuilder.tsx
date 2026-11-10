'use client';
import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';

type P = { slug: string; name: string; unit: string; category: string };
type S = { id: string; name: string; retailer: string };

const STARTER = ['milk-2pct-4l', 'eggs-large-dozen', 'bread-white-675g', 'bananas-lb', 'chicken-breast-bnls-skls-lb', 'butter-salted-454g', 'apples-gala-3lb', 'cheese-cheddar-block-400g'];

export function BasketBuilder({ products, stores, matrix }: { products: P[]; stores: S[]; matrix: Record<string, Record<string, number>> }) {
  const [picked, setPicked] = useState<string[]>(() => STARTER.filter(s => matrix[s]).slice(0, 6));
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);
  const bySlug = useMemo(() => new Map(products.map(p => [p.slug, p])), [products]);
  const storeById = useMemo(() => new Map(stores.map(s => [s.id, s])), [stores]);

  const results = useMemo(() => {
    // Split shopping: cheapest store per item.
    const split = picked.map(slug => {
      const row = matrix[slug] || {};
      const best = Object.entries(row).sort((a, b) => a[1] - b[1])[0];
      return { slug, store: best?.[0], cents: best?.[1] ?? 0 };
    });
    const splitTotal = split.reduce((s, x) => s + x.cents, 0);
    // One-stop: per store, total of items it has; rank by coverage then total.
    const oneStop = stores.map(s => {
      let total = 0, have = 0;
      for (const slug of picked) { const c = matrix[slug]?.[s.id]; if (c) { total += c; have++; } }
      return { store: s, total, have };
    }).filter(x => x.have > 0).sort((a, b) => b.have - a.have || a.total - b.total);
    const groups = new Map<string, { slug: string; cents: number }[]>();
    for (const x of split) if (x.store) { const g = groups.get(x.store) || []; g.push(x); groups.set(x.store, g); }
    return { split, splitTotal, oneStop, groups };
  }, [picked, matrix, stores]);

  const filtered = products.filter(p => !picked.includes(p.slug) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));

  function copyList() {
    const lines: string[] = ['My daily.sale cheapest basket'];
    results.groups.forEach((items, sid) => {
      lines.push('', `${storeById.get(sid)?.retailer} — ${storeById.get(sid)?.name}`);
      items.forEach(i => lines.push(`  • ${bySlug.get(i.slug)?.name} ${bySlug.get(i.slug)?.unit} — ${formatPrice(i.cents)}`));
    });
    lines.push('', `Total: ${formatPrice(results.splitTotal)}`, 'https://daily.sale/basket');
    try { navigator.clipboard.writeText(lines.join('\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const best = results.oneStop[0];
  const bestFull = results.oneStop.find(o => o.have === picked.length);

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start">
      <section className="lg:col-span-2">
        <h2 className="display text-2xl font-black">1 · Build your list</h2>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search 100 items… (milk, eggs, chicken)" aria-label="Search items" className="input-primary mt-3" />
        <div className="mt-3 max-h-80 overflow-auto border-2 border-slate-200 divide-y">
          {filtered.slice(0, 60).map(p => (
            <button key={p.slug} onClick={() => setPicked(x => [...x, p.slug])} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex justify-between text-sm">
              <span>{p.name} <span className="text-slate-400">{p.unit}</span></span><span className="text-cart font-bold">+ add</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-3 text-sm text-slate-500">No more matching items with current prices.</p>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {picked.map(s => (
            <button key={s} onClick={() => setPicked(x => x.filter(y => y !== s))} className="px-3 py-1 text-sm bg-ink text-paper" aria-label={`Remove ${bySlug.get(s)?.name}`}>
              {bySlug.get(s)?.name} ×
            </button>
          ))}
        </div>
      </section>

      <section className="lg:col-span-3 space-y-5">
        <h2 className="display text-2xl font-black">2 · Your cheapest options</h2>
        {picked.length === 0 ? <p className="text-slate-600">Add items to see where to shop.</p> : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-save text-paper p-5">
                <div className="text-xs uppercase tracking-wider opacity-80">Split shop (cheapest per item)</div>
                <div className="display text-4xl font-black mt-1">{formatPrice(results.splitTotal)}</div>
                <div className="text-sm opacity-90">{results.groups.size} store{results.groups.size === 1 ? '' : 's'} · {picked.length} items</div>
              </div>
              <div className="bg-ink text-paper p-5">
                <div className="text-xs uppercase tracking-wider opacity-80">Best one-stop shop</div>
                {bestFull ? (
                  <>
                    <div className="display text-4xl font-black mt-1">{formatPrice(bestFull.total)}</div>
                    <div className="text-sm opacity-90">{bestFull.store.retailer} · save {formatPrice(Math.max(0, bestFull.total - results.splitTotal))} more by splitting</div>
                  </>
                ) : best ? (
                  <>
                    <div className="display text-2xl font-black mt-1">{best.store.retailer}</div>
                    <div className="text-sm opacity-90">has {best.have} of {picked.length} items on flyer · {formatPrice(best.total)}</div>
                  </>
                ) : <div className="text-sm mt-2">No store has these items this week.</div>}
              </div>
            </div>

            <div className="border-2 border-ink">
              {Array.from(results.groups.entries()).map(([sid, items]) => (
                <div key={sid} className="p-4 border-b border-slate-200 last:border-0">
                  <div className="font-black">{storeById.get(sid)?.retailer} <span className="font-normal text-slate-500 text-sm">— {storeById.get(sid)?.name}</span></div>
                  <ul className="mt-2 text-sm space-y-1">
                    {items.map(i => (
                      <li key={i.slug} className="flex justify-between"><span>{bySlug.get(i.slug)?.name} <span className="text-slate-400">{bySlug.get(i.slug)?.unit}</span></span><span className="mono font-bold">{formatPrice(i.cents)}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={copyList} className="btn-primary">{copied ? 'Copied ✓' : 'Copy shopping list'}</button>
              <button onClick={() => window.print()} className="btn-secondary">Print</button>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-bold">Compare every store&apos;s total</summary>
              <table className="w-full mt-3 text-sm">
                <tbody>
                  {results.oneStop.map(o => (
                    <tr key={o.store.id} className="border-t border-slate-200">
                      <td className="py-2">{o.store.retailer}</td>
                      <td className="py-2 text-slate-500">{o.have}/{picked.length} items</td>
                      <td className="py-2 text-right mono">{formatPrice(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
