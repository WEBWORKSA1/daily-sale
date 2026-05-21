export function TotalSavings({ savingsCents, itemCount, storeCount }: {
  savingsCents: number; itemCount: number; storeCount: number;
}) {
  const dollars = (savingsCents / 100).toFixed(2);
  return (
    <div className="mt-8 inline-block bg-ink text-paper px-6 py-5 rotate-[-1deg] shadow-[8px_8px_0_0_#E63946]">
      <div className="text-xs tracking-[0.2em] uppercase opacity-70">If you buy all {itemCount} at the cheapest store each</div>
      <div className="display text-5xl md:text-6xl font-black tag">${dollars}</div>
      <div className="text-xs tracking-[0.15em] uppercase opacity-70 mt-1">saved vs. shopping all at one store · {storeCount} stores compared</div>
    </div>
  );
}
