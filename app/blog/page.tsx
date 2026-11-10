import Link from 'next/link';
import { getReport, getReportSlugs } from '@/lib/reports';
import { getSiteStats } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { GUIDES } from '@/lib/guides';
import { EmailCapture } from '@/components/EmailCapture';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Weekly Deal Reports & Savings Articles', description: 'Self-updating weekly grocery deal reports for St. Catharines plus in-depth savings guides.' };

export default function BlogPage() {
  const reports = getReportSlugs().map(s => getReport(s)!).filter(Boolean);
  const stats = getSiteStats();
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Reports &amp; articles</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">The weekly grocery report</h1>
      <p className="mt-4 text-slate-600 text-lg max-w-3xl">These reports rewrite themselves every day from the latest flyers. Last refreshed {formatDate(stats.generatedAt)}.</p>

      <section className="mt-10 grid md:grid-cols-2 gap-5">
        {reports.map((r, idx) => (
          <Link key={r.slug} href={`/blog/${r.slug}`} className={`card p-6 lift block ${idx === 0 ? 'md:col-span-2 bg-ink text-paper' : ''}`}>
            <div className={`text-xs uppercase tracking-wider font-bold ${idx === 0 ? 'text-accent' : 'text-cart'}`}>{r.kicker}</div>
            <h2 className={`display font-black mt-2 ${idx === 0 ? 'text-3xl md:text-4xl' : 'text-xl'}`}>{r.title}</h2>
            <p className={`mt-2 text-sm ${idx === 0 ? 'opacity-85' : 'text-slate-600'}`}>{r.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="display text-3xl font-black">Savings guides</h2>
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          {GUIDES.map(g => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card p-5 lift block">
              <div className="text-xs text-slate-500">{g.category} · {g.readTime}</div>
              <h3 className="font-black text-lg mt-1">{g.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{g.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="mt-14"><EmailCapture source="blog" title="Get the report every Thursday" /></div>
    </div>
  );
}
