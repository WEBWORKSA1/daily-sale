import type { MetadataRoute } from 'next';
import { getAllProducts, getAllStores, getGeneratedAt, CATEGORY_LABELS } from '@/lib/data';
import { GUIDES } from '@/lib/guides';
import { getReportSlugs } from '@/lib/reports';

const BASE = 'https://daily.sale';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date((getGeneratedAt() || new Date().toISOString().slice(0, 10)) + 'T09:00:00Z');
  const daily = (p: string, priority = 0.8) => ({ url: `${BASE}${p}`, lastModified: updated, changeFrequency: 'daily' as const, priority });
  const monthly = (p: string, priority = 0.4) => ({ url: `${BASE}${p}`, lastModified: updated, changeFrequency: 'monthly' as const, priority });

  return [
    daily('', 1), daily('/deals', 0.95), daily('/basket', 0.9), daily('/flyers'), daily('/stores'), daily('/categories'), daily('/blog', 0.85), daily('/p/L2R', 0.85),
    ...Object.keys(CATEGORY_LABELS).map(c => daily(`/categories/${c}`, 0.75)),
    ...getAllStores().map(s => daily(`/stores/${s.id}`, 0.7)),
    ...getAllProducts().map(p => daily(`/item/${p.slug}`, 0.7)),
    ...getReportSlugs().map(s => daily(`/blog/${s}`, 0.75)),
    monthly('/guides', 0.7), ...GUIDES.map(g => monthly(`/guides/${g.slug}`, 0.65)),
    ...['/newsletter', '/contests', '/donate', '/calculator', '/coupons', '/videos', '/faq', '/report', '/launch-request',
        '/about', '/contact', '/advertise', '/partnerships', '/careers', '/press', '/editorial-policy',
        '/privacy', '/terms', '/cookies', '/legal', '/dmca', '/accessibility', '/affiliate-disclosure'].map(p => monthly(p))
  ];
}
