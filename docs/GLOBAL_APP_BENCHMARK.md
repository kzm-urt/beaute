# Global App Benchmark

Last updated: 2026-05-08

## Why This Exists

The current beautia direction is strong, but the UI is trying to show too many product ideas at once: product discovery, ranking, plan education, guest conversion, Karte, growth score, missions, product purchase, and guide content.

The strongest global apps usually win by choosing one dominant action per screen and turning everything else into secondary context.

## Apps Reviewed

| App | Category | What to learn |
| --- | --- | --- |
| YouCam Makeup / YouCam Skin | AI beauty analysis | Clear scan -> score -> recommendations loop. Skin score and skin age become a baseline for tracking, not just a one-time diagnosis. |
| Skin Bliss | AI skincare routine | Combines skin profile, routine, ingredients, and progress, but the pitch stays simple: know your skin, build routine, track visible progress. |
| TroveSkin | Skin diary / coach | Strong match for beautia: skin analysis, lifestyle factors, product recommendations, rewards, and progress tracking. |
| Yuka | Product scanner | Extremely clear flow: scan/search -> score -> details -> better alternative. Color and score do most of the explanation. |
| Think Dirty | Ingredient scanner | Strong commerce-adjacent trust model: scan/search, rating, ingredient alerts, comparison. The user intent is "can I trust this?" |
| Sephora | Beauty commerce | Huge catalog, but product cards and shopping flows keep the mental model commercial: shop, compare, save, buy. Personalization supports buying. |
| Lifesum | Food / health tracking | Weekly score and "what improved / what to adjust" are better than showing every data point upfront. |
| Noom | Behavior change | Daily lessons, small actions, coaching, and progress are framed around pace and confidence, not dashboards full of metrics. |
| Finch | Gamified self-care | Growth works because it is emotionally simple: one companion, small goals, streaks, rewards. It does not expose every system at once. |
| Streaks | Habit tracker | Minimalism wins: up to 24 tasks exist, but the core screen is still about today's completion and streak momentum. |

## Pattern Summary

### 1. One Primary Job Per Screen

- Home should not be a guide, product catalog, plan explainer, and dashboard at once.
- Search should not teach every plan difference before the first product.
- Product detail should not show every possible analysis block before the user knows whether the product is worth caring about.

### 2. Scores Beat Explanations

Successful apps make the first read numerical or visual:

- score
- level
- streak
- rank
- fit
- progress
- risk

Text explains only after the user asks for more.

### 3. The Loop Must Be Obvious

The strongest loop for beautia should be:

```text
今日の状態
-> AIスコア
-> 次の1手
-> 商品/ログ/解析
-> 前回比較
```

If a screen does not advance that loop, it should be hidden, secondary, or moved to Guide.

### 4. Product Discovery Needs a Cleaner Contract

Yuka, Think Dirty, and Sephora each have a clear product contract:

- Yuka: is this safe?
- Think Dirty: what is inside?
- Sephora: should I buy this?

beautia should own:

- Will this help my beauty score grow?

That means product cards should prioritize fit/growth status over long text, category rails, or plan education.

### 5. Gamification Should Be Elegant, Not Game UI

Finch and Streaks prove that growth can be motivating without dumping mechanics everywhere.

For beautia:

- keep score, level, mission, streak
- avoid showing XP, badges, plan gates, category chips, filters, and product details in the same first viewport
- make the "next mission" the main action

## Beautia Declutter Direction

### Home

Make Home a "Today" cockpit.

Keep:

- Beauty Score
- level / recent delta
- one next mission
- one primary CTA
- one product recommendation only if it supports the mission

Remove or demote:

- multiple hero CTAs
- guide module on first scroll
- product/category browsing blocks near the top
- plan education blocks

### Search

Make Search a product finder, not a plan explainer.

Keep:

- search input
- compact mode toggle or tabs
- first 2-3 product cards quickly visible
- product card growth score / fit / price

Move behind controls:

- category rail
- tag filter
- sort chips
- Guest/FREE/PRO education
- PRO teaser

### Product Detail

Make the first fold answer:

- What is it?
- Why does it fit me?
- What will it improve?
- What does it cost?
- Can I buy/save it?

Move lower:

- long Rakuten title
- detailed buying signals
- duplicate growth card if chips already show growth stats
- plan explanation

### Karte

Make Karte the user's growth history, not another feature menu.

Keep:

- score trend
- recent reasons
- current routine/product links
- next mission

Move:

- generic value explanation to Guide
- dense recommendation grids lower

### Bottom Navigation

Mobile should stay at 5-6 destinations max.

Recommended:

- Today
- Search
- Karte
- Log
- Plan

Optional:

- Ranking as a Search subtab
- Guide as a header/help entry, not persistent nav

## Immediate Fix Priority

1. Rebuild Home as a focused Today cockpit.
2. Collapse Search filters and plan education so products appear earlier.
3. Reduce product drawer first fold to one clear product decision card.
4. Remove duplicate growth/status blocks after chips are introduced.
5. Convert most copy into progressive disclosure: "詳しく見る", expandable sections, or Guide-only.
