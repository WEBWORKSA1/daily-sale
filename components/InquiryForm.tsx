'use client';
import { useState } from 'react';

type Field = { k: string; l: string; type?: 'text' | 'email' | 'url' | 'select' | 'textarea'; options?: string[]; required?: boolean; placeholder?: string };

const DEFAULT_FIELDS: Field[] = [
  { k: 'name', l: 'Your name', required: true },
  { k: 'email', l: 'Work email', type: 'email', required: true },
  { k: 'org', l: 'Company / organization' },
  { k: 'message', l: 'What do you have in mind?', type: 'textarea', required: true }
];

export function InquiryForm({
  kind, topic, title = 'Start the conversation', cta = 'Send inquiry →', fields = DEFAULT_FIELDS,
  success = 'Received — we reply within 1 business day.', dark = false
}: { kind: string; topic?: string; title?: string; cta?: string; fields?: Field[]; success?: string; dark?: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [hp, setHp] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) if (f.required && !values[f.k]) { setStatus('err'); return; }
    setStatus('sending');
    try {
      const r = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, kind, inquiry_type: topic || kind, source: `${kind}-page`, website_url: hp })
      });
      if (!r.ok) throw new Error();
      setStatus('ok'); setValues({});
    } catch { setStatus('err'); }
  }

  const inputCls = 'input-primary';
  return (
    <form onSubmit={submit} className={`p-6 md:p-8 border-2 ${dark ? 'bg-ink text-paper border-ink' : 'bg-white border-ink'}`}>
      <h2 className="display text-2xl md:text-3xl font-black mb-5">{title}</h2>
      <input type="text" name="website_url" value={hp} onChange={e => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(f => {
          const id = `${kind}-${f.k}`;
          const wide = f.type === 'textarea' || f.type === 'select';
          return (
            <div key={f.k} className={wide ? 'sm:col-span-2' : ''}>
              <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider mb-1">{f.l}{f.required ? ' *' : ''}</label>
              {f.type === 'textarea' ? (
                <textarea id={id} rows={4} required={f.required} placeholder={f.placeholder} className={`${inputCls} resize-none text-ink`}
                  value={values[f.k] || ''} onChange={e => setValues({ ...values, [f.k]: e.target.value })} />
              ) : f.type === 'select' ? (
                <select id={id} required={f.required} className={`${inputCls} text-ink`} value={values[f.k] || ''} onChange={e => setValues({ ...values, [f.k]: e.target.value })}>
                  <option value="">Select…</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input id={id} type={f.type || 'text'} required={f.required} placeholder={f.placeholder} className={`${inputCls} text-ink`}
                  value={values[f.k] || ''} onChange={e => setValues({ ...values, [f.k]: e.target.value })} />
              )}
            </div>
          );
        })}
      </div>
      <button disabled={status === 'sending'} className="btn-primary mt-5 w-full sm:w-auto">{status === 'sending' ? 'Sending…' : cta}</button>
      {status === 'ok' && <p className="mt-3 text-sm font-bold text-save" role="status">✓ {success}</p>}
      {status === 'err' && <p className="mt-3 text-sm font-bold text-cart" role="alert">Please fill in the required fields and try again.</p>}
      <p className={`mt-3 text-[11px] ${dark ? 'opacity-70' : 'text-slate-500'}`}>We use your details only to reply. See our <a href="/privacy" className="underline">privacy policy</a>.</p>
    </form>
  );
}
