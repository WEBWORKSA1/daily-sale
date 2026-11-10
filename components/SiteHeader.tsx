'use client';
import Link from 'next/link';
import { useState } from 'react';

const NAV = [
  { href: '/deals', label: 'Today’s Deals' },
  { href: '/basket', label: 'Cheapest Basket' },
  { href: '/flyers', label: 'Flyers' },
  { href: '/categories', label: 'Categories' },
  { href: '/guides', label: 'Guides' },
  { href: '/contests', label: 'Win $100' }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-paper border-b-2 border-ink sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-3xl md:text-4xl font-black tracking-tight">daily<span className="text-cart">.</span>sale</span>
            <span className="hidden md:inline text-[10px] tracking-[0.2em] uppercase opacity-70">Flyer Intelligence</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-5" aria-label="Main">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="text-sm font-medium hover:text-cart transition-colors">{n.label}</Link>
            ))}
            <Link href="/newsletter" className="btn-primary py-2 px-4 text-xs">Free Deal Alerts →</Link>
          </nav>
          <button onClick={() => setOpen(v => !v)} className="lg:hidden text-ink p-2" aria-label="Toggle menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {open && (
          <nav className="lg:hidden pb-4 flex flex-col gap-3 animate-slide-up" aria-label="Mobile">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="text-sm font-medium py-2 border-b border-slate-100">{n.label}</Link>
            ))}
            <Link href="/newsletter" onClick={() => setOpen(false)} className="btn-primary text-center">Free Deal Alerts →</Link>
            <Link href="/donate" onClick={() => setOpen(false)} className="text-sm font-bold text-save py-2">Support daily.sale ♥</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
