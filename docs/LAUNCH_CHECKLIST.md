# Launch Checklist

Target: complete the first release within this week.

## 2026-04-30 Thu

- Add release status tooling.
- Confirm `.env.local` points to `http://localhost:3001` while developing on port 3001.
- Apply the latest `supabase/schema.sql` to the active Supabase project.
- Open `/admin/status` and clear all `未対応` items.
- Open `/admin/analytics` after test events and confirm product/PRO event aggregation, API cost, and Rakuten reward estimates.

## 2026-05-01 Fri

- Run logged-in QA on the main app flow.
- Confirm profile creation, product search, ranking, product drawer, favorite, compare, log, analysis history, and PRO gating.
- Confirm product drawer views, locked product clicks, Rakuten purchase clicks, and PRO CTA clicks appear in `/admin/analytics`.
- Run one ingredient analysis and confirm Anthropic API usage/cost appears in `/admin/analytics`.
- Run Stripe test checkout and confirm webhook updates `profiles.is_pro`.
- Confirm Billing Customer Portal opens from the PRO screen.

## 2026-05-02 Sat

- Polish conversion copy after QA.
- Check mobile layout on search, ranking, product drawer, saved, karte, log, and premium screens.
- Confirm FREE limits:
  - Analysis: 3/month
  - Log: 10 entries
  - Favorites: 10
  - Compare: 3
  - Rakuten detail: search first 12, ranking top 10
- Confirm PRO unlock:
  - Analysis unlimited
  - History up to 50
  - Favorite unlimited
  - Compare up to 10
  - All Rakuten product details and purchase links

## 2026-05-03 Sun

- Set production env vars on the hosting service. Done on 2026-05-02.
- Set `NEXT_PUBLIC_APP_URL` to the production domain. Done on 2026-05-02.
- Keep `RAKUTEN_REQUEST_ORIGIN` on the Rakuten-allowed origin until `https://beaute-xi.vercel.app` is added to Rakuten Web Service allowed referrers.
- Replace `/commercial` placeholders with real operator/contact information.
- Add production Stripe webhook endpoint. Done on 2026-05-02.
- Add Basic auth in front of admin screens and admin analytics APIs. Done on 2026-05-03.
- Run `npm run build`. Done in Vercel production build on 2026-05-02.
- Smoke test the deployed URL. Done on 2026-05-02.

## Production Deployment Completed

- Production URL: `https://beaute-xi.vercel.app`
- Vercel deployment: `dpl_CY2NxUyNg7zoH5KBVfHFF7niZmQs`
- Stripe webhook endpoint: `we_1TSb6cDpBMQgTuocdM4dV7mD`
- Admin pages are protected with Basic auth plus Supabase admin email checks.
- Verified public pages, legal pages, robots, sitemap, Rakuten search, and Rakuten ranking.
- Remaining launch blockers are manual business/auth QA items: Supabase Auth URLs, `/commercial` real operator details, Billing Portal confirmation, and logged-in FREE/PRO checkout testing.

## Release Gates

- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- `/admin/status` has no `未対応`.
- `/admin/analytics` shows test product events, API cost, and estimated Rakuten reward after logged-in QA.
- Logged-in FREE flow works.
- Logged-in PRO flow works.
- Stripe test checkout and portal work.
- Rakuten search and ranking return real images.
