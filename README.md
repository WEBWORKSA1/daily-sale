# CheapCart — Cheapest Grocery Price Finder

**MVP. St. Catharines, Ontario launch. Top 100 Canadian grocery SKUs across 7 retailers.**
**No database. JSON files. Vercel static deploy. Built to demo and pitch.**

## What this does

Enter a postal code → see the cheapest store *today* for each of the 100 most-bought Canadian grocery items. Total savings calculated. Click any item to see prices at every other store.

## Wedge

Existing apps (Flipp, Reebee) show prices at every store. They don't tell you which store is cheapest *for what you actually buy*. CheapCart computes that ranking daily.

## Stack (zero-cost, zero-account)

- **Frontend**: Next.js 14 static export, deployed on Vercel free tier
- **Data store**: JSON files in the GitHub repo (`data/prices/latest.json`)
- **Scrapers**: Python, write to JSON, run daily via GitHub Actions
- **User submissions**: Formspree → emails to webworksa1@gmail.com (no DB needed)
- **Daily refresh**: GitHub Actions cron commits new JSON; Vercel auto-rebuilds

## Quick start (5 minutes to running locally)

```bash
npm install
python3 scripts/generate_seed_prices.py
npm run dev
```

Open http://localhost:3000 → enter `L2N 2G1`.

## Deploy to Vercel

Import this repo at vercel.com/new. No env vars required. For Formspree price reports, add `NEXT_PUBLIC_FORMSPREE_ID` in Vercel project settings.

## Legal posture

- Scrape only retailer-direct sources. No aggregators (Flipp, Reebee).
- Compilation is transformative (cheapest-store ranking).
- robots.txt respected; 1 req / 2s per host.
