import Link from 'next/link';
import { DonationWidget } from '@/components/DonationWidget';

export const metadata = {
  title: 'Support daily.sale — Donate',
  description: 'Fund daily operations, promotion, hiring, shopper contests and new-city launches for the free grocery flyer comparison site daily.sale.'
};

const USES = [
  { t: 'Operations', p: 'Servers, daily flyer processing, data storage and uptime monitoring. This is what keeps prices fresh every morning.', s: '$10 covers a week of processing for one city.' },
  { t: 'Promotions & marketing', p: 'Getting daily.sale in front of shoppers who need it most: community boards, food-bank partners, local radio.', s: '$50 reaches ~2,000 local shoppers.' },
  { t: 'Hiring talent', p: 'Part-time price researchers, a front-end developer, and writers for our savings guides.', s: '$25 funds a researcher hour.' },
  { t: 'Contests & prizes', p: 'Monthly grocery gift-card giveaways and the “Biggest Basket Saving” challenge.', s: '$100 funds one gift-card prize.' },
  { t: 'New cities', p: 'Store mapping, flyer matching and data validation for each new city we launch.', s: '$250 seeds one city launch.' }
];

export default function DonatePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="grid md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <div className="text-xs tracking-widest uppercase text-save font-bold">Support</div>
          <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Keep it free. Keep it independent.</h1>
          <p className="mt-6 text-slate-600 text-lg">
            daily.sale is free for every shopper and takes no placement money from grocers, so the rankings stay honest.
            Reader support pays for the parts ads don&apos;t cover. Pick where your money goes.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {USES.map(u => (
              <div key={u.t} className="card p-5">
                <h2 className="font-black display text-xl">{u.t}</h2>
                <p className="text-sm text-slate-600 mt-2">{u.p}</p>
                <p className="text-xs font-bold text-save mt-3">{u.s}</p>
              </div>
            ))}
            <div className="card p-5 bg-ink text-paper">
              <h2 className="font-black display text-xl">Not a donor type?</h2>
              <p className="text-sm opacity-85 mt-2">Sponsor a city, a contest prize or our weekly email instead and get your brand in front of local shoppers.</p>
              <Link href="/advertise" className="inline-block mt-3 text-sm font-bold underline">Sponsorship options →</Link>
            </div>
          </div>
          <div className="mt-10 card p-6">
            <h2 className="display text-2xl font-black">Transparency promise</h2>
            <p className="text-sm text-slate-600 mt-2">
              We publish a short quarterly note on what support paid for (servers, prizes awarded, people hired, cities launched) in our <Link href="/blog" className="underline">reports</Link>.
              Directed gifts are spent on the purpose you choose. Questions? <Link href="/contact" className="underline">Contact us</Link>.
            </p>
          </div>
        </div>
        <div className="md:col-span-2 md:sticky md:top-24 self-start"><DonationWidget /></div>
      </div>
    </div>
  );
}
