'use client';
import { useState } from 'react';

export default function LaunchRequestPage() {
  const [form, setForm] = useState({ city: '', email: '', postal: '', note: '' });
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');
  const [msg, setMsg] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.city || !form.email) { setStatus('err'); setMsg('City and email required.'); return; }
    setStatus('sending');
    try {
      const r = await fetch('/api/lead', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, kind:'launch-request', source:'launch-request' }) });
      if (!r.ok) throw new Error();
      setStatus('ok'); setMsg(`Thanks — we’ve added ${form.city} to the launch queue. We’ll email you when it’s live.`);
    } catch { setStatus('err'); setMsg('Something went wrong. Try again.'); }
  }
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Launch request</div>
      <h1 className="display text-5xl font-black leading-tight mt-2">Want daily.sale in your city?</h1>
      <p className="mt-4 text-slate-600 text-lg">
        We prioritize launches by demand. Tell us where you shop and we&apos;ll email you the day it goes live.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">City *</label>
            <input required className="input-primary" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} placeholder="e.g. Hamilton, ON" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Postal</label>
            <input className="input-primary" maxLength={7} value={form.postal} onChange={e=>setForm({...form, postal: e.target.value.toUpperCase()})} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1">Email *</label>
          <input type="email" required className="input-primary" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1">What grocers do you shop at?</label>
          <textarea rows={3} className="input-primary resize-none" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} placeholder="List the 3-5 stores you shop at most" />
        </div>
        <button disabled={status==='sending'} className="btn-primary">{status==='sending'?'Sending…':'Request Launch →'}</button>
        {status==='ok' && <div className="text-sm text-save bg-save/5 p-3 border-l-4 border-save">{msg}</div>}
        {status==='err' && <div className="text-sm text-cart bg-cart/5 p-3 border-l-4 border-cart">{msg}</div>}
      </form>
    </div>
  );
}
