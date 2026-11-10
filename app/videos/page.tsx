import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { InquiryForm } from '@/components/InquiryForm';

export const metadata = { title: 'Video Guides', description: 'Short video walkthroughs on saving money on groceries in Canada: price matching, unit prices, loyalty programs and weekly deal roundups.' };
export const dynamic = 'force-dynamic';

type Video = { id: string; title: string; desc?: string };

// Add videos by appending {"id": "<YouTube id>", "title": "...", "desc": "..."} to data/videos.json.
function loadVideos(): Video[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'videos.json'), 'utf8'));
    return Array.isArray(raw) ? raw.filter((v: Video) => /^[\w-]{11}$/.test(v.id)) : [];
  } catch { return []; }
}

const TOPICS = [
  { t: 'Grocery savings tips (Canada)', q: 'grocery savings tips canada' },
  { t: 'How price matching works', q: 'grocery price matching canada how to' },
  { t: 'PC Optimum points tips', q: 'pc optimum points tips' },
  { t: 'Meal prep on a budget', q: 'budget meal prep canada' },
  { t: 'Reading unit prices', q: 'how to read unit price grocery' },
  { t: 'Couponing in Canada', q: 'couponing canada beginners' }
];

export default function VideosPage() {
  const videos = loadVideos();
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Videos</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Watch, learn, save.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-2xl">Short, practical walkthroughs. Videos play in YouTube&apos;s privacy-enhanced mode — nothing loads until you press play.</p>

      {videos.length > 0 ? (
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {videos.map(v => (
            <article key={v.id} className="card overflow-hidden">
              <div className="aspect-video bg-ink relative">
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${v.id}`} title={v.title}
                  loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div className="p-5">
                <h2 className="font-bold display text-xl">{v.title}</h2>
                {v.desc && <p className="text-sm text-slate-600 mt-2">{v.desc}</p>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 bg-ink text-paper p-8">
          <div className="tag bg-accent text-ink border-accent">Coming soon</div>
          <h2 className="display text-3xl font-black mt-3">The daily.sale weekly deals video series is in production.</h2>
          <p className="mt-2 opacity-85">Every Thursday: the week&apos;s biggest price gaps in under three minutes. <Link href="/newsletter" className="underline font-bold">Get notified when episode one drops →</Link></p>
        </div>
      )}

      <section className="mt-12">
        <h2 className="display text-3xl font-black">Explore on YouTube</h2>
        <p className="text-slate-600 mt-2">Hand-picked topics from the wider Canadian savings community.</p>
        <div className="mt-5 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TOPICS.map(t => (
            <a key={t.q} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t.q)}`} target="_blank" rel="noopener" className="card p-5 lift block">
              <div className="text-xs uppercase tracking-wider text-cart font-bold">YouTube ↗</div>
              <div className="font-bold mt-1">{t.t}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-14 max-w-3xl">
        <InquiryForm kind="video-creator" topic="careers" title="Make videos with us" cta="Pitch your channel →"
          success="Thanks — we’ll be in touch about collaborating."
          fields={[
            { k: 'name', l: 'Name', required: true },
            { k: 'email', l: 'Email', type: 'email', required: true },
            { k: 'portfolio', l: 'Channel URL', type: 'url', placeholder: 'https://youtube.com/@…', required: true },
            { k: 'message', l: 'Video idea or collaboration', type: 'textarea' }
          ]} />
      </section>
    </div>
  );
}
