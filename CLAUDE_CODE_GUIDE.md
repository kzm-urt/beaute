# Claude Code × beauté 開発ガイド

---

## Claude Code とは

ターミナル（黒い画面）で動くAIアシスタント。
**日本語で指示するだけで、ファイルの作成・編集・コマンド実行まで全部やってくれる。**

claude.ai（ブラウザ）との違い：
- claude.ai → コードを見せてくれるだけ
- Claude Code → **実際にファイルを書いて保存まで自動でやる**

---

## STEP 0｜必要なもの（事前確認）

### Claude のプラン
Claude Code には Pro、Max、Team、Enterprise、または Console アカウントが必要。無料プランでは使えない。

| プラン | 月額 | Claude Code |
|---|---|---|
| Free | ¥0 | ❌ 使えない |
| Pro | $20（約¥3,000） | ✅ 使える |
| Max | $100〜 | ✅ 使える（上限多め） |

→ **まずProプランに加入してから進める**

---

## STEP 1｜Node.js インストール

Claude Code の動作に必要。

### Mac の場合
```bash
# Homebrewがない場合はまず入れる
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js インストール
brew install node

# バージョン確認（18以上ならOK）
node -v
```

### Windows の場合
Windows環境ではインストール前にGit for Windowsのインストールが必要。git-scm.comからダウンロードしてデフォルト設定でインストール後、ターミナルを再起動してからClaude Codeのインストーラーを実行する。

1. https://nodejs.org → 「LTS版」をダウンロードしてインストール
2. https://git-scm.com → Git for Windowsをインストール
3. スタートメニューから「PowerShell」を管理者で開く

---

## STEP 2｜Claude Code インストール

```bash
npm install -g @anthropic-ai/claude-code
```

### デスクトップアプリ版（Mac のみ・ターミナル不要で楽）
公式のクイックスタートページにアクセスして「Download the app」でOSごとのボタンからダウンロードできる。インストールしたら「Claude」アプリを起動して「始める」をクリックして進める。

→ https://code.claude.com からダウンロード

---

## STEP 3｜初回ログイン

```bash
claude
```

初回実行時にブラウザが自動で開き、Claudeアカウントでのログインを求められる。ブラウザでログインすれば認証完了。ターミナルに戻るとそのままClaude Codeを使い始められる。

ログイン画面で選ぶもの：
```
> 1. Claude account with subscription  ← これを選ぶ（Proプラン）
  2. Anthropic Console account
```

---

## STEP 4｜beauté プロジェクトのセットアップ

```bash
# 1. ZIPを解凍してフォルダに入る
cd beaute

# 2. 依存関係インストール
npm install

# 3. 環境変数ファイルを作成
cp .env.example .env.local
```

### .env.local を編集する（最低限これだけ）
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx   ← Anthropic ConsoleからAPIキーをコピー
```

APIキーの取得場所：https://console.anthropic.com/settings/keys

### 開発サーバー起動
```bash
npm run dev
# → ブラウザで http://localhost:3000 を開く
```

---

## STEP 5｜Claude Code でビルドする

プロジェクトフォルダの中でClaudeを起動：

```bash
cd beaute
claude
```

ホームディレクトリでclaudeを実行してしまうと警告が出る。必ずプロジェクトのフォルダに入ってから起動する。

---

## 実際の開発の流れ（指示例）

### 🔰 基本の使い方
日本語でそのまま話しかけるだけ。

```
> このアプリのホーム画面を見て、説明して

> SearchTabにもっと多くのタグフィルターを追加して

> 製品カードのデザインをもっとリッチにして
```

### 🔨 次に実装すべき機能（コピペして使う）

**① Supabase認証を追加する**
```
CLAUDE.mdを読んで。
Supabaseのメール認証を実装して。
・サインアップページ（/signup）
・ログインページ（/login）
・BeauteApp.tsx でログイン状態を管理
・useProfile.ts をlocalStorageからSupabaseのDBに移行
```

**② Stripe課金を本番対応にする**
```
CLAUDE.mdを読んで。
Stripe Webhookを実装して。
・src/app/api/stripe/webhook/route.ts を作成
・checkout.session.completed でSupabaseのis_proをtrueに更新
・ユーザーのサブスク状態をDBで管理できるようにして
```

**③ 成分解析の月3回制限を実装する**
```
AnalyzeTab.tsx の成分解析に使用回数制限を追加して。
・無料ユーザーは月3回まで
・Supabaseのanalyze_usageテーブルで管理
・残り回数をUIに表示
```

**④ 製品データをDBに移す**
```
現在constants.tsにハードコードされている製品30件を
Supabaseのproductsテーブルに移して。
SearchTabをAPIルート経由のフェッチに切り替えて。
```

**⑤ PWA化（ホーム画面に追加できるようにする）**
```
このWebアプリをPWA化して。
・public/manifest.json を作成
・next.config.js に設定追加
・ホーム画面への追加を促すバナーをBeauteApp.tsxに追加
```

---

## よく使うコマンド

| コマンド | 意味 |
|---|---|
| `claude` | Claude Code起動 |
| `/help` | コマンド一覧を見る |
| `/cost` | 今セッションでかかったAPI料金を確認 |
| `/plan` | 実行する前に計画を確認（大事な変更前に使う） |
| `/clear` | 会話をリセット（コンテキストが重くなったとき） |
| `Ctrl + C` | 処理を止める |
| `Escape` | 入力をキャンセル |

---

## Vercel にデプロイする（公開する）

```bash
# Vercel CLIインストール
npm install -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

デプロイ後、Vercelダッシュボードで環境変数を設定：
- Settings → Environment Variables
- .env.local の内容をそのまま入力

---

## トラブルシューティング

**「claudeが見つかりません」と出る**
```bash
# PATHを通す（Mac）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**npm install でエラーが出る**
```bash
node -v   # 18以上か確認
npm -v    # 8以上か確認
```

**APIキーエラーが出る**
- `.env.local` に `ANTHROPIC_API_KEY=` が正しく入っているか確認
- console.anthropic.com でキーが有効か確認

---

## コスト感（参考）

セッションの使用コストは `/cost` コマンドで確認できる。API従量課金の場合、終了時にトークン数と課金状況が表示される。

Proプラン（月$20）で使う場合の目安：
- 軽い修正・質問：ほぼ減らない
- 新機能1つ実装：数〜十数分のセッション
- 大規模リファクタ：セッション上限に注意

**節約のコツ：機能ごとに `/clear` でリセットする**
