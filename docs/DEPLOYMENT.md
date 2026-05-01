# Deployment

最短でオンライン公開するための手順です。

## 1. Vercel に接続

GitHub リポジトリ:

```text
https://github.com/kzm-urt/beaute
```

Vercel で `New Project` からこのリポジトリを選び、Framework Preset は `Next.js` のままでデプロイします。

## 2. Production Environment Variables

Vercel の Project Settings > Environment Variables に以下を設定します。

```text
ANTHROPIC_API_KEY=
ANTHROPIC_INPUT_USD_PER_MTOK=5
ANTHROPIC_OUTPUT_USD_PER_MTOK=25
API_COST_USD_JPY_RATE=155

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_ADMIN_EMAILS=zerosaki20000119@gmail.com,uratyokaityo@icloud.com

RAKUTEN_APPLICATION_ID=
RAKUTEN_ACCESS_KEY=
NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=
RAKUTEN_REQUEST_ORIGIN=https://YOUR_DOMAIN
RAKUTEN_AFFILIATE_RATE=0.04
RAKUTEN_AFFILIATE_REWARD_CAP_JPY=1000
```

`YOUR_DOMAIN` は Vercel の発行URLまたは独自ドメインに置き換えます。

## 3. Supabase

Supabase SQL Editor で以下を実行済みにします。

```text
supabase/schema.sql
```

Authentication > URL Configuration:

- Site URL: `https://YOUR_DOMAIN`
- Redirect URLs:
  - `https://YOUR_DOMAIN`
  - `https://YOUR_DOMAIN/reset-password`

## 4. Stripe

Stripe Dashboard:

- Checkout/Customer Portal を利用可能にする
- Webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`
- Webhook events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

## 5. Rakuten

楽天Web Service のアプリ設定で、リクエスト元または許可URLに本番URLを登録します。

```text
https://YOUR_DOMAIN
```

その値を Vercel の `RAKUTEN_REQUEST_ORIGIN` にも設定します。

## 6. 公開前に差し替える情報

以下のページは公開前に実情報へ差し替えます。

```text
/commercial
```

必要な項目:

- 販売事業者
- 運営責任者
- 所在地
- お問い合わせ先

## 7. Deploy Gate

ローカル:

```bash
npm run typecheck
npm run lint
npm run build
npm run preflight
```

本番URL:

```text
https://YOUR_DOMAIN/admin/status
https://YOUR_DOMAIN/admin/analytics
```

管理者でログインし、`/admin/status` の `未対応` を消します。
