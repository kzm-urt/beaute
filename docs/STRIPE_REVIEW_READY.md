# Stripe Review Ready Notes

Last updated: 2026-05-11

## Public Site

- Production URL: https://beaute-xi.vercel.app
- Service name: beautia
- Operator / business name: iRise
- Public support email: computerschool.irise@gmail.com
- Payment provider: Stripe
- Paid plan: PRO, monthly subscription with a free trial

## What Stripe Can Verify

- The production site is publicly accessible without a site-wide password.
- Admin-only pages remain protected, but customer-facing pages are open.
- The service name, product description, pricing, trial, cancellation flow, and support contact are visible on public pages.
- Legal and policy pages are linked from the pricing/about flows.

## Important Public Pages

- Home: https://beaute-xi.vercel.app
- How to use: https://beaute-xi.vercel.app/guide
- Pricing: https://beaute-xi.vercel.app/pricing
- About / operator info: https://beaute-xi.vercel.app/about
- Specified Commercial Transaction Act: https://beaute-xi.vercel.app/commercial
- Terms: https://beaute-xi.vercel.app/terms
- Privacy Policy: https://beaute-xi.vercel.app/privacy
- Sitemap: https://beaute-xi.vercel.app/sitemap.xml

## Re-review Message

Use this when replying to Stripe or requesting another review:

```text
beautia の公開サイトを更新しました。

本番URL:
https://beaute-xi.vercel.app

現在はサイト全体のパスワード制限を外しており、Stripeの審査で必要な公開ページを確認できます。
料金ページ、サービス内容、特定商取引法に基づく表記、利用規約、プライバシーポリシー、お問い合わせ先を公開しています。

公開ページ:
- https://beaute-xi.vercel.app/pricing
- https://beaute-xi.vercel.app/about
- https://beaute-xi.vercel.app/commercial
- https://beaute-xi.vercel.app/terms
- https://beaute-xi.vercel.app/privacy
- https://beaute-xi.vercel.app/guide

サービス名: beautia
運営名: iRise
お問い合わせ: computerschool.irise@gmail.com

お手数ですが、決済受付機能の再審査をお願いいたします。
```

## Before Sending

- Run `NEXT_PUBLIC_APP_URL=https://beaute-xi.vercel.app npm run preflight`.
- Confirm the production alias points to the latest Vercel deployment.
- Confirm `/commercial`, `/privacy`, `/terms`, and `/pricing` are reachable in a normal browser session.
