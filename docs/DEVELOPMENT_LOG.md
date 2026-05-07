# beaute Development Log

Last updated: 2026-05-07

## Current Direction

beaute is a beauty product discovery app with auth, profile-based recommendations, ingredient analysis, usage logs, Rakuten product search/ranking, and a FREE/PRO plan split.

The product experience should feel personal rather than like a generic catalog. Rakuten supplies real product images, product URLs, search results, and ranking results. The app adds beauty-specific categories, tags, plan gates, and profile match scoring on top.

## 2026-05-07 Motion Polish Pass

Scope:

- Added tasteful motion across the public and logged-in app surfaces without changing the product model.
- Focused the animation layer on perceived quality: first paint, hero product movement, CTA feedback, card entry, tab transitions, and product drawer opening.
- Kept the motion subtle enough for a beauty utility app, with `prefers-reduced-motion` support inherited from the global reset.
- Fixed a temporary experiment leak where karaoke app metadata had overwritten the beaute page title, manifest, and social preview copy.

Changes:

- `src/app/page.tsx`
  - Restored the root route to `BeauteApp` so the beauty app remains the active entry point.
- `src/app/layout.tsx` and `public/manifest.json`
  - Restored beaute title, description, keywords, app name, Open Graph/Twitter copy, app theme colors, and font loading.
- `.vercelignore`
  - Excludes the temporary karaoke experiment files from Vercel uploads.
- `src/app/globals.css`
  - Added shared motion primitives for reveal, fade-scale, hero image drift, CTA sheen, card feedback, nav feedback, and status pulse.
  - Added drawer backdrop/image motion and premium/hero sheen rules.
  - Removed unused karaoke-specific CSS from the public app bundle.
- `src/components/features/BeauteApp.tsx`
  - Added app shell, guest banner, navigation, guest gates, product drawer, and purchase CTA motion classes.
- `src/components/features/HomeTab.tsx`
  - Added animated hero copy/product image, tutorial steps, category cards, product rails, editor picks, video cards, and PRO teaser.
- `src/components/features/SearchTab.tsx`
  - Added animated search/filter surface, result grid, empty state, product cards, and load-more controls.
- `src/components/features/KarteTab.tsx`
  - Added motion to the Beauty OS header, engine status, next actions, recommendation cards, and video/product blocks.
- `src/components/features/PremiumTab.tsx`
  - Added motion to the PRO hero, value ladder, plan cards, proof blocks, FAQ, and CTAs.
- `src/components/ui/index.tsx`
  - Added the shared CTA motion treatment to `GoldButton`.

Verification:

- `npm run typecheck` passes.
- `npm run build` passes.
- Local metadata check confirms the home title is `beauté | あなただけの美容提案`, and the HTML/manifest no longer contain karaoke wording.
- Local production build on port `3006` verified guest home, tutorial/category sections, search results, product drawer, PRO page, and guest Karte gate in the in-app browser.
- In-app browser console logs were empty after the interaction pass.
- `NEXT_PUBLIC_APP_URL=http://localhost:3006 npm run preflight` passes.
- Preview deployment `dpl_sKnvK466vmH2Vq3sPB9j8d9i8HKX` built successfully, but the preview URL was protected by Vercel and returned `401` to external preflight.
- Production deployment `dpl_6xBTbesFmVWgtBuP3P5gq6Y2qurL` was aliased to `https://beaute-xi.vercel.app`.
- `NEXT_PUBLIC_APP_URL=https://beaute-xi.vercel.app npm run preflight` passes.
- Metadata hotfix deployment `dpl_84uHj8rpksxmWvT5vHDqM4BWpDLT` was aliased to `https://beaute-xi.vercel.app`.
- Production metadata check confirms the home title is `beauté | あなただけの美容提案`, the manifest name is `beauté — AI美容提案`, and neither HTML nor manifest contains karaoke wording.

## 2026-05-07 Design System Lift

Scope:

- Raised the visual baseline across the logged-out and logged-in shell.
- Tightened wide desktop layouts so key pages do not stretch awkwardly on full-size screens.
- Re-centered the app around beaute after a temporary experimental entry point had changed the root app metadata.

Changes:

- `src/app/page.tsx`
  - Restored the root route to `BeauteApp`.
- `src/app/layout.tsx` and `public/manifest.json`
  - Restored beaute metadata, PWA naming, theme color, and public description.
- `src/app/globals.css`
  - Added shared beaute design tokens, section width helpers, elevated card states, focus states, and mobile spacing helpers.
  - Restored the beaute auth and app shell styling while preserving responsive helpers used by admin analytics and product drawers.
- `src/components/features/BeauteApp.tsx`
  - Constrained the guest preview banner on wide screens.
- `src/components/features/HomeTab.tsx`
  - Constrained editorial sections to a consistent shell width.
  - Polished the tutorial, category discovery, product rails, editor picks, and PRO teaser with stronger card elevation and spacing.
- `src/components/features/KarteTab.tsx`
  - Expanded Karte into a wider dashboard layout with an engine status summary.
- `src/components/features/PremiumTab.tsx`
  - Constrained the PRO page so the pricing/value ladder reads better on large screens.

Verification:

- `npm run verify` passes.
- Local production build on port `3006` verified the public home, tutorial/category sections, guest Karte gate, and PRO page in the in-app browser.
- Production deployment `dpl_3VtDQGN2tA6VFXThUqanY8inkmQB` passed `npm run preflight` against `https://beaute-xi.vercel.app`.

## 2026-05-07 Guest Funnel Pass

Scope:

- Shifted the product from fully member-gated to a three-step funnel: Guest, FREE member, and PRO.
- Made the public experience shareable while keeping saved lists, logs, analysis history, and PRO purchase/detail access behind clear conversion points.
- Clarified the paid value so visitors understand why PRO is worth paying for before they hit Stripe.

Changes:

- `src/components/features/AuthScreen.tsx`
  - Added a continue-as-guest action so users can preview products without creating an account.
- `src/components/features/BeauteApp.tsx`
  - Added guest mode with a safe sample profile for browsing recommendations.
  - Added a top guest preview banner explaining what is available to Guest, FREE, and PRO users.
  - Search, home, and ranking are visible to guests.
  - Analyze, Karte, Saved, and Log show focused registration gates for guests.
  - Saving a product as favorite/compare prompts auth when used by a guest.
  - Tab changes reset scroll position so mobile navigation starts at the top of each surface.
- `src/components/features/PremiumTab.tsx`
  - Added a Guest / FREE member / PRO value ladder.
  - Guest PRO buttons now lead to registration instead of trying to start checkout without a user.
- `src/app/globals.css`
  - Added guest auth button styling and a mobile single-column helper for gate cards.

Verification:

- `npm run typecheck` passes.
- `npm run build` passes.
- Local production build on port `3006` verified guest home, guest auth CTA, return-to-guest action, PRO value ladder, and mobile tab scroll reset in the in-app browser.

## 2026-05-07 Precision Upsell Polish

Scope:

- Reworked weak category blocks into more deliberate discovery cards.
- Made profile setup more granular so users feel the recommendation engine has real inputs.
- Added clearer free-to-PRO precision messaging around detailed filtering.

Changes:

- `src/components/features/HomeTab.tsx`
  - Category section now uses purpose-led cards with category-specific copy, routes, tags, and a PRO precision CTA.
  - Empty AI recommendation rails fall back to editor picks instead of showing `0` candidates.
  - Profile concern tags used for initial recommendation search are capped to avoid overly broad Rakuten queries.
- `src/components/features/ProfileScreen.tsx`
  - Redesigned onboarding into a two-column desktop layout and stronger mobile flow.
  - Added detailed signals for current skin state, finish preference, timing, budget, and avoidances.
  - Added a visible diagnostic signal meter and PRO preview copy.

Verification:

- `npm run typecheck` passes.
- `npm run build` passes.
- Local production build on port `3006` visually checked for the updated home category cards on mobile.

## 2026-05-07 Tutorial And Karte OS Pass

Scope:

- Added a tutorial-style flow so users understand how to use the app and why each step increases recommendation quality.
- Reframed Karte from a static profile screen into a personal beauty operating system that drives next actions and purchase decisions.
- Strengthened paid conversion copy around precision, purchase judgment, and PRO unlocks.

Changes:

- `src/components/features/HomeTab.tsx`
  - Added a `3 MINUTE GUIDE` tutorial module with steps for Karte, save/compare, ingredient analysis, and beauty logs.
  - Added direct CTAs from the tutorial into Search, Karte, Saved, Analyze, Log, and PRO.
- `src/components/features/KarteTab.tsx`
  - Added a personal engine score based on profile signals, analysis count, and PRO learning confidence.
  - Added actionable next-step cards so the user knows whether to refine Karte, analyze, open a product, or log usage.
  - Added a buyer recommendation block that promotes the best current product candidate and nudges FREE users toward PRO purchase judgment.
  - Recommendation API tag breadth is capped to avoid overly broad queries.
- `src/components/features/BeauteApp.tsx`
  - Passed tutorial navigation handlers into Home.
  - Updated guest Karte copy to explain the Beauty OS concept.

Verification:

- `npm run typecheck` passes.
- `npm run build` passes.
- Local production build on port `3006` visually checked for the new tutorial module in the in-app browser.

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
- Latest verified production deployment: `dpl_DdsoWBSc3hahdJwMgj2gVdhQdH2u`
- Vercel inspect URL: `https://vercel.com/kzm-urts-projects/beaute/DdsoWBSc3hahdJwMgj2gVdhQdH2u`

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

2026-05-07 mobile interaction pass:

- Product cards on Home, Search, Karte, and the Home hero product now use shared tap feedback so clicks feel more immediate on desktop and mobile.
- Product cards are keyboard reachable with `role="button"`, `tabIndex`, and Enter/Space activation.
- Mobile product detail now behaves more like a bottom sheet: drag grip, shorter hero, rounded sheet, denser body, and sticky save/compare/purchase actions.
- Product detail CTA copy now keeps users in the product drawer first, then sends them to Rakuten from the detail action.
- Verified locally with `npm run typecheck`, `npm run build`, browser product-click QA on `http://localhost:3006`, and `NEXT_PUBLIC_APP_URL=http://localhost:3006 npm run preflight`.

2026-05-07 personal creator pass:

- Profile/Karte now supports richer personal signals: gender, current products, current condition, desired ingredients, habits, and beauty goals.
- `profiles` gained optional columns for the new personal fields. Re-run `supabase/schema.sql` in Supabase SQL Editor before relying on persistence in production.
- The app falls back to the old profile columns if the new Supabase columns are not applied yet, so public browsing does not break during rollout.
- Karte now turns those signals into a "current state -> next action -> product -> video" flow.
- YouTube search now accepts a personal `query` and falls back to category searches when the personal query returns no results.
- Product matching now considers desired ingredients, current products, current state, goals, and learned preferences.
- Verified locally with `npm run typecheck`, `npm run build`, `NEXT_PUBLIC_APP_URL=http://localhost:3006 npm run preflight`, and `/api/youtube?query=...`.

2026-05-07 category luxury pass:

- The Home "目的から探す" grid was redesigned from plain pastel cards into dark editorial category tiles with monogram marks, inner hairline borders, gold/accent lighting, and stronger hover/tap feedback.
- Category backgrounds now use brand-safe generated SVG art instead of third-party category photos, so no accidental product logo or unrelated apparel image appears in that section.
- `docs/IMAGE_PROMPTS.md` contains production prompts for replacing those temporary generated SVG assets with AI-generated bitmap assets later.
- Verified locally with `npm run build`, `npm run typecheck`, `NEXT_PUBLIC_APP_URL=http://localhost:3006 npm run preflight`, and desktop/mobile Playwright screenshots on `http://localhost:3006`.

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
