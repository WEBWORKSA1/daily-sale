import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-20 text-center">
      <div className="display text-8xl font-black text-cart">404</div>
      <h1 className="display text-4xl font-black mt-4">This aisle is empty.</h1>
      <p className="mt-3 text-slate-600">The page you&apos;re looking for moved or never existed. Try one of these instead:</p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/deals" className="btn-primary">Today&apos;s deals</Link>
        <Link href="/basket" className="btn-secondary">Cheapest basket</Link>
        <Link href="/guides" className="btn-secondary">Savings guides</Link>
      </div>
    </div>
  );
}
