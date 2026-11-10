import { formatPrice } from '@/lib/format';

export function TotalSavings({ savingsCents, itemCount, storeCount }: { savingsCents: number; itemCount: number; storeCount: number }) {
  return (
    <div className="bg-save/10 border-l-4 border-save p-4 mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs tracking-[0.15em] uppercase text-save font-bold">Max possible savings this week</span>
        <span className="display text-3xl md:text-4xl font-black text-save">{formatPrice(savingsCents)}</span>
        <span className="text-sm text-slate-600">across {itemCount} items · {storeCount} stores</span>
      </div>
    </div>
  );
}
