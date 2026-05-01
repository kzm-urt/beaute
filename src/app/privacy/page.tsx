import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "beauté のプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" updatedAt="2026年5月2日">
      <p>
        beauté は、ユーザーの美容体験を改善するために必要な範囲で個人情報および利用データを取り扱います。
      </p>
      <h2>1. 取得する情報</h2>
      <p>
        メールアドレス、プロフィール情報、肌質・髪質・悩み、成分解析画像、解析結果、使用ログ、保存商品、比較リスト、商品閲覧やクリックなどのイベント情報を取得する場合があります。
      </p>
      <h2>2. 利用目的</h2>
      <p>
        アカウント認証、成分解析、パーソナルおすすめ、PROプラン管理、不正利用防止、サービス改善、問い合わせ対応、分析レポート作成に利用します。
      </p>
      <h2>3. 外部サービス</h2>
      <p>
        認証・データ保存に Supabase、決済に Stripe、AI解析に Anthropic、商品情報に楽天API、動画情報に YouTube API を利用します。各サービスの範囲でデータが処理される場合があります。
      </p>
      <h2>4. 第三者提供</h2>
      <p>
        法令に基づく場合、ユーザーの同意がある場合、決済・認証・解析などサービス提供に必要な委託先へ提供する場合を除き、個人情報を第三者へ販売しません。
      </p>
      <h2>5. 保存期間と削除</h2>
      <p>
        情報は利用目的に必要な期間保存します。アカウント削除やデータ削除の依頼がある場合、法令上必要な保存を除き、合理的な範囲で対応します。
      </p>
      <h2>6. セキュリティ</h2>
      <p>
        アクセス制御、認証、通信の暗号化、サービスロールキーのサーバー管理など、必要な安全管理措置を講じます。
      </p>
      <h2>7. 問い合わせ</h2>
      <p>
        公開前に運営者の問い合わせ先を設定してください。問い合わせ先は特定商取引法に基づく表記ページにも掲載します。
      </p>
    </LegalPage>
  );
}

function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beauté</Link>
        <div className="legal-eyebrow">PRIVACY</div>
        <h1>{title}</h1>
        <div className="legal-date">最終更新: {updatedAt}</div>
        <div className="legal-body">{children}</div>
      </div>
    </main>
  );
}
