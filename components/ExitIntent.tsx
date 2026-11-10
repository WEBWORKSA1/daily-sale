'use client';
import { useEffect, useState } from 'react';

const KEY = 'ds_exit_seen_v1';

// One gentle, dismissible offer per session: desktop exit-intent, or after 40s on mobile.
export function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem(KEY); } catch {}
    if (seen) return;
    const show = () => {
      try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, '1'); } catch {}
      setOpen(true);
    };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    document.addEventListener('mouseout', onLeave);
    const t = window.setTimeout(() => { if (window.matchMedia('(max-width: 768px)').matches) show(); }, 40000);
    return () => { document.removeEventListener('mouseout', onLeave); window.clearTimeout(t); };
  }, []);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    try {
      await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'newsletter', email, source: 'exit-intent', consent: 'yes - CASL express consent via form' }) });
    } catch {}
    setDone(true);
    window.setTimeout(() => setOpen(false), 2200);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="exit-title"
      onClick={() => setOpen(false)}>
      <div className="bg-paper border-4 border-ink max-w-md w-full p-6 md:p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-2 right-3 text-2xl leading-none">×</button>
        {done ? (
          <div className="text-center py-6">
            <div className="display text-3xl font-black text-save">You&apos;re in ✓</div>
            <p className="mt-2 text-slate-600">First alert arrives Thursday morning.</p>
          </div>
        ) : (
          <>
            <div className="text-xs tracking-[0.2em] uppercase text-cart font-bold">Before you go</div>
            <h2 id="exit-title" className="display text-3xl font-black mt-2 leading-tight">Get this week&apos;s 10 biggest grocery savings — free.</h2>
            <p className="mt-2 text-slate-600 text-sm">One short email every Thursday with the biggest price gaps between stores in your area.</p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
              <input type="email" required placeholder="you@email.com" aria-label="Email" value={email} onChange={e => setEmail(e.target.value)} className="input-primary" />
              <button className="btn-primary">Send me the deals →</button>
            </form>
            <p className="mt-3 text-[11px] text-slate-500">No spam. Unsubscribe in one click. <a href="/privacy" className="underline">Privacy</a>.</p>
          </>
        )}
      </div>
    </div>
  );
}
