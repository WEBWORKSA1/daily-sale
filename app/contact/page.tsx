'use client';
import { useEffect, useState } from 'react';
import { EmailCapture } from '@/components/EmailCapture';

const INQUIRIES = [
  { k: 'sponsorship', l: 'Sponsorship' },
  { k: 'advertisement', l: 'Advertisement' },
  { k: 'partnership', l: 'Partnership' },
  { k: 'website-or-domain', l: 'Interested in this Website / Domain Name' },
  { k: 'data-licensing', l: 'Data Licensing' },
  { k: 'press', l: 'Press / Media' },
  { k: 'careers', l: 'Careers / Talent' },
  { k: 'contest', l: 'Contests & Prizes' },
  { k: 'bug-report', l: 'Bug / Wrong Price' },
  { k: 'privacy', l: 'Privacy request' },
  { k: 'copyright', l: 'Copyright / DMCA notice' },
  { k: 'accessibility', l: 'Accessibility' },
  { k: 'other', l: 'Other' }
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', org: '', inquiry_type: 'sponsorship', message: '' });
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('topic');
      if (t && INQUIRIES.some(i => i.k === t)) setForm(f => ({ ...f, inquiry_type: t }));
    } catch {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.message) { setStatus('err'); setMsg('Email and message required.'); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kind: 'contact', source: 'contact-page' })
      });
      if (!res.ok) throw new Error();
      setStatus('ok'); setMsg('Thank you — we reply within 48 hours (often faster).');
      setForm({ name:'', email:'', org:'', inquiry_type: form.inquiry_type, message: '' });
    } catch { setStatus('err'); setMsg('Something went wrong. Please try again in a moment.'); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-5 gap-10">
      <div className="md:col-span-3">
        <div className="text-xs tracking-widest uppercase text-cart font-bold">Contact</div>
        <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Let&apos;s talk.</h1>
        <p className="mt-4 text-slate-600 text-lg">
          Whether you want to sponsor daily.sale, advertise, partner on data, inquire about buying this website / domain, or report an issue — this form reaches us.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Name</label>
              <input className="input-primary" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">Email *</label>
              <input type="email" required className="input-primary" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Organization (optional)</label>
            <input className="input-primary" value={form.org} onChange={e=>setForm({...form, org: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">What&apos;s this about?</label>
            <select className="input-primary" value={form.inquiry_type} onChange={e=>setForm({...form, inquiry_type: e.target.value})}>
              {INQUIRIES.map(i => <option key={i.k} value={i.k}>{i.l}</option>)}
            </select>
          </div>
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">Message *</label>
            <textarea required className="input-primary resize-none" rows={6} value={form.message} onChange={e=>setForm({...form, message: e.target.value})} />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button disabled={status==='sending'} className="btn-primary">{status==='sending' ? 'Sending…' : 'Send →'}</button>
            <span className="text-xs text-slate-500">We never share your details. Replies come from our team inbox.</span>
          </div>
          {status==='ok' && <div className="text-sm text-save bg-save/5 p-3 border-l-4 border-save">{msg}</div>}
          {status==='err' && <div className="text-sm text-cart bg-cart/5 p-3 border-l-4 border-cart">{msg}</div>}
        </form>
      </div>

      <aside className="md:col-span-2 space-y-6">
        <div className="card p-6 bg-ink text-paper">
          <h3 className="display text-xl font-black mb-3">Why contact us?</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>→ Sponsor a city launch (your logo on local pages for 90 days)</li>
            <li>→ Advertise to a high-intent grocery audience</li>
            <li>→ License our anonymized basket/price data</li>
            <li>→ Partner on an affiliate placement (meal kits, financial services, apps)</li>
            <li>→ Acquire the daily.sale domain and website</li>
            <li>→ Report a bug or incorrect price</li>
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="display text-xl font-black mb-2">Response times</h3>
          <p className="text-sm text-slate-600">Within 48 business hours. Sponsorship and partnership inquiries jump the queue.</p>
        </div>
        <EmailCapture source="contact-sidebar" />
      </aside>
    </div>
  );
}
