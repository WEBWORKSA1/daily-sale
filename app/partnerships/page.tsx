import { InquiryForm } from '@/components/InquiryForm';

export const metadata = { title: 'Partnerships', description: 'Partnership opportunities with daily.sale — grocery apps, meal kits, loyalty programs, financial services.' };

export default function PartnershipsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Partnerships</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Partner with daily.sale.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-2xl">
        We partner with brands that help our readers save money or shop smarter — never with grocers directly (that would compromise ranking integrity).
      </p>
      <div className="mt-10 space-y-6">
        {[
          { t: 'Grocery Savings Apps', p: 'Cashback, receipt-scan and near-expiry apps that put real money back in shoppers’ pockets.' },
          { t: 'Meal Kit Services', p: 'Featured, clearly labelled placement on our budget and meal-planning pages.' },
          { t: 'Financial Services', p: 'Cashback credit cards, budgeting apps, high-yield savings — audience is actively managing a weekly budget.' },
          { t: 'Local / City Partners', p: 'Food banks, newcomer settlement orgs, and community groups — we co-create local resources and promote your mission.' },
          { t: 'Tech / Data', p: 'Flyer platforms, price-tracking APIs, ecommerce tools — integration and co-marketing opportunities.' }
        ].map(c => (
          <div key={c.t} className="card p-6">
            <h3 className="display text-2xl font-black">{c.t}</h3>
            <p className="mt-2 text-slate-600">{c.p}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 max-w-3xl">
        <InquiryForm kind="partnership" topic="partnership" title="Propose a partnership" cta="Start the conversation →"
          fields={[
            { k: 'name', l: 'Name', required: true },
            { k: 'email', l: 'Work email', type: 'email', required: true },
            { k: 'company', l: 'Organization', required: true },
            { k: 'website', l: 'Website', type: 'url', placeholder: 'https://' },
            { k: 'purpose', l: 'Partnership type', type: 'select', required: true,
              options: ['Savings app / cashback', 'Meal kits', 'Financial services', 'Community / non-profit', 'Tech / data', 'Acquire this website / domain', 'Other'] },
            { k: 'message', l: 'What would a great partnership look like?', type: 'textarea', required: true }
          ]} />
      </div>
    </div>
  );
}
