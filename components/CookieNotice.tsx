'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const KEY = 'ds_cookie_ack_v1';

export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { setShow(true); }
  }, []);
  if (!show) return null;
  function ack() {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch {}
    setShow(false);
  }
  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-50 bg-ink text-paper border-t-4 border-cart">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between text-xs md:text-sm">
        <p className="opacity-90">
          We use cookies, including Google AdSense advertising cookies, to keep daily.sale free and to measure traffic.
          See our <Link href="/privacy" className="underline">Privacy Policy</Link> and <Link href="/cookies" className="underline">Cookie Policy</Link>.
          You can opt out of personalised ads at <a href="https://adssettings.google.com" target="_blank" rel="noopener" className="underline">Google Ad Settings</a>.
        </p>
        <button onClick={ack} className="shrink-0 bg-cart text-paper font-bold px-4 py-2 hover:bg-save transition-colors">Got it</button>
      </div>
    </div>
  );
}
