import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_INFO } from "@/lib/legalInfo";

export const metadata: Metadata = {
  title: "beautiaについて",
  description: "beautia は、iRiseが提供するパーソナル美容サーチです。サービス内容、料金、運営者情報を掲載しています。",
};

const features = [
  ["商品検索・ランキング", "楽天市場の商品情報をもとに、美容カテゴリごとの商品を探せます。"],
  ["保存・比較", "気になる商品を保存し、価格、レビュー、特徴をあとで比較できます。"],
  ["成分解析", "化粧品や美容商品の成分表示を読み取り、注意点や見どころを整理します。"],
  ["美容ログ", "使った商品や肌・髪の状態を記録し、次の商品選びに活かせます。"],
  ["パーソナル相談", "登録した肌・髪・注意メモをもとに、日々の美容相談ができます。"],
];

export default function AboutPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">ABOUT SERVICE</div>
        <h1>beautiaについて</h1>
        <div className="legal-date">最終更新: {LEGAL_INFO.lastUpdated}</div>
        <div className="legal-body">
          <p>
            beautiaは、{LEGAL_INFO.operatorName} が運営するパーソナル美容サーチです。
            美容商品を探し、気になる商品を保存し、成分や使用感を少しずつ自分の記録にしていくためのWebサービスです。
          </p>

          <h2>提供しているサービス</h2>
          <div className="legal-table">
            {features.map(([label, value]) => (
              <div key={label} className="legal-row">
                <div>{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>

          <h2>料金</h2>
          <p>
            無料プランは ¥0 で利用できます。PROプランは月額 {LEGAL_INFO.proPrice}（税込）で、
            {LEGAL_INFO.proTrialDays}日間の無料トライアルがあります。決済はStripeを通じて安全に処理されます。
          </p>

          <h2>運営者</h2>
          <p>
            運営者は {LEGAL_INFO.operatorName} です。取引条件や問い合わせ先は
            <Link href="/commercial"> 特定商取引法に基づく表記 </Link>
            に掲載しています。
          </p>

          <div className="legal-link-grid">
            <Link href="/commercial">特定商取引法に基づく表記</Link>
            <Link href="/terms">利用規約</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
            <Link href="/feedback">問い合わせ</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
