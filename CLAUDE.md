# beauté — Claude Code 開発ガイド

## プロジェクト概要
AI美容提案Webアプリ。8カテゴリ・30製品、成分写真解析（Claude API）、Stripe課金（月額¥680）。

## 技術スタック
- **フレームワーク**: Next.js 14 App Router
- **スタイリング**: Tailwind CSS
- **DB / Auth**: Supabase
- **決済**: Stripe（RevenueCatではなくStripe直）
- **AI**: Anthropic Claude API（成分解析）

## ディレクトリ構成
```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   ← Claude API 成分解析
│   │   └── stripe/route.ts    ← Stripe Checkout セッション作成
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/index.tsx            ← 共通UIコンポーネント
│   └── features/
│       ├── BeauteApp.tsx       ← メインアプリ（タブ管理）
│       ├── ProfileScreen.tsx   ← 初回プロフィール設定
│       ├── HomeTab.tsx         ← ホーム（おすすめ・動画・カテゴリ）
│       ├── SearchTab.tsx       ← 検索・フィルター
│       ├── AnalyzeTab.tsx      ← 成分解析（画像→Claude API）
│       ├── LogTab.tsx          ← 使用ログ（localStorage）
│       ├── PremiumTab.tsx      ← プラン比較・Stripe連携
│       └── ProductCard.tsx     ← 製品カード
├── hooks/
│   └── useProfile.ts           ← プロフィールのlocalStorage管理
├── lib/
│   ├── constants.ts            ← 全製品データ・カテゴリ定義
│   ├── supabase.ts
│   ├── stripe.ts
│   └── utils.ts
└── types/index.ts              ← 共通型定義
```

## デザイン規約
- カラー: `#F8F4EF`(bg) / `#150B00`(text) / `#A8722A`(gold) / `#D4A853`(goldLight)
- フォント: 見出し→ Cormorant Garamond（serif italic）/ 本文→ Hiragino Kaku Gothic ProN
- ボトムナビ: `#1A0E08`（ダークブラウン）、アクティブは `#D4A853`
- カード: `rounded-[16px]` + `border border-[#EDE5DC]` + shadow

## 環境変数（.env.local）
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 次に実装すべきこと（優先順）

### 1. Supabase Auth（メール認証）
- `src/app/api/auth/` にサインアップ・ログインAPIを追加
- `useProfile` をlocalStorageからSupabaseのDBに移行
- `LogTab` のログもSupabaseに保存（`log_entries`テーブル）

### 2. Stripe Webhook
- `src/app/api/stripe/webhook/route.ts` を作成
- `checkout.session.completed` イベントで isPro フラグをSupabaseに保存
- ユーザーのサブスク状態をDBで管理

### 3. 製品データのDB化
- 現在 `constants.ts` にハードコードされている製品データをSupabaseに移す
- `products`テーブル設計: id, cat, sub, name, brand, price, rating, rev, free, desc, tags[], video_title, video_views, video_url
- SearchTabをAPIルート経由のフェッチに切り替え

### 4. 成分解析の使用回数制限
- Supabaseの `analyze_usage`テーブルで月ごとの使用回数を管理
- `/api/analyze` でユーザーIDと使用回数をチェック

### 5. PWA化
- `public/manifest.json` 追加
- `next.config.js` に PWA設定追加
- ホーム画面追加を促すバナー表示

## Supabaseテーブル設計（SQL）
```sql
-- ユーザープロフィール
create table profiles (
  id uuid references auth.users primary key,
  age text,
  skin_type text,
  hair_type text,
  concerns text[],
  is_pro boolean default false,
  stripe_customer_id text,
  updated_at timestamptz default now()
);

-- 使用ログ
create table log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  product_name text not null,
  category text not null,
  rating int check (rating between 1 and 5),
  memo text,
  started_at date,
  created_at timestamptz default now()
);

-- 成分解析使用回数（月別）
create table analyze_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  year_month text not null,  -- "2025-04"
  count int default 1,
  unique(user_id, year_month)
);
```
