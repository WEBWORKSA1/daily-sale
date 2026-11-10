'use client';
import { useEffect, useRef } from 'react';

type Props = {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid';
  responsive?: boolean;
  label?: string;
  className?: string;
};

const CLIENT = 'ca-pub-6620975821265271';
// Optional: a numeric ad-unit id created in AdSense > Ads > By ad unit.
// Without one, nothing renders here and AdSense Auto Ads (enabled by the
// script in <head>) chooses placements automatically.
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || '';

export function AdSlot({ slot, format = 'auto', responsive = true, label = 'Advertisement', className = '' }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const resolved = slot && /^\d{6,}$/.test(slot) ? slot : DEFAULT_SLOT;

  useEffect(() => {
    if (!resolved) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* script not ready / blocked */ }
  }, [resolved]);

  if (!resolved) return null;

  return (
    <div className={`my-6 ${className}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-1 text-center">{label}</div>
      <ins
        ref={ref as any}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={resolved}
        data-ad-format={format === 'horizontal' ? 'auto' : format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
