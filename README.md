# beautia

AI成分解析、楽天商品検索/ランキング、美容ログ、パーソナルおすすめ、FREE/PRO課金をまとめた美容レコメンドアプリです。

## 起動

```bash
npm install
npm run dev:3001
```

ローカルURL:

- アプリ: http://localhost:3001
- リリース状態確認: http://localhost:3001/admin/status
- 商品/PRO導線・API費用・楽天報酬分析: http://localhost:3001/admin/analytics

通常のNext.jsデフォルトポートで起動する場合は `npm run dev` を使えます。その場合は `.env.local` の `NEXT_PUBLIC_APP_URL` も `http://localhost:3000` に合わせてください。

## 環境変数

`.env.example` を `.env.local` にコピーして設定します。

```bash
cp .env.example .env.local
```

主要な設定:

- `ANTHROPIC_API_KEY`: 成分解析AI
- `ANTHROPIC_INPUT_USD_PER_MTOK`: API費用見積もり用の入力単価。未設定時は5
- `ANTHROPIC_OUTPUT_USD_PER_MTOK`: API費用見積もり用の出力単価。未設定時は25
- `API_COST_USD_JPY_RATE`: API費用の円換算レート。未設定時は155
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: APIルートからの安全なDB操作
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PRO_PRICE_ID`: PRO月額プランのPrice ID
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook署名シークレット
- `NEXT_PUBLIC_APP_URL`: Checkout後の戻り先URL
- `NEXT_PUBLIC_ADMIN_EMAILS`: 管理者メール。カンマ区切り
- `RAKUTEN_APPLICATION_ID`: 楽天Web Service application ID
- `RAKUTEN_ACCESS_KEY`: 楽天Web Service access key
- `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイトID
- `RAKUTEN_REQUEST_ORIGIN`: 楽天アプリに登録した本番URL
- `RAKUTEN_AFFILIATE_RATE`: 楽天報酬見込みの料率。未設定時は0.04
- `RAKUTEN_AFFILIATE_REWARD_CAP_JPY`: 楽天報酬見込みの1商品上限。未設定時は1000

## Supabase

`supabase/schema.sql` を Supabase Dashboard の SQL Editor で実行します。

現在使うテーブル:

- `profiles`
- `log_entries`
- `analyze_usage`
- `analysis_entries`
- `product_saves`
- `product_events`
- `api_usage_events`

ログ追加、解析回数、解析履歴、お気に入り/比較リストはAPIルート経由で制限を守る設計です。
商品詳細、ロック商品クリック、楽天購入クリック、PROクリックは `product_events` に保存されます。
成分解析、楽天商品取得、YouTube動画取得の利用ログは `api_usage_events` に保存され、管理アナリティクスで費用見込みを表示します。

## Stripe

PROプラン:

- 月額: `¥500`
- 無料トライアル: 7日

必要なStripe設定:

- 月額サブスクのPrice IDを `STRIPE_PRO_PRICE_ID` に設定
- Webhook URL: `/api/stripe/webhook`
- Webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Billing Customer Portalを有効化

## 楽天

商品検索とランキングは楽天APIから取得します。

確認URL:

- 検索: `/api/products?limit=30`
- ランキング: `/api/products?mode=ranking&page=1`
- デバッグ: `/api/debug-rakuten`

楽天APIのOrigin制限に合わせるため、本番では `RAKUTEN_REQUEST_ORIGIN` を実際の公開URLに合わせてください。

## リリース前チェック

管理者でログイン後、以下を開きます。

```text
http://localhost:3001/admin/status
```

確認できること:

- 必須環境変数
- Supabaseテーブル/カラム
- Stripe Price/Webhook設定
- 楽天検索/ランキングAPI
- `NEXT_PUBLIC_APP_URL` と現在の起動URLの一致

商品/PRO導線、API費用、楽天報酬見込みは以下で確認します。

```text
http://localhost:3001/admin/analytics
```

作業引き継ぎと手動QAは [docs/HANDOFF.md](docs/HANDOFF.md) にまとめています。
公開手順は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) にまとめています。

## 検証コマンド

```bash
npx tsc --noEmit --pretty false
npm run build
```

まとめて確認する場合:

```bash
npm run verify
```

ローカルサーバー起動中に主要APIと管理画面を確認する場合:

```bash
npm run preflight
```

PowerShellで日本語が崩れる場合:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```
