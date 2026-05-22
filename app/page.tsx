import Link from 'next/link';

export const metadata = {
  title: 'daily.sale — Spend less on the things you buy',
  description: 'A growing collection of tools that find you the best price. Starting with groceries in St. Catharines.',
};

type Product = {
  slug: string;
  name: string;
  tagline: string;
  status: 'live' | 'soon';
  href: string;
  num: string;
  blurb: string;
};

const PRODUCTS: Product[] = [
  {
    slug: 'smart-deals',
    name: 'Smart Deals',
    tagline: 'This week\'s cheapest groceries, ranked',
    status: 'live',
    href: '/smart-deals',
    num: '01',
    blurb: 'For the 100 things you actually buy, we rank which St. Catharines store has the lowest price this week — pulled from the latest flyers across No Frills, Walmart, Sobeys, FreshCo, and Giant Tiger.',
  },
  {
    slug: 'good-deals',
    name: 'Good Deals',
    tagline: 'Verified prices, straight from the source',
    status: 'soon',
    href: '/good-deals',
    num: '02',
    blurb: 'The next step: everyday shelf prices pulled directly from each retailer, not just flyer specials. Deeper coverage, more stores, verified by real shoppers. In active development.',
  },
];

export default function Hub() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-6 pb-3 rule-thick border-b border-ink">
        <div className="flex items-baseline justify-between">
          <div className="text-xs tracking-[0.2em] uppercase">A Webworks Property</div>
          <div className="text-xs tracking-[0.2em] uppercase">St. Catharines, ON</div>
        </div>
      </header>

      <section className="px-6 md:px-12 py-10 md:py-20">
        <p className="text-xs tracking-[0.25em] uppercase mb-6">daily.sale</p>
        <h1 className="display text-[15vw] md:text-[9vw] leading-[0.88] font-black">
          Spend less<br/>
          on the things<br/>
          <span className="italic font-normal">you buy.</span>
        </h1>
        <div className="rule-double my-10 max-w-3xl"></div>
        <p className="display text-2xl md:text-3xl max-w-3xl leading-tight font-light">
          A growing collection of tools that hunt down the best price, so you don&apos;t have to.
          <span className="italic"> Pick a tool to get started.</span>
        </p>
      </section>

      <section className="px-6 md:px-12 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 rule-thin border-t border-ink mt-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 text-xs tracking-[0.15em] uppercase">
          <div>© daily.sale</div>
          <div className="opacity-70">Prices from public flyers &amp; retailer pages; verify in store.</div>
        </div>
      </footer>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isLive = product.status === 'live';
  const inner = (
    <div
      className={
        'lift relative border-2 border-ink p-8 md:p-10 h-full flex flex-col ' +
        (isLive ? 'bg-paper hover:bg-ink hover:text-paper group cursor-pointer' : 'bg-paper/40')
      }
    >
      <div className="flex items-start justify-between mb-6">
        <div className="display text-6xl md:text-7xl font-black">{product.num}</div>
        <span
          className={
            'stamp ' + (isLive ? 'text-save' : 'text-ink/50')
          }
        >
          {isLive ? 'Live' : 'Coming Soon'}
        </span>
      </div>
      <h2 className="display text-4xl md:text-5xl font-black leading-none mb-3">{product.name}</h2>
      <p className="display text-xl md:text-2xl font-light italic mb-5">{product.tagline}</p>
      <p className="text-sm leading-relaxed opacity-80 mb-8">{product.blurb}</p>
      <div className="mt-auto">
        {isLive ? (
          <span className="inline-block text-sm tracking-[0.2em] uppercase font-bold border-b-2 border-current pb-1 group-hover:border-paper">
            Open Smart Deals →
          </span>
        ) : (
          <span className="inline-block text-sm tracking-[0.2em] uppercase font-bold opacity-50">
            In development
          </span>
        )}
      </div>
    </div>
  );

  if (isLive) {
    return <Link href={product.href} className="block h-full">{inner}</Link>;
  }
  return <div className="h-full">{inner}</div>;
}
