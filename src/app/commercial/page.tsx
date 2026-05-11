import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_INFO } from "@/lib/legalInfo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "特定商取引法に基づく表記",
  description: "beautiaの特定商取引法に基づく表記です。販売事業者、サービス内容、料金、決済、解約、返金条件を掲載しています。",
  path: "/commercial",
});

const rows = [
  ["販売事業者", LEGAL_INFO.operatorName],
  ["運営責任者", LEGAL_INFO.representativeName],
  ["所在地", LEGAL_INFO.address],
  ["電話番号", LEGAL_INFO.phone],
  ["メールアドレス", LEGAL_INFO.supportEmail],
  ["販売URL", LEGAL_INFO.siteUrl],
  [
    "サービス内容",
    "beautia PROプラン。美容商品の検索、保存、比較、顔・メイク写真分析、成分解析、使用ログ、パーソナル相談、楽天商品リンクなどを利用できるデジタルサービスです。",
  ],
  ["販売価格", `PROプラン: 月額 ${LEGAL_INFO.proPrice}（税込）`],
  ["商品代金以外の必要料金", "インターネット接続料金、通信料金等はユーザーの負担となります。"],
  ["支払方法", "クレジットカード決済など、Stripe が提供する決済方法"],
  [
    "支払時期",
    `${LEGAL_INFO.proTrialDays}日間の無料トライアル終了後、または申込時に表示される条件に従い課金されます。以後、契約期間ごとに請求されます。`,
  ],
  ["サービス提供時期", "決済完了後、または無料トライアル開始後、直ちに利用できます。"],
  [
    "解約",
    "アプリ内またはStripeのカスタマーポータルからいつでも解約できます。解約後も、支払い済み期間の終了まではPRO機能を利用できます。",
  ],
  [
    "返品・キャンセル",
    "デジタルサービスの性質上、決済完了後の返金は原則として受け付けません。ただし、法令上必要な場合または当方に重大な不備がある場合は個別に対応します。",
  ],
  [
    "動作環境",
    "最新版の主要ブラウザ（Chrome、Safari、Edge など）での利用を推奨します。",
  ],
  [
    "外部商品について",
    "楽天市場など外部サイトの商品購入、配送、返品、問い合わせは、遷移先サイトの条件に従います。beautiaは商品販売者ではなく、商品情報の検索・比較補助を提供します。",
  ],
  [
    "表現および商品効果について",
    "美容情報、顔・メイク写真分析、解析結果、パーソナル相談は参考情報です。本人識別、特定の効果、適合性、医療的効能を保証するものではありません。",
  ],
];

export default function CommercialPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">COMMERCE DISCLOSURE</div>
        <h1>特定商取引法に基づく表記</h1>
        <div className="legal-date">最終更新: {LEGAL_INFO.lastUpdated}</div>
        <p className="legal-intro">
          beautiaの有料サービスに関する表示です。ご不明点はメールにてお問い合わせください。
        </p>
        <div className="legal-table">
          {rows.map(([label, value]) => (
            <div key={label} className="legal-row">
              <div>{label}</div>
              <div>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
