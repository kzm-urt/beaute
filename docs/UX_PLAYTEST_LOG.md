# beautia UX Playtest Log

Last updated: 2026-05-08

## 2026-05-08 Chrome First-Use Guest Playtest

Context:

- Tester posture: no prior knowledge of the app.
- Browser: Google Chrome, local production server on `http://localhost:3001`.
- Viewports: mobile 390 x 844 and desktop 1366 x 820.
- Account state: guest only. Logged-in FREE / PRO growth panels were not covered in this pass.
- Screenshots are in `tmp/ux-playtest/`.

Goal:

- Check whether the new "AI beauty growth visualization" direction is felt by a first-time guest.
- Check guest / FREE / PRO routing, Karte gate, mobile scan quality, and product detail purchase readiness.

Tested Flow:

1. Mobile Home as a guest.
2. Mobile Search from direct URL and bottom navigation.
3. Tapping the first visible locked product on Search.
4. Home "today's pick" product detail drawer.
5. Guest Karte gate.
6. Premium page.
7. Desktop Search.

What Worked:

- The visual tone is premium and distinct from a plain catalog.
- No horizontal page overflow was detected in the tested mobile and desktop viewports.
- Guest state is understandable: header, guest banner, and Karte gate all make login/registration visible.
- Product detail has the right commerce basics: real image, price, rating, review count, save/compare actions, and Rakuten purchase CTA.
- The product drawer's `BEAUTY EQUIPMENT` idea is strong once it appears. It turns a product into growth equipment rather than just an item to buy.
- Desktop Search is dense but scannable, with filters, plan path, and product cards visible together.

Findings:

- P1: The guest first viewport still reads as "premium product discovery" more than "AI beauty growth". Home shows a sample profile, but not a score, level, XP, trend, or next mission.
  - Next: add a guest-visible Growth preview near the Home hero: score, level, +delta, next mission, and a small "records make this grow" cue.
- P1: Mobile Search can start with a PRO-locked product as the first visible card. In the test, tapping it went straight to Premium instead of opening product detail first.
  - Evidence: `08-mobile-search-direct.png` then `09-mobile-product-drawer-direct.png`.
  - Next: ensure the first mobile search screen has at least 2-3 openable FREE cards, or let locked cards open a preview drawer with PRO-only sections locked inside.
- P1: Mobile Search is vertically heavy before products appear. The input, mode switch, category rail, tag toggle, sort chips, PRO teaser, Guest/FREE/PRO path, and explanation block all appear before the first product.
  - Next: make the plan path compact after first exposure, compress the PRO teaser to a small pill, and prioritize product cards sooner.
- P1: Product detail sells purchase before it sells growth. The top screen shows image, huge product name, plan path, rating, price, and sticky Rakuten CTA. `BEAUTY EQUIPMENT` starts below the initial fold around y=1078 and only becomes visible after scrolling.
  - Evidence: `20-mobile-product-drawer-coordinate-top.png` and `21-mobile-product-drawer-coordinate-growth.png`.
  - Next: add compact growth stat chips under the title or price, e.g. `Pores +12`, `Clarity +8`, before the purchase verdict.
- P1: Rakuten product names are too long for the mobile drawer. The title becomes a large wall of text, and the sticky bottom purchase actions can cover the product description while scrolling.
  - Next: clamp the top title to 2-3 lines, keep the full name in a detail section, and add enough bottom padding for sticky actions.
- P2: Karte guest gate is clear but generic. It explains the value of keeping skin, hair, saves, and logs together, but does not preview that the Karte grows over time.
  - Next: show a sample mini growth dashboard behind the gate: score, level, streak, recent delta, and next action.
- P2: Premium page still sells "more smart / more details" more than the growth loop.
  - Next: add PRO benefits around trend lines, unlimited growth history, future prediction, mission suggestions, and product equipment recommendations.
- P2: Mobile bottom nav has more tabs than fit in the viewport. It scrolls horizontally, but the later tabs are partially hidden and the scroll affordance is subtle.
  - Next: add an edge fade / active-tab auto-scroll, or reduce the mobile bottom nav to the primary five actions with secondary actions elsewhere.
- P2: Product drawer image fitting can leave a large side band depending on source image ratio.
  - Next: crop/fit product images more intentionally in the drawer hero, while preserving the actual product for inspection.
- P2: Chrome console shows a PWA warning: `apple-mobile-web-app-capable` is deprecated without `mobile-web-app-capable`.
  - Next: add the modern meta tag.

Recommended Next Implementation Order:

1. Guest-visible Beauty Growth preview on Home.
2. Search first-screen conversion fix: do not start mobile guests on a locked product wall.
3. Product drawer first-fold growth chips and title clamp.
4. Product drawer sticky-action padding fix.
5. Karte gate Growth sample.
6. Premium Growth / future-prediction sales section.
7. Mobile nav affordance and PWA meta cleanup.

## 2026-05-08 Post-Fix Chrome QA

Implemented from the playtest:

- Home now shows a guest Growth Preview in the first viewport: beauty score, level, next mission, and product growth stat hints.
- Search now defaults guests/FREE users to openable FREE products by passing `free=true` to `/api/products`.
- Locked products can open a preview drawer when an `onOpenProduct` handler exists, so the user sees product value before hitting PRO.
- Product drawer now shows growth chips near price, clamps the mobile title, and has enough bottom padding for sticky actions.
- Karte guest gate now previews a mini growth dashboard.
- Premium now has a Growth Engine section around future prediction, log XP, equipment, and previous comparison.
- Mobile bottom nav is reduced to six primary actions: Home, Guide, Search, Ranking, Karte, Plan.
- Added `mobile-web-app-capable` metadata to remove the Chrome PWA warning.

Verification:

- `npm run typecheck` passed.
- `npm run build` passed.
- Real Chrome extension flow on `http://localhost:3001` confirmed:
  - Home contains `GROWTH PREVIEW`.
  - Search contains the Guest/FREE/PRO path and renders 12 FREE products.
  - Product drawer contains growth chips, price, and Rakuten CTA.
  - No Chrome console errors or warnings were captured during that flow.
- Chrome mobile CDP checks at 390px confirmed:
  - Search, product drawer, Karte gate, and Premium have no horizontal overflow.
  - Mobile nav labels are not clipped after reducing the nav to six items.
  - Plan path labels in Search are not clipped.
- Screenshots:
  - `tmp/ux-playtest-post/01-mobile-home-growth-preview.png`
  - `tmp/ux-playtest-final/02-mobile-search-after-nav.png`
  - `tmp/ux-playtest-final/03-mobile-drawer-after-nav.png`
  - `tmp/ux-playtest-final/04-mobile-karte-after-nav.png`
  - `tmp/ux-playtest-final/05-mobile-premium-after-nav.png`
- `NEXT_PUBLIC_APP_URL=http://localhost:3001 npm run preflight` passed required checks. The missing `beta_feedback` table remains a known non-blocking schema warning because the fallback write path is active.

Open QA Gaps:

- Logged-in FREE flow: profile setup, Karte Growth panel, save/compare, log XP, analyze limit.
- Logged-in PRO flow: personal scores, unlimited detail, product equipment with profile-based match, Stripe checkout.
- Production URL recheck on `https://beaute-xi.vercel.app` after the next deploy.
