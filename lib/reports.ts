import { getCheapestForPostal, getSiteStats, DEFAULT_REGION, CATEGORY_LABELS } from './data';
import { formatPrice, formatDate } from './format';
import type { CheapestRow } from './types';

export type Report = {
  slug: string; title: string; description: string; kicker: string;
  intro: string; sections: { h: string; p?: string; rows?: CheapestRow[]; table?: [string, string, string][] }[];
};

function weekLabel() {
  const s = getSiteStats();
  return s.flyerExpiry ? `week ending ${formatDate(s.flyerExpiry)}` : `week of ${formatDate(s.generatedAt)}`;
}

export function getReportSlugs(): string[] {
  return ['this-week-st-catharines', 'cheapest-grocery-store-this-week', ...Object.keys(CATEGORY_LABELS).map(c => `best-${c}-deals-this-week`)];
}

export function getReport(slug: string): Report | null {
  const data = getCheapestForPostal(DEFAULT_REGION);
  const items = data.items;
  const wk = weekLabel();
  const updated = formatDate(data.generated_at);

  if (slug === 'this-week-st-catharines') {
    const top = [...items].filter(i => i.savings_cents > 0).sort((a, b) => b.savings_cents - a.savings_cents).slice(0, 15);
    const totalGap = top.reduce((s, i) => s + i.savings_cents, 0);
    return {
      slug, kicker: 'Weekly report', title: `St. Catharines grocery deals — ${wk}`,
      description: `The ${top.length} biggest price gaps between St. Catharines grocers this week, from ${data.stores_count} stores' flyers. Updated ${updated}.`,
      intro: `We compared ${items.length} everyday items across ${data.stores_count} St. Catharines-area stores using this week’s flyers (last refreshed ${updated}). Buying each of the top ${top.length} items below at the cheapest store instead of the most expensive one saves a combined ${formatPrice(totalGap)}.`,
      sections: [
        { h: 'Biggest price gaps this week', p: 'Ranked by the difference between the cheapest and most expensive advertised price in the area.', rows: top },
        { h: 'How to use this list', p: 'Shop the two or three stores that win the most items on your list, or bring a competitor’s flyer to a store that price matches. Prices change daily — check the live deals page before you go.' }
      ]
    };
  }

  if (slug === 'cheapest-grocery-store-this-week') {
    const wins = new Map<string, number>();
    for (const i of items) wins.set(i.cheapest.retailer_name, (wins.get(i.cheapest.retailer_name) || 0) + 1);
    const ranked = Array.from(wins.entries()).sort((a, b) => b[1] - a[1]);
    const leader = ranked[0];
    return {
      slug, kicker: 'Store ranking', title: `Which St. Catharines grocery store is cheapest? (${wk})`,
      description: `Store-by-store count of which grocer has the lowest flyer price on the most everyday items this week. Updated ${updated}.`,
      intro: leader
        ? `${leader[0]} has the lowest advertised price on ${leader[1]} of the ${items.length} items we could compare this week — more than any other store. But no single store wins everything, which is why split-shopping two stores usually beats loyalty to one.`
        : 'Flyers are refreshing — check back shortly.',
      sections: [
        { h: 'Items won by each store', table: ranked.map(([name, n], idx) => [String(idx + 1), name, `${n} item${n === 1 ? '' : 's'}`]) },
        { h: 'Method', p: 'For each tracked item, the store with the lowest current flyer price “wins” it. Ties go to the first store found. Items with no current flyer price are excluded.' }
      ]
    };
  }

  const m = slug.match(/^best-(.+)-deals-this-week$/);
  if (m && CATEGORY_LABELS[m[1]]) {
    const cat = m[1], label = CATEGORY_LABELS[cat];
    const rows = items.filter(i => i.product_category === cat).sort((a, b) => b.savings_cents - a.savings_cents);
    return {
      slug, kicker: label, title: `Best ${label.toLowerCase()} deals in St. Catharines — ${wk}`,
      description: `Cheapest store for every ${label.toLowerCase()} item we track this week, with price gaps. Updated ${updated}.`,
      intro: rows.length
        ? `${rows.length} ${label.toLowerCase()} items have current flyer prices in the St. Catharines area. The biggest gap this week is on ${rows[0].product_name} (${formatPrice(rows[0].savings_cents)} between stores).`
        : `No ${label.toLowerCase()} items are on the flyers we track right now. We check daily.`,
      sections: [{ h: `${label}: cheapest store per item`, rows }]
    };
  }
  return null;
}
