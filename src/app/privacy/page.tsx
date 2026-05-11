import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_INFO } from "@/lib/legalInfo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "プライバシーポリシー",
  description: "beautiaのプライバシーポリシーです。顔・メイク写真分析を含む取得情報、利用目的、外部サービス、問い合わせ先を掲載しています。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" eyebrow="PRIVACY" updatedAt={LEGAL_INFO.lastUpdated}>
      <p>
        {LEGAL_INFO.operatorName} は、beautiaの提供に必要な範囲で、ユーザーの個人情報および利用データを取り扱います。
      </p>

      <h2>1. 取得する情報</h2>
      <p>
        メールアドレス、プロフィール情報、肌・髪・その他のメモ、保存商品、使用ログ、画像解析結果、
        商品閲覧やクリックなどの利用イベント、決済管理に必要なStripeの顧客識別情報を取得する場合があります。
      </p>

      <h2>2. 利用目的</h2>
      <p>
        アカウント認証、パーソナル表示、顔・メイク写真分析、成分解析、商品検索、保存・比較、PROプラン管理、
        不正利用防止、サービス改善、問い合わせ対応、分析レポート作成のために利用します。
      </p>

      <h2>3. 外部サービス</h2>
      <p>
        認証・データ保存にSupabase、決済にStripe、AI解析にAnthropic、商品情報取得に楽天API、
        動画情報取得にYouTube APIを利用します。各サービスの範囲でデータが処理される場合があります。
      </p>

      <h2>4. 第三者提供</h2>
      <p>
        法令に基づく場合、ユーザーの同意がある場合、決済・認証・解析などサービス提供に必要な委託先へ提供する場合を除き、
        個人情報を第三者へ販売しません。
      </p>

      <h2>5. 保存期間と削除</h2>
      <p>
        情報は利用目的に必要な期間保存します。アカウント削除やデータ削除の依頼がある場合、
        法令上必要な保存を除き、合理的な範囲で対応します。
      </p>

      <h2>6. セキュリティ</h2>
      <p>
        アクセス制御、認証、通信の暗号化、サーバー側キーの管理など、必要な安全管理措置を講じます。
      </p>

      <h2>7. 問い合わせ</h2>
      <p>
        個人情報の開示、訂正、削除、利用停止、その他問い合わせは、
        <a href={`mailto:${LEGAL_INFO.supportEmail}`}>{LEGAL_INFO.supportEmail}</a> までご連絡ください。
      </p>
    </LegalPage>
  );
}

function LegalPage({
  title,
  eyebrow,
  updatedAt,
  children,
}: {
  title: string;
  eyebrow: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <div className="legal-date">最終更新: {updatedAt}</div>
        <div className="legal-body">{children}</div>
      </div>
    </main>
  );
}
