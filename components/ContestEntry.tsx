'use client';
import { useState } from 'react';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'SK', 'YT'];

export function ContestEntry({ contest, prize }: { contest: string; prize: string }) {
  const [f, setF] = useState({ name: '', email: '', province: 'ON', postal: '', story: '' });
  const [adult, setAdult] = useState(false);
  const [rules, setRules] = useState(false);
  const [optin, setOptin] = useState(true);
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { setErr('Name and a valid email are required.'); setStatus('err'); return; }
    if (!adult || !rules) { setErr('Please confirm your age and accept the rules.'); setStatus('err'); return; }
    setStatus('sending');
    try {
      const r = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'contest-entry', contest, name: f.name, email: f.email, city: f.province, postal: f.postal,
          entry: f.story, consent: optin ? 'yes - newsletter opt-in' : 'no newsletter', source: 'contests-page', website_url: hp
        })
      });
      if (!r.ok) throw new Error();
      setStatus('ok');
    } catch { setErr('Something went wrong. Please try again.'); setStatus('err'); }
  }

  if (status === 'ok') {
    return (
      <div className="bg-save text-paper p-8 border-2 border-ink">
        <div className="display text-3xl font-black">You&apos;re entered ✓</div>
        <p className="mt-2 opacity-90">Good luck! We&apos;ll email the selected entrant after the draw. Share daily.sale with a friend who loves a deal.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border-2 border-ink p-6">
      <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold">Enter to win</div>
      <h2 className="display text-2xl font-black mt-1">{prize}</h2>
      <input type="text" name="website_url" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="mt-4 space-y-3">
        <input required aria-label="Full name" placeholder="Full name" className="input-primary" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input required type="email" aria-label="Email" placeholder="Email" className="input-primary" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select aria-label="Province" className="input-primary" value={f.province} onChange={e => setF({ ...f, province: e.target.value })}>
            {PROVINCES.map(p => <option key={p}>{p}</option>)}
          </select>
          <input aria-label="Postal code" placeholder="Postal code" maxLength={7} className="input-primary uppercase" value={f.postal} onChange={e => setF({ ...f, postal: e.target.value.toUpperCase() })} />
        </div>
        <textarea aria-label="Optional savings story" rows={3} placeholder="Optional: your best grocery-saving tip (for the Biggest Basket Saving feature)" className="input-primary resize-none" value={f.story} onChange={e => setF({ ...f, story: e.target.value })} />
        <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} className="mt-1" /> I am a resident of Canada (excluding Quebec) and the age of majority in my province.</label>
        <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={rules} onChange={e => setRules(e.target.checked)} className="mt-1" /> I have read and accept the official rules.</label>
        <label className="flex gap-2 text-sm items-start"><input type="checkbox" checked={optin} onChange={e => setOptin(e.target.checked)} className="mt-1" /> Also send me free weekly deal alerts (optional, unsubscribe anytime).</label>
      </div>
      <button disabled={status === 'sending'} className="btn-primary w-full mt-5">{status === 'sending' ? 'Entering…' : 'Enter the giveaway →'}</button>
      {status === 'err' && <p className="mt-2 text-sm text-cart font-bold" role="alert">{err}</p>}
      <p className="mt-3 text-[11px] text-slate-500">No purchase necessary. One entry per person. Skill-testing question required to win.</p>
    </form>
  );
}
