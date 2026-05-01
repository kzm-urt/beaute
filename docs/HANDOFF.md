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
- Confirm `NEXT_PUBLIC_ADMIN_EMAILS` includes the admin login email.
- Confirm Stripe Billing Customer Portal is enabled.
- Confirm Stripe webhook endpoint points to `/api/stripe/webhook`.
- Confirm production `NEXT_PUBLIC_APP_URL` and `RAKUTEN_REQUEST_ORIGIN` match the deployed URL.
- Replace `/commercial` placeholders with the real operator name, address, responsible person, and support contact before public paid launch.
- Run one real logged-in FREE flow and one PRO/Stripe test flow.

## Manual QA Script

1. Log in on http://localhost:3001.
2. Complete profile if needed.
3. Open search and ranking.
4. Open a free product detail.
5. Click a locked PRO product.
6. Click a PRO CTA.
7. Click a Rakuten purchase button on an unlocked product.
8. Save one product as favorite and one as compare.
9. Add one beauty log.
10. Run one ingredient analysis to generate an Anthropic API cost log.
11. Open `/admin/analytics` and confirm event counts, API cost, and Rakuten reward estimates appear.
12. Open `/admin/status` and clear any `未対応`.

## Release Gate

- `npm run verify` passes.
- `npm run preflight` passes.
- `/admin/status` has no `未対応`.
- `/admin/analytics` shows test events, API cost, estimated Rakuten reward, daily trend, and improvement actions.
- FREE limits and PRO unlock behavior match `src/lib/plan.ts`.
