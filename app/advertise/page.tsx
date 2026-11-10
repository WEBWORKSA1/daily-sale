import { InquiryForm } from '@/components/InquiryForm';
import { getSiteStats } from '@/lib/data';

export const metadata = {
  title: 'Advertise & Sponsor',
  description: 'Reach Canadian grocery shoppers at the moment they plan their spend: sponsorships, newsletter placements, contest sponsorships, city launches and data licensing.'
};
export const dynamic = 'force-dynamic';

const PACKAGES = [
  { t: 'Site Sponsor', p: 'Your brand as presenting sponsor on every page header and the weekly deal report for a month.', tag: 'Most visible' },
  { t: 'Newsletter Sponsorship', p: 'Top slot in the Thursday deal-alert email sent to every subscriber. One sponsor per issue.', tag: 'High intent' },
  { t: 'Contest Sponsor', p: 'Fund a grocery gift-card prize; we run the contest, rules and promotion with your brand on every entry page.', tag: 'Lead gen' },
  { t: 'City Launch Sponsor', p: 'Logo and featured-partner panel on every local page of a new city for 90 days.', tag: 'Local' },
  { t: 'Sponsored Guide', p: 'A clearly labelled, genuinely useful savings guide featuring your product or service.', tag: 'Evergreen' },
  { t: 'Data Licensing', p: 'Daily cross-store flyer price feeds and price-gap indices by item and region, via CSV or API.', tag: 'B2B' }
];

export default function AdvertisePage() {
  const s = getSiteStats();
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Advertise · Sponsor · Partner</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Meet shoppers while they plan the week&apos;s grocery spend.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-3xl">
        People visit daily.sale right before they shop, to decide where to buy. Grocers can&apos;t buy placement in our rankings, but non-grocery brands (financial services, meal kits, kitchen and household brands, apps, local services) can sponsor the experience around them.
      </p>

      <section className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { n: String(s.retailers), l: 'Grocery banners tracked' },
          { n: String(s.products), l: 'Everyday items compared' },
          { n: 'Daily', l: 'Automatic price refresh' },
          { n: 'ON, CA', l: 'Launch market: Niagara' }
        ].map(x => (
          <div key={x.l} className="card p-4">
            <div className="display text-3xl font-black text-cart">{x.n}</div>
            <div className="text-xs text-slate-600 mt-1">{x.l}</div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid md:grid-cols-3 gap-4">
        {PACKAGES.map(c => (
          <div key={c.t} className="card p-5">
            <div className="tag">{c.tag}</div>
            <h2 className="font-bold display text-xl mt-2">{c.t}</h2>
            <p className="text-sm text-slate-600 mt-2">{c.p}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-2">
          <h2 className="display text-3xl md:text-4xl font-black">Request rates &amp; the media kit</h2>
          <p className="mt-3 text-slate-600">Tell us your goal and budget range. We reply within one business day with placements, dates and current traffic figures.</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>✓ All sponsored placements are labelled “Sponsored”.</li>
            <li>✓ Price rankings are never for sale.</li>
            <li>✓ Founding-sponsor rates for early partners.</li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <InquiryForm kind="advertising" topic="advertisement" title="Get a proposal" cta="Request proposal →"
            fields={[
              { k: 'name', l: 'Name', required: true },
              { k: 'email', l: 'Work email', type: 'email', required: true },
              { k: 'company', l: 'Company', required: true },
              { k: 'website', l: 'Website', type: 'url', placeholder: 'https://' },
              { k: 'purpose', l: 'Interested in', type: 'select', options: PACKAGES.map(p => p.t).concat(['Buying this website / domain', 'Other']), required: true },
              { k: 'budget', l: 'Monthly budget (CAD)', type: 'select', options: ['Under $500', '$500–$2,000', '$2,000–$10,000', '$10,000+', 'Not sure yet'] },
              { k: 'message', l: 'Goals, timing, anything else', type: 'textarea' }
            ]} />
        </div>
      </section>
    </div>
  );
}
