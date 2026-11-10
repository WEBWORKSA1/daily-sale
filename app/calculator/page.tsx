'use client';
import { useState } from 'react';

export default function CalculatorPage() {
  const [people, setPeople] = useState(2);
  const [tier, setTier] = useState<'lean'|'mid'|'full'>('mid');
  const perPersonDaily = { lean: 8, mid: 12, full: 18 }[tier];
  const weekly = Math.round(people * perPersonDaily * 7);
  const monthly = Math.round(weekly * 4.33);
  const [rate, setRate] = useState(10);
  const savings = Math.round(monthly * rate / 100);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Calculator</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Meal Budget Calculator</h1>
      <p className="mt-6 text-slate-600 text-lg">
        Quick sanity check on your grocery budget — and what daily.sale could save you.
      </p>
      <section className="mt-10 card p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">People in household</label>
            <input type="range" min={1} max={8} value={people} onChange={e=>setPeople(Number(e.target.value))} className="w-full" />
            <div className="text-2xl font-black mono">{people}</div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">Eating tier</label>
            <div className="flex gap-2">
              {(['lean','mid','full'] as const).map(t => (
                <button key={t} onClick={()=>setTier(t)}
                  className={`px-4 py-2 border-2 font-bold text-sm ${tier===t ? 'bg-ink text-paper border-ink' : 'border-slate-300'}`}>
                  {t === 'lean' ? 'Lean ($8/person/day)' : t === 'mid' ? 'Mid ($12)' : 'Full ($18)'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-paper">
            <div className="text-xs uppercase tracking-wider text-slate-500">Weekly</div>
            <div className="display text-3xl font-black mono">${weekly}</div>
          </div>
          <div className="p-4 bg-paper">
            <div className="text-xs uppercase tracking-wider text-slate-500">Monthly</div>
            <div className="display text-3xl font-black mono">${monthly}</div>
          </div>
          <div className="p-4 bg-save text-paper">
            <div className="text-xs uppercase tracking-wider opacity-80">Potential monthly savings</div>
            <div className="display text-3xl font-black mono">${savings}</div>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" htmlFor="rate">Assumed savings from shopping the cheapest store per item: {rate}%</label>
          <input id="rate" type="range" min={0} max={30} value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full" />
        </div>
        <p className="mt-4 text-xs text-slate-500">An illustration, not a promise: your savings depend on what you buy and where. Price your real list with the <a href="/basket" className="underline">Cheapest Basket</a> tool.</p>
      </section>
    </div>
  );
}
