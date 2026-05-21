'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidPostal } from '@/lib/postal';

export default function Home() {
  const [postal, setPostal] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPostal(postal)) {
      setErr('Enter a valid postal code (e.g. L2R 7K6)');
      return;
    }
    router.push(`/p/${postal.replace(/\s+/g, '').toUpperCase()}`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-6 pb-3 rule-thick border-b border-ink">
        <div className="flex items-baseline justify-between">
          <div className="text-xs tracking-[0.2em] uppercase">Vol. I · No. 1 · Daily</div>
          <div className="text-xs tracking-[0.2em] uppercase">St. Catharines, ON · Today</div>
        </div>
      </header>

      <section className="px-6 md:px-12 py-10 md:py-20">
        <div className="max-w-5xl">
          <p className="text-xs tracking-[0.25em] uppercase mb-6">A daily price ledger</p>
          <h1 className="display text-[14vw] md:text-[8.5vw] leading-[0.9] font-black">
            What&apos;s<br/>
            <span className="italic font-normal">cheapest</span><br/>
            today?
          </h1>
          <div className="rule-double my-10 max-w-3xl"></div>

          <p className="display text-2xl md:text-3xl max-w-3xl leading-tight font-light">
            Enter your postal code. We&apos;ll tell you, for the
            <span className="italic"> 100 things you actually buy</span>,
            which store has the lowest price <span className="font-bold underline decoration-2 underline-offset-4">today</span>.
            Not last week. Not the flyer. Today.
          </p>
        </div>

        <form onSubmit={submit} className="mt-14 max-w-2xl">
          <label className="block text-xs tracking-[0.25em] uppercase mb-3">Your Postal Code</label>
          <div className="flex gap-3 items-stretch">
            <input
              type="text"
              value={postal}
              onChange={(e) => { setPostal(e.target.value); setErr(''); }}
              placeholder="L2R 7K6"
              className="tag flex-1 bg-paper border-2 border-ink px-5 py-4 text-3xl uppercase placeholder-ink/30 focus:outline-none focus:bg-ink focus:text-paper transition"
              autoComplete="postal-code"
              maxLength={7}
            />
            <button
              type="submit"
              className="bg-ink text-paper px-8 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-cart transition"
            >
              See Today&apos;s Cheapest →
            </button>
          </div>
          {err && <p className="mt-2 text-cart text-sm">{err}</p>}
          <p className="mt-3 text-xs opacity-70">Currently live in St. Catharines (L2R, L2N, L2M, L2S, L2T). More cities coming.</p>
        </form>
      </section>

      <section className="px-6 md:px-12 py-12 rule-thick border-t border-ink">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="display text-6xl font-black mb-3">01</div>
            <h3 className="display text-2xl font-bold mb-2">Direct from source</h3>
            <p className="text-sm leading-relaxed">We pull prices from each retailer&apos;s own public flyer and product pages — Walmart, No Frills, FreshCo, Sobeys, Food Basics, Zehrs, Giant Tiger. No middlemen.</p>
          </div>
          <div>
            <div className="display text-6xl font-black mb-3">02</div>
            <h3 className="display text-2xl font-bold mb-2">Verified by humans</h3>
            <p className="text-sm leading-relaxed">Real shoppers in your city snap receipts and confirm prices. Stale data dies fast.</p>
          </div>
          <div>
            <div className="display text-6xl font-black mb-3">03</div>
            <h3 className="display text-2xl font-bold mb-2">Ranked, not listed</h3>
            <p className="text-sm leading-relaxed">Other apps show you every price. We show you <span className="italic">the</span> price — the cheapest, today, and how much you save vs. the worst store.</p>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 rule-thin border-t border-ink mt-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 text-xs tracking-[0.15em] uppercase">
          <div>© CheapCart · The Daily Price Ledger</div>
          <div className="opacity-70">Not affiliated with any retailer. Prices vary; verify in store.</div>
        </div>
      </footer>
    </main>
  );
}
