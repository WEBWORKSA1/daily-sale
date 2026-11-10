# daily.sale™

Every grocer's flyer. One page. Ranked cheapest.

daily.sale compares this week's flyer prices across No Frills, Walmart, Food Basics, FreshCo, Sobeys, Giant Tiger and Zehrs (St. Catharines / Niagara first) and ranks the cheapest store for 100 everyday items. Prices refresh automatically every day.

## How it runs itself

```
GitHub Actions (daily 09:15 UTC + Wed evening)
  └─ scrapers/retailers/no_frills.py   retailer-direct prices
  └─ scrapers/retailers/flipp.py       every banner's digital flyer
  └─ scrapers/utils/store.py           merge · drop expired · reject implausible prices
  └─ scrapers/validate.py              refuse to publish < 20 rows
  └─ git commit data/prices/latest.json
        └─ Vercel auto-deploys → every page re-reads the new data
```

Pages are rendered on demand, so rankings, reports, sitemaps and "last updated" stamps always reflect the latest committed data.

## Site map

| Area | Routes |
|---|---|
| Deals | `/`, `/deals?q=`, `/p/[postal]`, `/item/[slug]` (100 pages), `/categories/[cat]`, `/stores/[id]`, `/flyers` |
| Tools | `/basket` (cheapest basket builder), `/calculator`, `/report` |
| Content | `/blog` + self-updating weekly reports `/blog/[slug]`, `/guides/[slug]`, `/videos`, `/coupons`, `/faq` |
| Lead generation | `/newsletter` (Thursday email + price-drop alerts), homepage alert builder, exit-intent offer, `/launch-request` |
| Community | `/contests`, `/donate` (directed support: operations, promotions, hiring, contests, expansion) |
| Business | `/advertise`, `/partnerships`, `/careers`, `/press`, `/contact` |
| Legal | `/privacy`, `/terms`, `/cookies`, `/legal`, `/dmca`, `/accessibility`, `/affiliate-disclosure`, `/editorial-policy` |
| SEO / ads | `/sitemap.xml`, `/robots.txt`, `/ads.txt`, Open Graph image, JSON-LD |

All forms post to `/api/lead`, which delivers server-side; no inbox address is ever rendered to visitors.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
python scrapers/retailers/flipp.py --verbose   # refresh prices locally
```

Configuration lives in `.env.example`. Store list: `data/config.json`. Product list: `data/products.json`. Price sanity bounds: `data/reference_prices.json`. Videos: `data/videos.json`.

© daily.sale. All rights reserved. Retailer names are trademarks of their respective owners; daily.sale is not affiliated with any retailer.
