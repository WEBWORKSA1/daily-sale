import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, getGuide } from '@/lib/guides';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) return { title: 'Guide not found' };
  return { title: g.title, description: g.excerpt, alternates: { canonical: `/guides/${g.slug}` } };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) return notFound();
  const more = GUIDES.filter(x => x.slug !== g.slug).slice(0, 4);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.excerpt,
    author: { '@type': 'Organization', name: 'daily.sale' }, publisher: { '@type': 'Organization', name: 'daily.sale' },
    mainEntityOfPage: `https://daily.sale/guides/${g.slug}`
  };
  return (
    <article className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-xs uppercase tracking-wider text-slate-500 mb-4" aria-label="Breadcrumb">
        <Link href="/guides" className="hover:text-ink">Guides</Link> › <span className="text-ink font-bold">{g.category}</span>
      </nav>
      <div className="text-xs tracking-widest uppercase text-cart font-bold">{g.category} · {g.readTime} read · Updated {g.updated}</div>
      <h1 className="display text-4xl md:text-5xl font-black leading-tight mt-2">{g.title}</h1>
      <p className="mt-4 text-lg text-slate-600">{g.excerpt}</p>

      <AdSlot slot="guide-top" />

      <div className="legal mt-8 text-lg [&_a]:text-cart" dangerouslySetInnerHTML={{ __html: g.body }} />

      <p className="mt-8 text-xs text-slate-500">General information only. Store policies and prices change — confirm with the retailer. See our <Link href="/editorial-policy" className="underline">editorial policy</Link>.</p>

      <AdSlot slot="guide-bottom" />

      <div className="mt-12"><EmailCapture source={`guide-${g.slug}`} cta="Get the next guide" /></div>

      <section className="mt-12">
        <h2 className="display text-2xl font-black">Keep reading</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {more.map(m => <li key={m.slug}><Link href={`/guides/${m.slug}`} className="card p-4 block lift"><div className="text-xs text-slate-500">{m.category}</div><div className="font-bold">{m.title}</div></Link></li>)}
        </ul>
      </section>
    </article>
  );
}
