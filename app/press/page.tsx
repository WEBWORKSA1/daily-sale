import Link from 'next/link';
import { InquiryForm } from '@/components/InquiryForm';

export const metadata = { title: 'Press & Media', description: 'Press resources, logos, and media contact for daily.sale.' };

export default function PressPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Press</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Press &amp; Media</h1>
      <p className="mt-6 text-slate-600 text-lg">
        Writing about Canadian grocery inflation, flyer culture, or the price-comparison space? We&apos;re happy to help with data, screenshots, and quotes.
      </p>
      <section className="mt-10">
        <h2 className="display text-2xl font-black mb-3">Press kit</h2>
        <ul className="space-y-2 text-sm">
          <li>→ High-res daily.sale logo (SVG, PNG)</li>
          <li>→ Platform statistics (updated monthly)</li>
          <li>→ Sample charts: price trends, flyer coverage, savings deltas</li>
        </ul>
        <div className="mt-6">
          <InquiryForm kind="press" topic="press" title="Media request" cta="Request press kit / data →"
            fields={[
              { k: 'name', l: 'Name', required: true },
              { k: 'email', l: 'Email', type: 'email', required: true },
              { k: 'org', l: 'Publication / outlet', required: true },
              { k: 'message', l: 'Story angle & deadline', type: 'textarea', required: true }
            ]} />
        </div>
      </section>
      <section className="mt-10">
        <h2 className="display text-2xl font-black mb-3">Recent mentions</h2>
        <p className="text-sm text-slate-600">We&apos;ll list coverage here as it happens. If you&apos;ve published something, <Link href="/contact" className="underline">let us know</Link> and we&apos;ll link back.</p>
      </section>
    </div>
  );
}
