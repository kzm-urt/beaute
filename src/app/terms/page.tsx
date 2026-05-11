import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_INFO } from "@/lib/legalInfo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "利用規約",
  description: "beautiaの利用規約です。AI顔診断・メイク診断、写真分析、PROプラン、外部商品リンク、禁止事項を掲載しています。",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" eyebrow="TERMS" updatedAt={LEGAL_INFO.lastUpdated}>
      <p>
        本規約は、{LEGAL_INFO.operatorName} が提供する「beautia」の利用条件を定めるものです。
        beautiaは、美容商品の検索、保存、比較、顔・メイク写真分析、成分解析、使用ログ、パーソナル相談などを提供するデジタルサービスです。
      </p>

      <h2>1. サービス内容</h2>
      <p>
        beautiaは、ユーザーが入力したプロフィール、保存商品、使用ログ、画像解析結果などをもとに、美容商品に関する参考情報を表示します。
        表示内容は参考情報であり、本人識別、医療診断、効果、適合性、医療的効能を保証するものではありません。
      </p>

      <h2>2. アカウント</h2>
      <p>
        保存、ログ、パーソナル相談など一部機能の利用にはアカウント登録が必要です。
        ユーザーは正確な情報を登録し、ログイン情報を自己の責任で管理するものとします。
      </p>

      <h2>3. PROプラン</h2>
      <p>
        PROプランは月額 {LEGAL_INFO.proPrice}（税込）の有料サービスです。
        {LEGAL_INFO.proTrialDays}日間の無料トライアル後、または申込時に表示される条件に従って課金されます。
        支払い、請求、解約はStripeの仕組みにより処理されます。
      </p>

      <h2>4. 外部商品リンク</h2>
      <p>
        楽天市場など外部サイトへのリンクには、アフィリエイトリンクが含まれる場合があります。
        外部サイトでの商品購入、配送、返品、問い合わせは、遷移先サイトの条件に従います。
      </p>

      <h2>5. 禁止事項</h2>
      <p>
        法令または公序良俗に反する行為、第三者の権利を侵害する行為、不正アクセス、
        サービス運営を妨げる行為、解析機能や相談機能の過度な自動利用を禁止します。
      </p>

      <h2>6. 免責</h2>
      <p>
        beautiaの表示内容にはAIによる生成や外部データが含まれるため、誤りや更新遅れが生じる場合があります。
        医療判断、治療、アレルギー判断が必要な場合は、医師や専門家へ相談してください。
      </p>

      <h2>7. 規約の変更</h2>
      <p>
        当方は、必要に応じて本規約を変更できます。重要な変更がある場合は、アプリ内または適切な方法で告知します。
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
