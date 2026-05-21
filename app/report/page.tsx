'use client';

import Link from 'next/link';
import { useState } from 'react';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || 'YOUR_FORMSPREE_ID';
const ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

export default function ReportPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErr('');
    const form = e.currentTarget;
    const data = new FormData(form);
    if (FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
      console.log('[CheapCart] Submission preview:', Object.fromEntries(data.entries()));
      setTimeout(() => setStatus('sent'), 600);
      return;
    }
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) { setStatus('sent'); form.reset(); }
      else {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || `Failed (${res.status})`);
        setStatus('error');
      }
    } catch (e: any) {
      setErr(e?.message || 'Network error');
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="px-6 md:px-12 pt-6 pb-3 rule-thick border-b border-ink">
        <div className="flex items-baseline justify-between">
          <Link href="/" className="text-xs tracking-[0.2em] uppercase hover:underline">← CheapCart</Link>
          <div className="text-xs tracking-[0.2em] uppercase">Verify · Submit</div>
        </div>
      </header>
      <section className="px-6 md:px-12 pt-10 pb-6 max-w-3xl">
        <p className="text-xs tracking-[0.25em] uppercase mb-4">Verified by humans</p>
        <h1 className="display text-5xl md:text-7xl font-black leading-[0.9] mb-6">
          Report<br/><span className="italic font-normal">today&apos;s</span> price.
        </h1>
        <p className="text-lg max-w-2xl">
          Saw a price in-store that doesn&apos;t match our ledger? Tell us. Every submission goes to a human (we&apos;re small — that human is the founder) and updates the ledger same day.
        </p>
      </section>
      {status === 'sent' ? (
        <section className="px-6 md:px-12 mt-10 max-w-3xl">
          <div className="bg-ink text-paper p-8 rotate-[-0.5deg] shadow-[8px_8px_0_0_#2A9D8F]">
            <div className="text-xs tracking-[0.2em] uppercase opacity-70 mb-2">Submission received</div>
            <div className="display text-3xl font-bold mb-2">Thanks for sharpening the ledger.</div>
            <div className="text-sm opacity-80">We review every report. The next daily build (06:00 ET tomorrow) will reflect verified updates.</div>
            <Link href="/" className="inline-block mt-6 underline">← Back to home</Link>
          </div>
        </section>
      ) : (
        <section className="px-6 md:px-12 mt-10 max-w-3xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <Field label="Your email" name="email" type="email" required placeholder="you@example.com" />
            <Field label="Store" name="store" required placeholder="e.g. No Frills, 285 Geneva St" />
            <Field label="Item" name="item" required placeholder="e.g. 4L 2% Milk" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price you saw" name="price" required placeholder="$5.49" />
              <Field label="Date observed" name="observed_date" type="date" required defaultValue={new Date().toISOString().slice(0,10)} />
            </div>
            <Field label="Notes (optional)" name="notes" multiline placeholder="On sale? Specific brand? Anything we should know." />
            <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="hidden" name="_subject" value="CheapCart price report" />
            <div>
              <button type="submit" disabled={status === 'sending'} className="bg-ink text-paper px-8 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-cart transition disabled:opacity-50">
                {status === 'sending' ? 'Submitting…' : 'Submit Report →'}
              </button>
              {err && <p className="mt-3 text-cart text-sm">{err}</p>}
            </div>
            <p className="text-xs opacity-70 pt-4 rule-thin">
              Submissions email straight to our founder. We don&apos;t share your email. Optional but appreciated: include a receipt photo by replying to the confirmation email.
            </p>
          </form>
        </section>
      )}
    </main>
  );
}

function Field({ label, name, type = 'text', required = false, placeholder, defaultValue, multiline = false }: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; defaultValue?: string; multiline?: boolean;
}) {
  const common = 'w-full bg-paper border-2 border-ink px-4 py-3 text-lg focus:outline-none focus:bg-ink focus:text-paper transition';
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.2em] uppercase mb-2">{label}{required && ' *'}</span>
      {multiline ? (
        <textarea name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} rows={3} className={common} />
      ) : (
        <input type={type} name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} className={common} />
      )}
    </label>
  );
}
