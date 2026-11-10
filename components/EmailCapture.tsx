'use client';
import { useState } from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  cta?: string;
  source?: string;
  inline?: boolean;
};

// Lead capture — posts to /api/lead, which delivers server-side. No inbox
// address is ever rendered to the browser.
export function EmailCapture({
  title = 'Weekly deal alerts in your inbox',
  subtitle = 'Every Thursday morning: the 10 biggest savings across every flyer in your city.',
  cta = 'Get the alerts',
  source = 'generic',
  inline = false
}: Props) {
  const [email, setEmail] = useState('');
  const [postal, setPostal] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('err'); setMsg('Please enter a valid email.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, postal, source, kind: 'newsletter', consent: 'yes - CASL express consent via form' })
      });
      if (!res.ok) throw new Error('bad');
      setStatus('ok'); setMsg('Subscribed. Watch your inbox Thursday morning.');
      setEmail(''); setPostal('');
    } catch {
      setStatus('err'); setMsg('Something went wrong. Please try again.');
    }
  }

  if (inline) {
    return (
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full max-w-xl">
        <input type="email" required placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input-primary flex-1" />
        <button disabled={status === 'sending'} className="btn-primary whitespace-nowrap">{status === 'sending' ? 'Sending…' : cta}</button>
        {status === 'ok' && <span className="sr-only">{msg}</span>}
        {status !== 'idle' && status !== 'sending' && <div className={`text-sm mt-2 w-full ${status === 'ok' ? 'text-save' : 'text-cart'}`}>{msg}</div>}
      </form>
    );
  }

  return (
    <div className="bg-ink text-paper p-6 md:p-10 rounded-sm">
      <div className="max-w-2xl">
        <div className="text-xs tracking-[0.2em] uppercase opacity-70 mb-3">Free · every Thursday</div>
        <h3 className="display text-3xl md:text-4xl font-black leading-tight mb-3">{title}</h3>
        <p className="opacity-80 mb-6">{subtitle}</p>
        <form onSubmit={submit} className="flex flex-wrap gap-3">
          <input
            type="email" required placeholder="you@email.com"
            value={email} onChange={e => setEmail(e.target.value)}
            className="bg-paper text-ink border-2 border-paper px-4 py-3 flex-[2_1_14rem] min-w-0 focus:outline-none focus:border-accent"
          />
          <input
            type="text" placeholder="Postal"
            value={postal} onChange={e => setPostal(e.target.value.toUpperCase())}
            maxLength={7}
            className="bg-paper text-ink border-2 border-paper px-4 py-3 flex-[1_1_7rem] min-w-0 focus:outline-none focus:border-accent uppercase"
          />
          <button disabled={status === 'sending'} className="bg-cart text-paper px-6 py-3 font-bold uppercase text-sm tracking-widest hover:bg-accent transition-colors disabled:opacity-50 flex-[1_1_10rem]">
            {status === 'sending' ? 'Sending…' : cta}
          </button>
        </form>
        <p className="mt-3 text-xs opacity-60">No spam, no selling your data. Unsubscribe anytime. By subscribing you agree to our <a href="/privacy" className="underline">privacy policy</a>.</p>
        {status === 'ok' && <div className="mt-4 text-sm text-save bg-paper p-3 rounded-sm text-ink font-medium">✓ {msg}</div>}
        {status === 'err' && <div className="mt-4 text-sm text-paper bg-cart p-3 rounded-sm">{msg}</div>}
      </div>
    </div>
  );
}
