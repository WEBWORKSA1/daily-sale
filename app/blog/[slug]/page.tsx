import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReport, getReportSlugs } from '@/lib/reports';
import { formatPrice } from '@/lib/format';
import { getSiteStats } from '@/lib/data';
import { AdSlot } from '@/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const r = getReport(params.slug);
  if (!r) return { title: 'Report not found' };
  return { title: r.title, description: r.description, alternates: { canonical: `/blog/${r.slug}` } };
}

export default function ReportPage({ params }: { params: { slug: string } }) {
  const r = getReport(params.slug);
  if (!r) return notFound();
  const stats = getSiteStats();
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: r.title, description: r.description,
    dateModified: stats.generatedAt, author: { '@type': 'Organization', name: 'daily.sale' },
    publisher: { '@type': 'Organization', name: 'daily.sale', logo: { '@type': 'ImageObject', url: 'https://daily.sale/icon.svg' } },
    mainEntityOfPage: `https://daily.sale/blog/${r.slug}`
  };
  const others = getReportSlugs().filter(s => s !== r.slug).slice(0, 6).map(s => getReport(s)!);

  return (
    <article className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-xs uppercase tracking-wider text-slate-500 mb-4"><Link href="/blog" className="hover:text-ink">Reports</Link> › <span className="text-ink font-bold">{r.kicker}</span></nav>
      <h1 className="display text-4xl md:text-5xl font-black leading-tight">{r.title}</h1>
      <p className="mt-3 text-xs text-slate-500">By the daily.sale data desk · auto-updated daily from retailer flyers</p>
      <p className="mt-6 text-lg text-slate-700 leading-relaxed">{r.intro}</p>
      <AdSlot slot="report-top" />
      {r.sections.map(sec => (
        <section key={sec.h} className="mt-10">
          <h2 className="display text-2xl md:text-3xl font-black">{sec.h}</h2>
          {sec.p && <p className="mt-3 text-slate-700 leading-relaxed">{sec.p}</p>}
          {sec.rows && sec.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-2 border-ink">
                <thead className="bg-ink text-paper text-left"><tr><th className="p-3">Item</th><th className="p-3">Cheapest at</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Gap</th></tr></thead>
                <tbody>
                  {sec.rows.map(i => (
                    <tr key={i.product_slug} className="border-t border-slate-200">
                      <td className="p-3"><Link href={`/item/${i.product_slug}`} className="font-bold hover:underline">{i.product_name}</Link> <span className="text-slate-400">{i.product_unit}</span></td>
                      <td className="p-3">{i.cheapest.retailer_name}</td>
                      <td className="p-3 text-right mono font-bold">{formatPrice(i.cheapest.price_cents)}</td>
                      <td className="p-3 text-right mono text-save">{i.savings_cents > 0 ? formatPrice(i.savings_cents) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sec.table && (
            <table className="w-full text-sm border-2 border-ink mt-4">
              <tbody>{sec.table.map(row => <tr key={row[1]} className="border-t border-slate-200">{row.map((c, i) => <td key={i} className={`p-3 ${i === 2 ? 'text-right font-bold' : ''}`}>{c}</td>)}</tr>)}</tbody>
            </table>
          )}
        </section>
      ))}
      <p className="mt-8 text-xs text-slate-500">Prices are taken from publicly available flyers and may vary by store. Confirm in store. See our <Link href="/editorial-policy" className="underline">methodology</Link>.</p>
      <div className="mt-10"><EmailCapture source={`report-${r.slug}`} title="Get this report every Thursday" /></div>
      <section className="mt-12">
        <h2 className="display text-2xl font-black">More reports</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {others.map(o => <li key={o.slug}><Link href={`/blog/${o.slug}`} className="card p-4 block lift text-sm font-bold">{o.title}</Link></li>)}
        </ul>
      </section>
    </article>
  );
}
