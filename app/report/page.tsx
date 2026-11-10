'use client';
import { useState } from 'react';

export default function ReportPage() {
  const [form, setForm] = useState({ product: '', store: '', price: '', postal: '', email: '', note: '' });
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product || !form.store || !form.price) { setStatus('err'); setMsg('Product, store, and price are required.'); return; }
    setStatus('sending');
    try {
      const r = await fetch('/api/lead', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({...form, kind:'price-report', source:'report-page'}) });
      if (!r.ok) throw new Error();
      setStatus('ok'); setMsg('Thank you — we review every report within 24 hours.');
      setForm({ product:'', store:'', price:'', postal: form.postal, email: form.email, note: '' });
    } catch { setStatus('err'); setMsg('Something went wrong. Try again.'); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Report a price</div>
      <h1 className="display text-5xl font-black leading-tight mt-2">Spotted a different price?</h1>
      <p className="mt-4 text-slate-600 text-lg">
        Flyer data is imperfect. If you saw a price in-store that doesn&apos;t match what we show, tell us. Every report sharpens the data for everyone.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1">Product *</label>
          <input required className="input-primary" value={form.product} onChange={e=>setForm({...form, product: e.target.value})} placeholder="e.g. Milk 2% 4L" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Store *</label>
            <input required className="input-primary" value={form.store} onChange={e=>setForm({...form, store: e.target.value})} placeholder="e.g. FreshCo Scott & Vine" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Price *</label>
            <input required className="input-primary" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} placeholder="e.g. $4.99" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Postal</label>
            <input className="input-primary" maxLength={7} value={form.postal} onChange={e=>setForm({...form, postal: e.target.value.toUpperCase()})} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1">Your email (optional)</label>
          <input type="email" className="input-primary" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="So we can thank you" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1">Notes</label>
          <textarea rows={3} className="input-primary resize-none" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} placeholder="Date you saw it, aisle, any detail" />
        </div>
        <button disabled={status==='sending'} className="btn-primary">{status==='sending'?'Sending…':'Submit Report →'}</button>
        {status==='ok' && <div className="text-sm text-save bg-save/5 p-3 border-l-4 border-save">{msg}</div>}
        {status==='err' && <div className="text-sm text-cart bg-cart/5 p-3 border-l-4 border-cart">{msg}</div>}
      </form>
    </div>
  );
}
