export function HowItWorks() {
  const steps = [
    { n: '01', t: 'Enter your postal', d: 'We localize every price to grocers in your city. One field, no account.' },
    { n: '02', t: 'See the ranked list', d: 'For 100 everyday items, we show which store sells it cheapest this week — with the savings vs. the most expensive store next to it.' },
    { n: '03', t: 'Build your basket', d: 'Tap items into your list. We total the basket per store so you know exactly where (or across where) to shop.' },
    { n: '04', t: 'Save on autopilot', d: 'Subscribe to Thursday alerts and we email your city’s biggest deals the moment new flyers drop.' }
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 bg-paper">
      <div className="mb-10">
        <div className="text-xs tracking-[0.2em] uppercase text-slate-500 mb-2">How it works</div>
        <h2 className="display text-4xl md:text-5xl font-black">From flyer-flipping to one page.</h2>
      </div>
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map(s => (
          <div key={s.n} className="card p-6">
            <div className="display text-5xl font-black text-cart mb-3">{s.n}</div>
            <h3 className="font-bold text-lg mb-2">{s.t}</h3>
            <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{__html: s.d}} />
          </div>
        ))}
      </div>
    </section>
  );
}
