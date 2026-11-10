export function TrustStrip() {
  const stats = [
    { n: '100+', l: 'Products tracked weekly' },
    { n: '7', l: 'Major grocer banners' },
    { n: 'Daily', l: 'Auto-refresh cadence' },
    { n: '$0', l: 'Cost to you, ever' }
  ];
  return (
    <section className="bg-ink text-paper py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.l}>
              <div className="display text-3xl md:text-4xl font-black text-accent">{s.n}</div>
              <div className="text-xs md:text-sm opacity-80 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
