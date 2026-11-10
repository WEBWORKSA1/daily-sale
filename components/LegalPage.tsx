import Link from 'next/link';

export const LEGAL_UPDATED = 'November 10, 2026';

export function LegalPage({ kicker = 'Legal', title, intro, children }: { kicker?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 legal">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">{kicker}</div>
      <h1 className="display text-4xl md:text-5xl font-black leading-tight mt-2">{title}</h1>
      <p className="mt-3 text-xs text-slate-500">Last updated: {LEGAL_UPDATED}</p>
      {intro && <p className="mt-6 text-lg text-slate-700">{intro}</p>}
      <div className="mt-8">{children}</div>
      <div className="mt-12 p-5 border-2 border-ink bg-white">
        <p className="text-sm">
          Questions about this page? Use our <Link href="/contact" className="underline font-bold">contact form</Link>. We answer within 48 business hours.
        </p>
      </div>
    </article>
  );
}
