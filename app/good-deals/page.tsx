import Link from 'next/link';

export const metadata = {
  title: 'Good Deals — Coming Soon · daily.sale',
  description: 'Everyday shelf prices pulled directly from each retailer. In active development.',
};

export default function GoodDeals() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-6 pb-3 rule-thick border-b border-ink">
        <div className="flex items-baseline justify-between">
          <Link href="/" className="text-xs tracking-[0.2em] uppercase hover:underline">← daily.sale</Link>
          <div className="text-xs tracking-[0.2em] uppercase">Good Deals · In Development</div>
        </div>
      </header>

      <section className="px-6 md:px-12 py-16 md:py-28 flex-1 flex flex-col justify-center">
        <span className="stamp text-ink/50 mb-8">Coming Soon</span>
        <h1 className="display text-[15vw] md:text-[9vw] leading-[0.88] font-black">
          Good<br/>
          <span className="italic font-normal">Deals.</span>
        </h1>
        <div className="rule-double my-10 max-w-3xl"></div>
        <p className="display text-2xl md:text-3xl max-w-3xl leading-tight font-light">
          We&apos;re building the deeper layer: <span className="italic">everyday shelf prices</span> pulled
          directly from each retailer — not just this week&apos;s flyer specials. More stores, more items,
          verified by real shoppers.
        </p>
        <p className="text-sm max-w-2xl mt-8 opacity-70 leading-relaxed">
          Smart Deals shows you the weekly flyer winners today. Good Deals will track the regular
          price of everything, all the time — so you know not just what&apos;s on sale, but what&apos;s
          genuinely cheapest, every day. In active development.
        </p>
        <div className="mt-12">
          <Link href="/smart-deals" className="inline-block bg-ink text-paper px-8 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-cart transition">
            Try Smart Deals now →
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 rule-thin border-t border-ink mt-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 text-xs tracking-[0.15em] uppercase">
          <div>© daily.sale · Good Deals</div>
          <div className="opacity-70">In development. Check back soon.</div>
        </div>
      </footer>
    </main>
  );
}
