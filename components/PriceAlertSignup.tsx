'use client';
import { useState } from 'react';

type Item = { slug: string; name: string; unit: string };

// High-intent lead magnet: shoppers pick the staples they buy, we email when any drops.
export function PriceAlertSignup({ items, source = 'price-alert' }: { items: Item[]; source?: string }) {
  const POPULAR = items.slice(0, 18);
  const [picked, setPicked] = useState<string[]>(POPULAR.slice(0, 4).map(i => i.slug));
  const [email, setEmail] = useState('');
  const [postal, setPostal] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  function toggle(slug: string) {
    setPicked(p => (p.includes(slug) ? p.filter(s => s !== slug) : [...p, slug].slice(0, 12)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('err'); return; }
    setStatus('sending');
    try {
      const names = POPULAR.filter(i => picked.includes(i.slug)).map(i => i.name);
      const r = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'price-alert', email, postal, interests: names, source, consent: 'yes - CASL express consent via form', website_url: hp })
      });
      if (!r.ok) throw new Error();
      setStatus('ok');
    } catch { setStatus('err'); }
  }

  if (status === 'ok') {
    return (
      <div className="bg-save text-paper p-8 border-2 border-ink">
        <div className="display text-3xl font-black">You&apos;re on the list ✓</div>
        <p className="mt-2 opacity-90">We&apos;ll email you the moment any of your {picked.length} items hits its lowest flyer price, plus the Thursday top-10. Unsubscribe anytime.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border-2 border-ink p-6 md:p-8">
      <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold">Free price-drop alerts</div>
      <h2 className="display text-3xl md:text-4xl font-black mt-2 leading-tight">Tell us what you buy. We&apos;ll tell you where it&apos;s cheapest.</h2>
      <p className="text-slate-600 mt-2">Pick up to 12 staples. When one drops to its best price in your area, you get one short email.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Items to watch">
        {POPULAR.map(i => {
          const on = picked.includes(i.slug);
          return (
            <button type="button" key={i.slug} onClick={() => toggle(i.slug)} aria-pressed={on}
              className={`px-3 py-1.5 text-sm border-2 transition ${on ? 'bg-ink text-paper border-ink' : 'border-slate-300 hover:border-ink'}`}>
              {on ? '✓ ' : '+ '}{i.name}{i.unit ? <span className="opacity-60"> {i.unit}</span> : null}
            </button>
          );
        })}
      </div>
      <input type="text" name="website_url" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <input type="email" required placeholder="you@email.com" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} className="input-primary flex-1" />
        <input type="text" placeholder="Postal code" aria-label="Postal code" maxLength={7} value={postal} onChange={e => setPostal(e.target.value.toUpperCase())} className="input-primary sm:w-36 uppercase" />
        <button disabled={status === 'sending' || picked.length === 0} className="btn-primary whitespace-nowrap">{status === 'sending' ? 'Saving…' : `Watch ${picked.length} item${picked.length === 1 ? '' : 's'} →`}</button>
      </div>
      {status === 'err' && <p className="mt-2 text-sm text-cart font-bold" role="alert">Please enter a valid email.</p>}
      <p className="mt-3 text-[11px] text-slate-500">Free forever. No spam, never sold. By subscribing you consent to receive deal emails from daily.sale (CASL). <a href="/privacy" className="underline">Privacy</a>.</p>
    </form>
  );
}
