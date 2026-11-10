'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidPostal, toPostalPrefix } from '@/lib/postal';

export function PostalGate({ cta = 'See deals near me →' }: { cta?: string }) {
  const [postal, setPostal] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPostal(postal)) { setErr('Enter a valid Canadian postal code (e.g. L2R 7K6)'); return; }
    const prefix = toPostalPrefix(postal);
    if (!prefix) { setErr('Invalid postal'); return; }
    router.push(`/p/${prefix}`);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" inputMode="text" autoComplete="postal-code" maxLength={7}
          placeholder="Enter postal code"
          value={postal} onChange={e => { setPostal(e.target.value.toUpperCase()); setErr(''); }}
          className="input-primary text-lg uppercase font-medium"
        />
        <button className="btn-primary whitespace-nowrap">{cta}</button>
      </div>
      {err && <p className="text-cart text-sm mt-2">{err}</p>}
      <p className="text-xs text-slate-500 mt-3">Live now: St. Catharines &amp; Niagara (postal codes starting with L2). New cities launch by demand — <a className="underline" href="/launch-request">request yours →</a></p>
    </form>
  );
}
