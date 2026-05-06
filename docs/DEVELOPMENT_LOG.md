# beaute Development Log

Last updated: 2026-05-07

## Current Direction

beaute is a beauty product discovery app with auth, profile-based recommendations, ingredient analysis, usage logs, Rakuten product search/ranking, and a FREE/PRO plan split.

The product experience should feel personal rather than like a generic catalog. Rakuten supplies real product images, product URLs, search results, and ranking results. The app adds beauty-specific categories, tags, plan gates, and profile match scoring on top.

## 2026-05-07 Logged-In UX Pass

Scope:

- Reviewed logged-in PRO and FREE app surfaces on desktop and mobile with QA accounts.
- Search tab no longer opens into a weak empty-looking state.
- Journal now tolerates older corrupted QA rows instead of rendering obvious `????` text.

Changes:

- `src/components/features/SearchTab.tsx`
  - Blank search/category browsing now uses Rakuten ranking as the default product feed.
  - Count label shows loading state instead of `0件` while products are still being fetched.
  - Blank search explains that popular products are being displayed and that keywords/tags switch into search.
  - Empty state now offers quick recovery buttons for popular ranking and skincare.
- `src/components/features/LogTab.tsx`
  - Unknown categories fall back to skincare styling.
  - Broken/blank product names display as `商品名未設定`.
  - Broken/blank dates display as `日付未設定`.
  - Broken memo text is hidden.

Verification:

- `npm run typecheck` passes.
- `npm run build` passes.
- Local production build was launched on port `3004` for QA.
- Logged-in desktop PRO search showed 30 products.
- Logged-in mobile FREE search showed 30 products.
- Logged-in desktop/mobile Journal no longer surfaced `????` text.

## Rakuten Integration

Key files:

- `src/lib/rakuten.ts`
- `src/app/api/products/route.ts`
- `src/app/api/product-image/route.ts`
- `src/app/api/rakuten/route.ts`
- `src/app/api/debug-rakuten/route.ts`

Environment variables:

- `RAKUTEN_APPLICATION_ID`
- `RAKUTEN_ACCESS_KEY`
- `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`
- `RAKUTEN_REQUEST_ORIGIN`

Notes:

- Product search uses Rakuten Ichiba Item Search.
- Ranking uses Rakuten Ichiba Item Ranking.
- Rakuten API requests need an `Origin` header. Localhost is replaced with `https://beaute.vercel.app` unless `RAKUTEN_REQUEST_ORIGIN` is configured.
- Product images should come from `mediumImageUrls`; UI uses `object-fit: contain` for Rakuten-hosted images.
- `/api/products?mode=ranking&page=1` returns ranked items with `rank`.

## Plan Rules

Plan rules are centralized in `src/lib/plan.ts`.

FREE:

- Ingredient analysis: 3 times per month.
- Analysis history: latest 3 shown.
- Beauty log: 10 entries.
- Favorites: 10 products.
- Compare list: 3 products.
- Rakuten product detail: search results first 12 items per page, ranking top 10.
- Purchase links: FREE items only.
- Personalization: basic recommendations.

PRO:

- Price: `¥500/month`.
- Trial: 7 days.
- Ingredient analysis: unlimited.
- Analysis history: up to 50 saved in Supabase.
- Beauty log: unlimited.
- Favorites: unlimited.
- Compare list: up to 10 products.
- Rakuten product detail and purchase links: all items.
- Personalization: profile match score and reasons.

Plan enforcement:

- Ingredient analysis limit is enforced server-side in `/api/analyze`.
- Beauty log limit is enforced server-side in `/api/log-entries`.
- Analysis history is saved server-side in `/api/analysis-entries`.
- Favorites/compare limits are enforced server-side in `/api/product-saves`.
- Rakuten FREE/PRO item access is set when products are mapped in `/api/products`.
- UI plan text is sourced from `src/lib/plan.ts` via `PLAN_RULES` and `PLAN_FEATURE_MATRIX`.

## Personalization

Key file:

- `src/lib/personalization.ts`
- `src/app/api/personal-preferences/route.ts`
- `src/hooks/usePersonalPreferences.ts`

The app builds profile signals from:

- `skinType`
- `hairType`
- `concerns`
- alias signals such as `乾燥肌 -> 乾燥/保湿/高保湿`
- high-rated beauty log entries
- favorite and compare-list product snapshots

`getPersonalMatch(product, profile)` returns:

- `score`: 62-98
- `reasons`: matched profile/product signals

`/api/personal-preferences` reads `log_entries` and `product_saves` and returns:

- `positiveSignals`
- `negativeSignals`
- `topCategories`
- `summary`
- `confidence`
- `logCount`
- `savedCount`

Used in:

- Search cards
- Home recommendation rail
- Product drawer
- Karte recommendations

Current behavior:

- PRO users get recommendations adjusted by log ratings and saved products.
- FREE users see the base profile recommendation and upgrade copy.
- A high rating in logs boosts that category/signals.
- Low ratings become negative signals and can reduce product match score.

## Paid Conversion UI

Key files:

- `src/components/features/PremiumTab.tsx`
- `src/components/features/SearchTab.tsx`
- `src/components/features/HomeTab.tsx`
- `src/components/features/LogTab.tsx`
- `src/components/features/KarteTab.tsx`
- `src/components/features/SavedTab.tsx`
- `src/components/features/BeauteApp.tsx`

Current paid hooks:

- Header PRO CTA for free users.
- Premium page plan comparison and trial CTA.
- Search page personal-search teaser for free users.
- Locked Rakuten product cards show real product image plus PRO overlay.
- Product drawer hides editor note, full tags, videos, and purchase link for locked products.
- Log tab shows remaining FREE entries and gates saves at 10 entries.
- Karte tab gates old analysis history beyond FREE's 3 visible entries.
- Saved tab shows favorites and compare list.
- Product drawer can add/remove products from favorites and compare.
- Mobile bottom navigation is horizontally scrollable so all core tabs remain reachable after adding Saved.
- PRO search supports `おすすめ順`, which sorts by personal match score.
- Pricing copy should read from `PLAN_RULES.pro.priceLabel` and currently displays `¥500`.

## Product Analytics

Key files:

- `src/lib/productEvents.ts`
- `src/lib/apiUsage.ts`
- `src/lib/businessMetrics.ts`
- `src/app/api/product-events/route.ts`
- `src/app/admin/analytics/page.tsx`

Events:

- `product_view`: product drawer opened.
- `locked_product_click`: a locked FREE user product CTA/card was clicked.
- `purchase_click`: Rakuten purchase button clicked.
- `upgrade_click`: PRO upgrade intent.

Storage:

- Events are stored in `product_events`.
- API usage and cost estimates are stored in `api_usage_events`.
- Apply `supabase/schema.sql` so the `product_events` and `api_usage_events` tables exist before QA.
- The API stores product snapshot, category, source area, plan state, lock state, and metadata.
- `/api/analyze` stores Anthropic token usage and estimated JPY/USD cost after each analysis.
- `/api/products` stores Rakuten search/ranking API usage with zero direct API cost.
- `/api/youtube` stores request/quota estimates with zero direct API cost.

Admin analytics:

- URL: `/admin/analytics`
- Requires a logged-in user whose email is in `NEXT_PUBLIC_ADMIN_EMAILS`.
- Shows product detail views, locked interest, Rakuten purchase clicks, PRO intent, category buckets, source buckets, top products, API cost, estimated Rakuten rewards, and estimated gross profit.
- Also shows daily reward/cost/profit trends and generated improvement actions based on purchase rate, locked-product interest, API cost recovery, and winning products.
- Rakuten reward estimate defaults to 4% with a `¥1,000` cap per item, configurable via `RAKUTEN_AFFILIATE_RATE` and `RAKUTEN_AFFILIATE_REWARD_CAP_JPY`.
- Anthropic cost estimate defaults to `$5` input / `$25` output per 1M tokens and `155` JPY/USD, configurable via `ANTHROPIC_INPUT_USD_PER_MTOK`, `ANTHROPIC_OUTPUT_USD_PER_MTOK`, and `API_COST_USD_JPY_RATE`.

## Stripe

Key files:

- `src/app/api/stripe/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/stripe/status/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/stripe.ts`

Notes:

- Checkout requires logged-in user id and email.
- Checkout now verifies the Supabase access token server-side.
- Checkout uses `STRIPE_PRO_PRICE_ID`.
- Trial days come from `PLAN_RULES.pro.trialDays`.
- Webhook updates `profiles.is_pro`.
- Webhook also stores subscription id, status, current period end, and cancel-at-period-end.
- Customer Portal is available from the plan page for Stripe-backed PRO users.
- `customer.subscription.updated` now keeps `active` and `trialing` users as PRO.
- App Router webhook reads `req.text()` directly; no deprecated `export const config`.

Required env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

Stripe Dashboard setup:

- Enable Billing Customer Portal in Stripe.
- Allow payment method update, invoice history, and subscription cancellation.
- Confirm webhook events include `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.

## Supabase

Key files:

- `src/lib/supabase.ts`
- `supabase/schema.sql`

Important schema note:

- `log_entries` insert should be through `/api/log-entries`, not direct client insert.
- `analyze_usage` writes should be through `/api/analyze`, not direct client update.
- Apply the latest `supabase/schema.sql` in Supabase SQL Editor when setting up or hardening an existing database.

Tables in use:

- `profiles`
- `log_entries`
- `analyze_usage`
- `analysis_entries`
- `product_saves`
- `product_events`
- `api_usage_events`

`profiles` subscription columns:

- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_subscription_status`
- `stripe_current_period_end`
- `stripe_cancel_at_period_end`

Analysis/product save tables:

- `analysis_entries.result` stores the AI analysis JSON.
- `product_saves.product` stores the product snapshot returned by Rakuten/local product APIs.
- `product_events.product` stores a product snapshot for conversion analysis.
- `api_usage_events` stores provider, endpoint, operation, model, request count, token count, estimated USD/JPY cost, and metadata.
- Writes for these tables are intended to go through API routes so plan limits and analytics stay consistent.

## Release Readiness

Key files:

- `src/middleware.ts`
- `src/app/api/system-status/route.ts`
- `src/app/admin/status/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/HANDOFF.md`

Admin status page:

- URL: `/admin/status`
- `/admin/*`, `/api/system-status`, and admin analytics reads on `/api/product-events` are protected by Basic auth before the app-level admin check.
- Basic auth credentials are configured with `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASSWORD`.
- Basic auth locks a client/user combination for 15 minutes after 10 failed attempts.
- Requires a logged-in user whose email is in `NEXT_PUBLIC_ADMIN_EMAILS`.
- Checks required environment variables without exposing secret values.
- Checks Supabase tables and required columns with the service role key.
- Checks Stripe PRO Price ID and webhook secret.
- Checks Rakuten search and ranking API connectivity.
- Warns when `NEXT_PUBLIC_APP_URL` does not match the current origin.
- Links to `/admin/analytics` for conversion follow-up.

## Production Deployment

Production app:

- Primary URL: `https://beaute-xi.vercel.app`
- Vercel project: `kzm-urts-projects/beaute`
- GitHub repo: `https://github.com/kzm-urt/beaute.git`
- Latest verified production deployment: `dpl_CY2NxUyNg7zoH5KBVfHFF7niZmQs`
- Vercel inspect URL: `https://vercel.com/kzm-urts-projects/beaute/CY2NxUyNg7zoH5KBVfHFF7niZmQs`

Production setup completed on 2026-05-02:

- Production env vars were added to Vercel from `.env.local` without exposing secret values.
- `NEXT_PUBLIC_APP_URL` is set to `https://beaute-xi.vercel.app`.
- `NEXT_PUBLIC_ADMIN_EMAILS` includes the admin login email.
- Stripe webhook endpoint was created: `we_1TSb6cDpBMQgTuocdM4dV7mD`.
- Stripe webhook URL: `https://beaute-xi.vercel.app/api/stripe/webhook`.
- Webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Vercel `STRIPE_WEBHOOK_SECRET` was updated from the created Stripe endpoint and production was redeployed.
- Admin Basic auth was added to production with `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASSWORD`.
- `RAKUTEN_REQUEST_ORIGIN` is currently `https://beaute.vercel.app`, because that origin is accepted by the Rakuten Web Service settings. If `https://beaute-xi.vercel.app` is added to Rakuten allowed referrers later, update the env var and redeploy.

Production smoke test completed:

- `/` returns 200.
- `/terms`, `/privacy`, `/commercial`, `/robots.txt`, and `/sitemap.xml` return 200.
- `/api/debug-rakuten` returns 200 with Rakuten items.
- `/api/products?limit=30` returns 30 Rakuten products.
- `/api/products?mode=ranking&page=1` returns 30 Rakuten ranking items and starts at rank 1.

Local port:

- The current preferred local command is `npm run dev:3001`.
- Keep `.env.local` `NEXT_PUBLIC_APP_URL` aligned with the active dev port so Stripe redirects return correctly.

## Verification Notes

Recent checks:

- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- `npm run verify` runs typecheck and production build.
- `npm run preflight` checks the local server API/page smoke tests.
- `/api/products` returns Rakuten products with real Rakuten image URLs when Rakuten env vars are present.
- `/api/products?mode=ranking&page=1` returns ranking items with ranks.

Known operational note:

- If Japanese output looks garbled in PowerShell, set UTF-8 output before reading files:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

## Next Good Ideas

- Run `/admin/status` as the production readiness gate.
- Apply `supabase/schema.sql` to the active Supabase project before final QA if any status row still reports a missing table or column.
- Configure Supabase Auth Site URL and Redirect URLs in the Supabase dashboard for `https://beaute-xi.vercel.app`.
- Run a logged-in FREE and PRO QA pass on `http://localhost:3001`.
- Run Stripe test checkout and customer portal QA.
- Replace `/commercial` placeholders with the real operator/contact details before paid public launch.
