import { InquiryForm } from '@/components/InquiryForm';

export const metadata = { title: 'Careers & Talent', description: 'Join daily.sale — part-time price researchers, developers, writers, community and video creators. Remote, Canada-wide.' };

const ROLES = [
  { t: 'City Price Researcher', loc: 'Remote · Canada', type: 'Part-time contract', d: 'Spot-check daily prices against flyers and shelves, fix mismatches, and help launch your city. ~5 hrs/week. Grocery-savvy shoppers welcome.' },
  { t: 'Python / Data Engineer', loc: 'Remote', type: 'Freelance project', d: 'Extend flyer matching and add new grocers and regions. Python, HTTP, parsing, data quality.' },
  { t: 'Next.js Front-end Developer', loc: 'Remote', type: 'Freelance project', d: 'Ship features like price history, basket sharing and accessibility improvements.' },
  { t: 'Savings Guide Writer', loc: 'Remote', type: 'Per article', d: 'Original, well-researched Canadian grocery-savings guides with real price data.' },
  { t: 'Video Creator (YouTube / Shorts)', loc: 'Remote', type: 'Per video', d: 'Weekly “best deals this week” videos and how-to explainers.' },
  { t: 'Community & Growth Marketer', loc: 'Remote', type: 'Part-time', d: 'Grow local audiences through community groups, partnerships and contests.' }
];

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Careers &amp; talent</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Help Canadians spend less on groceries.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-3xl">
        We&apos;re a lean, remote team expanding daily.sale city by city. Roles are part-time or freelance to start, with room to grow as we do. Apply below — one form, any role.
      </p>

      <div className="mt-10 grid md:grid-cols-2 gap-5">
        {ROLES.map(r => (
          <div key={r.t} className="card p-6">
            <h2 className="display text-2xl font-black">{r.t}</h2>
            <div className="text-xs text-slate-500 mt-1">{r.loc} · {r.type}</div>
            <p className="mt-3 text-slate-600 text-sm">{r.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-3xl" id="apply">
        <InquiryForm kind="careers" topic="careers" title="Apply or introduce yourself" cta="Send application →"
          success="Application received — we review every one and reply within a week."
          fields={[
            { k: 'name', l: 'Full name', required: true },
            { k: 'email', l: 'Email', type: 'email', required: true },
            { k: 'role', l: 'Role', type: 'select', options: ROLES.map(r => r.t).concat(['Something else']), required: true },
            { k: 'city', l: 'City / province' },
            { k: 'portfolio', l: 'LinkedIn, portfolio or GitHub', type: 'url', placeholder: 'https://' },
            { k: 'message', l: 'Why you, in a few lines', type: 'textarea', required: true }
          ]} />
      </div>
    </div>
  );
}
