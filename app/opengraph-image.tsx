import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'daily.sale — Every grocer’s flyer. One page. Ranked cheapest.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0f172a', color: '#fafaf7', padding: 72 }}>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 900 }}>
          daily<span style={{ color: '#dc2626' }}>.</span>sale
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05 }}>Every grocer’s flyer.</div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, color: '#f59e0b' }}>One page. Ranked cheapest.</div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, opacity: 0.8 }}>No Frills · Walmart · Food Basics · FreshCo · Sobeys · Giant Tiger · Zehrs — updated daily</div>
      </div>
    ),
    size
  );
}
