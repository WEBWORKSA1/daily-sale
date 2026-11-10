'use client';
import { useState } from 'react';

const PRESETS = [5, 10, 25, 50, 100, 250];
export const DONATION_PURPOSES = [
  { k: 'where-needed', l: 'Where it’s needed most' },
  { k: 'operations', l: 'Daily operations & servers' },
  { k: 'promotions', l: 'Promotions & marketing' },
  { k: 'hiring', l: 'Hiring talent (researchers, devs, writers)' },
  { k: 'contests', l: 'Contests & prizes for shoppers' },
  { k: 'expansion', l: 'Launching new cities' }
];

// Optional instant-payment links (Stripe Payment Link, PayPal.me, Buy Me a Coffee…).
const PAY_URL = process.env.NEXT_PUBLIC_DONATE_URL || '';
const PAY_URL_MONTHLY = process.env.NEXT_PUBLIC_DONATE_MONTHLY_URL || '';

export function DonationWidget({ compact = false, defaultPurpose = 'where-needed' }: { compact?: boolean; defaultPurpose?: string }) {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState<string>('');
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [purpose, setPurpose] = useState(defaultPurpose);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const finalAmount = custom ? parseFloat(custom) : amount;
  const payLink = frequency === 'monthly' && PAY_URL_MONTHLY ? PAY_URL_MONTHLY : PAY_URL;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAmount || finalAmount < 1) { setStatus('err'); setMsg('Minimum donation is $1.'); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'donation', amount: finalAmount, frequency, purpose, name, email, note, source: compact ? 'donation-compact' : 'donation-widget' })
      });
      if (!res.ok) throw new Error('bad');
      setStatus('ok');
      if (payLink) {
        setMsg('Thank you! Opening our secure payment page…');
        window.open(payLink, '_blank', 'noopener');
      } else {
        setMsg('Thank you! Your pledge is recorded — we’ll email you a secure payment link (card, PayPal or Interac) shortly.');
      }
    } catch { setStatus('err'); setMsg('Submission failed. Please try again.'); }
  }

  return (
    <div className="bg-paper border-2 border-ink p-6 md:p-8">
      <div className="text-xs tracking-[0.2em] uppercase text-save font-bold mb-3">Support free, independent flyer data</div>
      <h3 className="display text-2xl md:text-3xl font-black mb-2">Keep daily.sale free &amp; growing</h3>
      <p className="text-sm text-slate-600 mb-6">
        No paywall, no grocer placement fees, no selling your data. Supporters fund daily operations, promotion, hiring, shopper contests and new cities.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2" role="radiogroup" aria-label="Frequency">
          {(['one-time', 'monthly'] as const).map(f => (
            <button key={f} type="button" role="radio" aria-checked={frequency === f} onClick={() => setFrequency(f)}
              className={`flex-1 py-2 border-2 text-sm font-bold ${frequency === f ? 'bg-ink text-paper border-ink' : 'border-slate-300 hover:border-ink'}`}>
              {f === 'one-time' ? 'One-time' : 'Monthly'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2">Amount (CAD)</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p} type="button" onClick={() => { setAmount(p); setCustom(''); }}
                className={`px-4 py-2 border-2 font-bold text-sm transition ${amount === p && !custom ? 'bg-ink text-paper border-ink' : 'border-slate-300 hover:border-ink'}`}>
                ${p}
              </button>
            ))}
            <input type="number" min="1" step="1" placeholder="Other" aria-label="Custom amount" value={custom}
              onChange={e => setCustom(e.target.value)} className="input-primary w-24 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" htmlFor="don-purpose">Direct my support to</label>
          <select id="don-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} className="input-primary">
            {DONATION_PURPOSES.map(p => <option key={p.k} value={p.k}>{p.l}</option>)}
          </select>
        </div>
        <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
          {!compact && <input type="text" placeholder="Name (optional)" aria-label="Name" value={name} onChange={e => setName(e.target.value)} className="input-primary" />}
          <input type="email" placeholder="Email for receipt" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-primary" />
        </div>
        {!compact && (
          <textarea placeholder="Note (optional) — shout-out, dedication, or idea" aria-label="Note"
            value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-primary resize-none" />
        )}
        <button type="submit" disabled={status === 'sending'} className="btn-primary bg-save hover:bg-ink w-full">
          {status === 'sending' ? 'Submitting…' : `Give $${finalAmount || 0}${frequency === 'monthly' ? '/month' : ''} →`}
        </button>
        <p className="text-[11px] text-slate-500">
          Secure checkout by card, PayPal or Interac. daily.sale is not a registered charity, so contributions are not tax-deductible. Supporters can opt in to be thanked on our supporters wall.
        </p>
        {status === 'ok' && <div className="text-sm text-save bg-save/5 p-3 border-l-4 border-save">{msg}</div>}
        {status === 'err' && <div className="text-sm text-cart bg-cart/5 p-3 border-l-4 border-cart">{msg}</div>}
      </form>
    </div>
  );
}
