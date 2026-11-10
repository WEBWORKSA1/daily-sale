import Link from 'next/link';

export const metadata = { title: 'FAQ — How daily.sale Works', description: 'Answers to common questions about daily.sale: where prices come from, how often they update, accuracy, cities covered, and how the site is funded.' };

const FAQ: { q: string; a: string }[] = [
  { q: 'What is daily.sale?', a: 'A free website that reads the weekly flyers of major Canadian grocers, matches the same everyday items across stores, and shows you which store has the lowest advertised price this week.' },
  { q: 'Which stores do you compare?', a: 'In the Niagara region we currently compare No Frills, Food Basics, FreshCo, Sobeys, Walmart, Giant Tiger and Zehrs. More banners and cities are added as we expand.' },
  { q: 'How often are prices updated?', a: 'Automatically every day, plus an extra refresh on Wednesday evening when most new flyers publish. Each page shows the last update date and the flyer validity date.' },
  { q: 'Are the prices guaranteed?', a: 'No. Prices come from retailer flyers and can vary by store, change, or sell out. Always confirm in store. If you see a mistake, use Report a Price and we will fix it.' },
  { q: 'Can I use daily.sale to price match?', a: 'Many retailers price match competitors’ current flyers. Show the cashier the retailer’s own flyer (not our site) — our guides explain each store’s price-match policy.' },
  { q: 'Is daily.sale free?', a: 'Yes, completely. It is funded by clearly labelled ads, optional reader donations, sponsorships from non-grocery brands and some affiliate links. None of these can change the price rankings.' },
  { q: 'Do grocers pay to rank higher?', a: 'Never. Rankings are calculated automatically from prices alone, and we do not accept placement fees from grocers.' },
  { q: 'Is my city covered?', a: 'We launched in St. Catharines and the Niagara region. Request your city and we will email you when it launches — demand decides the order.' },
  { q: 'How do price alerts work?', a: 'Choose the staples you buy and leave your email. We send one short email when any of them hits its best price in your area, plus the Thursday top-10.' },
  { q: 'How can I support the project?', a: 'Share it with friends, report wrong prices, or contribute on our Support page. Contributions fund operations, promotion, hiring, contests and new cities.' }
];

export default function FaqPage() {
  const ld = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  };
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Help</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Frequently asked questions</h1>
      <div className="mt-10 divide-y-2 divide-ink border-y-2 border-ink">
        {FAQ.map(f => (
          <details key={f.q} className="py-5 group">
            <summary className="cursor-pointer font-bold text-lg flex justify-between gap-4 list-none">
              {f.q}<span className="text-cart group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-slate-700 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-slate-600">Still stuck? <Link href="/contact" className="underline font-bold">Ask us</Link> · <Link href="/launch-request" className="underline font-bold">Request your city</Link> · <Link href="/report" className="underline font-bold">Report a price</Link></p>
    </div>
  );
}
