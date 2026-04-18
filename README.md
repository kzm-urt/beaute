# beauté 💄

> AIがあなたの肌・髪に合った美容アイテムを提案するWebアプリ

## セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# .env.local を編集してキーを入力

# 3. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

## 必要なサービス登録

| サービス | 用途 | URL |
|---|---|---|
| Anthropic | 成分解析AI | https://console.anthropic.com |
| Supabase | DB・認証 | https://supabase.com |
| Stripe | 課金（月額¥680） | https://stripe.com/jp |

## Stripe設定手順

1. Stripeダッシュボードで「製品を追加」
2. 価格: ¥680/月（繰り返し請求）
3. 作成された `price_xxx` をコピーして `STRIPE_PRO_PRICE_ID` に設定

## デプロイ（Vercel推奨）

```bash
# Vercel CLI でデプロイ
npx vercel --prod
```

環境変数はVercelダッシュボードの「Settings > Environment Variables」で設定。

## Claude Code での開発

```bash
# Claude Code 起動
claude

# 例: 次の機能を追加
> Supabase認証を実装して。メール+パスワードのサインアップとログイン。
> Stripe Webhookを実装して。checkout完了時にSupabaseのis_proをtrueにする。
```

詳細は `CLAUDE.md` を参照。
