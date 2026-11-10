# daily.sale — Owner Setup Checklist

Everything is automated once these one-time steps are done.

## 1. Daily automation (GitHub Actions)
- `.github/workflows/scrape.yml` runs every day at 09:15 UTC plus Wednesday evening, commits `data/prices/latest.json`, and Vercel redeploys automatically.
- Repo → **Settings → Actions → General → Workflow permissions** → *Read and write permissions* (needed for the bot to commit).
- Run it once by hand: **Actions → Daily flyer refresh → Run workflow**.

## 2. Vercel
- Project → **Settings → Domains**: add `daily.sale` and `www.daily.sale` (redirect www → apex).
- Project → **Settings → Environment Variables** (all optional, see `.env.example`):
  - `CONTACT_EMAIL` — inbox that receives every form.
  - `FORMSPREE_FORM_ID` — optional; otherwise forms deliver through FormSubmit. The very first FormSubmit submission sends a one-time **Activate** email to the inbox: click it once.
  - `NEXT_PUBLIC_DONATE_URL` / `NEXT_PUBLIC_DONATE_MONTHLY_URL` — Stripe Payment Links or PayPal.me for instant donations (without them, donors get a pledge confirmation and you send a payment link).
  - `NEXT_PUBLIC_ADSENSE_SLOT` — optional numeric ad-unit id; Auto Ads work without it.
  - `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` — analytics and Search Console.

## 3. Google AdSense (pub-6620975821265271)
- The AdSense script and `google-adsense-account` meta tag are in every page's server HTML.
- `https://daily.sale/ads.txt` is served from `public/ads.txt`.
- In AdSense → **Sites**, add `daily.sale`, then **Request review**. Turn on **Auto ads**.
- In AdSense → **Privacy & messaging**, enable the Google-certified CMP message for EEA/UK/Switzerland visitors.

## 4. Google Search Console
- Add the `daily.sale` property, verify (DNS or `NEXT_PUBLIC_GSC_VERIFICATION`), and submit `https://daily.sale/sitemap.xml`.

## 5. Running contests
- Edit the `CONTEST` object at the top of `app/contests/page.tsx` (name, prize, dates) for each new contest.
- Entries arrive by email tagged `contest-entry`. Pick a winner at random, then administer the skill-testing question before awarding.

## 6. Adding videos
- Append `{"id": "<11-char YouTube id>", "title": "…", "desc": "…"}` to `data/videos.json`.

## 7. Adding a city
- Add the city's stores to `data/config.json` (with postal codes).
- The Flipp scraper currently reads flyers for one postal code (`POSTAL` in `scrapers/retailers/flipp.py`, St. Catharines). For a new city, run it per postal code (loop over a list) so each city's flyers are fetched.
