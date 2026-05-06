# Handoff

This file is the short operational handoff for continuing work in a fresh chat or doing the final manual setup.

## Current Local Flow

```bash
npm run dev:3001
```

Open:

- App: http://localhost:3001
- Release status: http://localhost:3001/admin/status
- Conversion / cost / reward analytics: http://localhost:3001/admin/analytics
- Deployment guide: `docs/DEPLOYMENT.md`

Admin pages now require browser Basic auth before the normal Supabase admin login check.
Credentials are stored in `.env.local` as `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASSWORD`, and the same values are configured in Vercel Production.

## User Access Modes

- Guest: can browse Home, Search, Ranking, product previews, and the PRO plan page without logging in.
- FREE member: can save products, use compare lists, keep beauty logs, and run limited analysis according to `src/lib/plan.ts`.
- PRO member: unlocks the full Rakuten product detail/purchase flow, unlimited analysis, larger histories/lists, and stronger personalization.
- Guest conversion points now live in the top guest banner, gated feature tabs, product save actions, and the PRO value ladder.

## Automated Checks

Run these from the project root:

```bash
npm run verify
npm run preflight
```

`npm run verify` runs typecheck and production build.

`npm run preflight` expects the local server to already be running and checks:

- product search API
- ranking API
- auth guard on admin APIs
- `/admin/status`
- `/admin/analytics`

## Manual Setup Still Needed

These require dashboard access or real user interaction:

- Apply `supabase/schema.sql` in Supabase SQL Editor.
- Confirm `api_usage_events` exists after applying the schema so API cost logs can be saved.
- Confirm Stripe Billing Customer Portal is enabled.
- Configure Supabase Auth Site URL as `https://beaute-xi.vercel.app`.
- Add Supabase Auth Redirect URLs for `https://beaute-xi.vercel.app` and `https://beaute-xi.vercel.app/reset-password`.
- Replace `/commercial` placeholders with the real operator name, address, responsible person, and support contact before public paid launch.
- Run one real logged-in FREE flow and one PRO/Stripe test flow.

## Production Status

- Production URL: https://beaute-xi.vercel.app
- Vercel project: `kzm-urts-projects/beaute`
- Latest verified deployment: `dpl_5pqCL3pfzzH4t1mbtCCKwpvsp3zs`
- Stripe webhook endpoint: `we_1TSb6cDpBMQgTuocdM4dV7mD`
- Stripe webhook URL: `https://beaute-xi.vercel.app/api/stripe/webhook`
- Production env vars are set in Vercel, including Supabase, Stripe, Rakuten, YouTube, Anthropic, admin emails, API cost, and affiliate reward settings.
- Admin Basic auth env vars are set in Vercel Production.
- `NEXT_PUBLIC_APP_URL` is set to `https://beaute-xi.vercel.app`.
- `RAKUTEN_REQUEST_ORIGIN` is set to `https://beaute.vercel.app` because that origin is currently accepted by Rakuten. Update it to the production URL only after adding `https://beaute-xi.vercel.app` to Rakuten allowed referrers.
- Production smoke test passed for the public home page, Rakuten search, Rakuten ranking, the Guest / FREE / PRO funnel, precision upsell, tutorial guide, and Karte personal engine deployment.

## Manual QA Script

1. Open http://localhost:3001 while logged out.
2. Confirm Guest can see Home, Search, Ranking, product previews, and the guest banner.
3. Click a guest registration CTA and confirm the auth screen opens.
4. Return with "continue as guest" and open the PRO page.
5. Confirm the Guest / FREE member / PRO value ladder appears.
6. Log in on http://localhost:3001.
7. Complete profile if needed.
8. Open search and ranking.
9. Open a free product detail.
10. Click a locked PRO product.
11. Click a PRO CTA.
12. Click a Rakuten purchase button on an unlocked product.
13. Save one product as favorite and one as compare.
14. Add one beauty log.
15. Run one ingredient analysis to generate an Anthropic API cost log.
16. Open `/admin/analytics` and confirm event counts, API cost, and Rakuten reward estimates appear.
17. Open `/admin/status` and clear any `未対応`.

## Release Gate

- `npm run verify` passes.
- `npm run preflight` passes.
- `/admin/status` has no `未対応`.
- `/admin/analytics` shows test events, API cost, estimated Rakuten reward, daily trend, and improvement actions.
- FREE limits and PRO unlock behavior match `src/lib/plan.ts`.
