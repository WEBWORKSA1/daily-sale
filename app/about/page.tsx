import Link from 'next/link';
import { EmailCapture } from '@/components/EmailCapture';
import { getSiteStats } from '@/lib/data';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'About daily.sale', description: 'The mission, methodology and funding behind daily.sale — an independent Canadian grocery flyer comparison site.' };
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const s = getSiteStats();
  return (
    <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 legal">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">About</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">We read the flyers so you don&apos;t have to.</h1>

      <h2>Why daily.sale exists</h2>
      <p>Grocery prices for the same item can differ by dollars between stores a few minutes apart, but finding out means flipping through seven flyers every week. Each grocer&apos;s own app only shows its own prices. daily.sale puts every local flyer side by side and ranks the cheapest store for each everyday item — for free.</p>

      <h2>What we cover today</h2>
      <p>{s.retailers} grocery banners and {s.stores} stores in St. Catharines and the Niagara region, {s.products} everyday items, refreshed automatically every day. Latest refresh: {formatDate(s.generatedAt)}. We&apos;re expanding city by city — <Link href="/launch-request">request yours</Link>.</p>

      <h2>How it works</h2>
      <ul>
        <li><strong>Collect</strong> — every day an automated job reads the current digital flyers that grocers publish for each tracked store.</li>
        <li><strong>Match</strong> — each flyer item is matched to our list of 100 everyday products. Bundles, mismatched sizes and implausible prices are rejected.</li>
        <li><strong>Rank</strong> — for each item in your area we list every store&apos;s price, cheapest first, and show the gap between highest and lowest.</li>
        <li><strong>Correct</strong> — readers <Link href="/report">report wrong prices</Link>; we review every report.</li>
      </ul>
      <p>Full details: <Link href="/editorial-policy">Editorial &amp; Data Policy</Link>.</p>

      <h2>Independence</h2>
      <p>Grocers cannot pay to change a ranking, and we don&apos;t accept placement fees from them. The site is funded by clearly labelled Google ads, reader <Link href="/donate">support</Link>, sponsorships from non-grocery brands, and some affiliate links (<Link href="/affiliate-disclosure">disclosure</Link>). We never sell personal information.</p>

      <h2>Who we are</h2>
      <p>daily.sale is an independently owned Canadian website, built in Ontario by a small remote team of developers, researchers and writers. We&apos;re hiring — see <Link href="/careers">Careers</Link>.</p>

      <h2>Get in touch</h2>
      <p>Sponsorship, advertising, partnerships, data licensing, press, or a question? <Link href="/contact">Contact us</Link>.</p>
      <div className="mt-10"><EmailCapture source="about-page" /></div>
    </article>
  );
}
