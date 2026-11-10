import Link from 'next/link';

const COLS: { h: string; links: [string, string][] }[] = [
  { h: 'Deals', links: [['/deals', 'Today’s Deals'], ['/basket', 'Cheapest Basket'], ['/flyers', 'All Flyers'], ['/stores', 'Stores'], ['/categories', 'Categories'], ['/blog', 'Weekly Deal Reports']] },
  { h: 'Save more', links: [['/guides', 'Savings Guides'], ['/videos', 'Video Guides'], ['/calculator', 'Budget Calculator'], ['/coupons', 'Coupon Directory'], ['/report', 'Report a Price'], ['/faq', 'FAQ']] },
  { h: 'Community', links: [['/newsletter', 'Deal Alerts'], ['/contests', 'Contests & Prizes'], ['/donate', 'Support Us'], ['/launch-request', 'Request Your City'], ['/careers', 'Careers & Talent']] },
  { h: 'Business', links: [['/advertise', 'Advertise'], ['/partnerships', 'Partnerships'], ['/press', 'Press'], ['/about', 'About'], ['/contact', 'Contact']] }
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-paper mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-6 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="display text-3xl font-black">daily<span className="text-cart">.</span>sale<sup className="text-xs align-super">™</sup></Link>
            <p className="mt-4 text-sm opacity-80 max-w-sm">
              The free, independent flyer comparison engine. We read local grocers&apos; flyers every day and rank the cheapest store for each item.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/newsletter" className="btn-secondary text-paper border-paper hover:bg-paper hover:text-ink py-2 px-4 text-xs">Free Deal Alerts</Link>
              <Link href="/donate" className="btn-primary bg-cart hover:bg-save py-2 px-4 text-xs">Support Us</Link>
            </div>
          </div>
          {COLS.map(c => (
            <div key={c.h}>
              <h4 className="font-bold text-sm mb-3 tracking-wider uppercase">{c.h}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                {c.links.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-cart">{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-paper/20 flex flex-col md:flex-row justify-between gap-4 text-xs opacity-80">
          <div>
            © {year} daily.sale™. All rights reserved. “daily.sale”, the daily.sale wordmark and logo are trademarks of daily.sale.
            Site design, text, rankings, guides and compilation are protected by copyright.
          </div>
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/legal">Trademark &amp; Copyright</Link>
            <Link href="/dmca">DMCA</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
            <Link href="/editorial-policy">Editorial Policy</Link>
          </nav>
        </div>
        <p className="mt-4 text-[11px] opacity-60 text-center max-w-4xl mx-auto">
          daily.sale is not affiliated with, endorsed by, or sponsored by any retailer listed. Retailer names, logos and product names are trademarks of their respective owners and are used for identification only.
          Prices come from publicly available weekly flyers and may change; always confirm in store before you buy.
        </p>
      </div>
    </footer>
  );
}
