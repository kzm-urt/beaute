import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_RULES } from "@/lib/plan";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "beauté の特定商取引法に基づく表記です。",
};

const rows = [
  ["販売事業者", "公開前に運営者名を記載してください"],
  ["運営責任者", "公開前に責任者名を記載してください"],
  ["所在地", "公開前に所在地を記載してください"],
  ["お問い合わせ先", "公開前にサポートメールアドレスを記載してください"],
  ["販売価格", `PROプラン: 月額 ${PLAN_RULES.pro.priceLabel}`],
  ["商品代金以外の必要料金", "インターネット接続料金、通信料金はユーザー負担です。"],
  ["支払方法", "クレジットカード決済など Stripe が提供する決済方法"],
  ["支払時期", "無料トライアル終了後、または申込時に月額課金が開始されます。以後、契約期間ごとに請求されます。"],
  ["役務の提供時期", "決済完了後、PRO機能を利用できます。"],
  ["解約", "アプリ内のカスタマーポータルからいつでも解約できます。解約後も請求済み期間の終了まではPRO機能を利用できます。"],
  ["返品・キャンセル", "デジタルサービスの性質上、決済完了後の返金は原則として受け付けません。"],
];

export default function CommercialPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beauté</Link>
        <div className="legal-eyebrow">COMMERCE</div>
        <h1>特定商取引法に基づく表記</h1>
        <div className="legal-date">最終更新: 2026年5月2日</div>
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
