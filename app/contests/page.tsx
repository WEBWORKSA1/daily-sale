import Link from 'next/link';
import { ContestEntry } from '@/components/ContestEntry';

export const metadata = {
  title: 'Contests & Prizes — Win Free Groceries',
  description: 'Enter the daily.sale monthly grocery gift card giveaway and the Biggest Basket Saving challenge. Free to enter, no purchase necessary. Open to residents of Canada.'
};

// Edit these to run the next contest. Dates are inclusive, Eastern Time.
const CONTEST = {
  slug: 'grocery-gift-card-dec-2026',
  name: 'Holiday Grocery Gift Card Giveaway',
  prize: 'One (1) $100 CAD grocery gift card, redeemable at a participating Canadian grocer of the winner’s choice',
  prizeShort: '$100 grocery gift card',
  opens: 'November 10, 2026 at 12:00 a.m. ET',
  closes: 'December 15, 2026 at 11:59 p.m. ET',
  draw: 'December 16, 2026'
};

export default function ContestsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="text-xs tracking-widest uppercase text-cart font-bold">Contests &amp; prizes</div>
      <h1 className="display text-5xl md:text-6xl font-black leading-tight mt-2">Win your groceries.</h1>
      <p className="mt-6 text-slate-600 text-lg max-w-3xl">Free to enter. No purchase necessary. Open to residents of Canada (excluding Quebec) who are the age of majority in their province.</p>

      <div className="mt-10 grid md:grid-cols-5 gap-8 items-start">
        <section className="md:col-span-3 space-y-6">
          <div className="bg-ink text-paper p-6 md:p-8">
            <div className="tag bg-cart text-paper border-cart">Now open</div>
            <h2 className="display text-3xl md:text-4xl font-black mt-3">{CONTEST.name}</h2>
            <p className="mt-3 text-lg"><strong className="text-accent">Prize:</strong> {CONTEST.prize}.</p>
            <dl className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
              <div><dt className="opacity-70 text-xs uppercase tracking-wider">Opens</dt><dd className="font-bold">{CONTEST.opens}</dd></div>
              <div><dt className="opacity-70 text-xs uppercase tracking-wider">Closes</dt><dd className="font-bold">{CONTEST.closes}</dd></div>
              <div><dt className="opacity-70 text-xs uppercase tracking-wider">Random draw</dt><dd className="font-bold">{CONTEST.draw}</dd></div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="display text-2xl font-black">Bonus: Biggest Basket Saving challenge</h2>
            <p className="text-slate-600 mt-2 text-sm">Use our <Link href="/basket" className="underline">Cheapest Basket</Link> tool, shop your list, and tell us how much you saved versus your usual store. The most useful, well-explained savings story each month is featured on the site (with your permission) and its author gets a bonus entry.</p>
          </div>

          <div className="card p-6">
            <h2 className="display text-2xl font-black">Want to sponsor a prize?</h2>
            <p className="text-slate-600 mt-2 text-sm">Brands can fund prizes and get featured on every entry page and in our Thursday email. <Link href="/advertise" className="underline font-bold">See sponsorship options →</Link></p>
          </div>

          <details className="card p-6" open>
            <summary className="display text-2xl font-black cursor-pointer">Official rules (summary)</summary>
            <ol className="mt-4 list-decimal pl-5 space-y-2 text-sm text-slate-700">
              <li><strong>Sponsor:</strong> daily.sale.</li>
              <li><strong>Eligibility:</strong> open to legal residents of Canada (excluding Quebec) who are at or above the age of majority in their province or territory of residence at the time of entry. Employees and contractors of the sponsor and their households are not eligible.</li>
              <li><strong>Contest period:</strong> {CONTEST.opens} to {CONTEST.closes}.</li>
              <li><strong>How to enter:</strong> complete the entry form on this page. <strong>No purchase necessary.</strong> Limit one (1) entry per person and per email address. Subscribing to our newsletter is optional and does not affect your chances.</li>
              <li><strong>Prize:</strong> {CONTEST.prize}. Approximate retail value $100 CAD. The prize must be accepted as awarded, with no cash substitute except at the sponsor’s discretion.</li>
              <li><strong>Draw:</strong> one eligible entry will be selected by random draw on {CONTEST.draw}. Odds of winning depend on the number of eligible entries received.</li>
              <li><strong>Skill-testing question:</strong> before being declared a winner, the selected entrant must correctly answer, unaided, a time-limited mathematical skill-testing question and sign a declaration and release.</li>
              <li><strong>Notification:</strong> the selected entrant will be contacted by email and must respond within 7 days, or another entrant may be selected.</li>
              <li><strong>Privacy:</strong> entry information is used only to administer this contest and, if you opt in, to send deal alerts. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.</li>
              <li><strong>General:</strong> the sponsor may cancel, suspend or modify the contest if fraud or technical failures affect its integrity. Void where prohibited. Full rules are available on request through our <Link href="/contact?topic=contest" className="underline">contact form</Link>.</li>
            </ol>
          </details>
        </section>

        <aside className="md:col-span-2 md:sticky md:top-24">
          <ContestEntry contest={CONTEST.slug} prize={CONTEST.prizeShort} />
        </aside>
      </div>
    </div>
  );
}
