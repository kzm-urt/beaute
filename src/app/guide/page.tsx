import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata, FAQ_ITEMS } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "使い方",
  description:
    "beautiaの使い方ガイドです。美容商品の探し方、AI顔診断・メイク診断、成分解析、診断後のおすすめコスメ、PROプランの違いをまとめています。",
  path: "/guide",
});

const steps = [
  ["1. 商品を探す", "検索やランキングから、気になる美容商品を見つけます。カテゴリやタグで絞ると、最初の候補を作りやすくなります。"],
  ["2. 保存して比べる", "気になる商品は保存して、価格、レビュー、特徴をあとで見返せるようにします。"],
  ["3. 写真で診断する", "顔・メイク写真分析や成分解析で、印象、黄金比バランス、似合うメイク、注意点を整理します。"],
  ["4. パーソナルに残す", "肌、髪、アレルギーや苦手な成分などをメモしておくと、相談や商品選びに使いやすくなります。"],
];

const routes = [
  ["商品検索", "名前やカテゴリから美容商品を探す", "/?tab=search"],
  ["ランキング", "人気商品をざっと見る", "/?tab=ranking"],
  ["AI顔診断・メイク診断", "写真分析で似合う方向性を見る", "/face-analysis"],
  ["パーソナル", "肌・髪・注意メモを残して相談する", "/?tab=personal"],
  ["料金", "無料とPROの違いを見る", "/pricing"],
];

export default function GuidePage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">GUIDE</div>
        <h1>beautiaの使い方</h1>
        <p className="legal-intro">
          はじめての人向けに、beautiaでできることを短くまとめました。まずは商品を探して、気になるものだけ残していく使い方でOKです。
        </p>

        <div className="legal-body">
          <h2>基本の流れ</h2>
          <div className="legal-table">
            {steps.map(([label, value]) => (
              <div key={label} className="legal-row">
                <div>{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>

          <h2>よく使う入口</h2>
          <div className="legal-link-grid">
            {routes.map(([label, value, href]) => (
              <Link key={href} href={href}>
                {label}
                <br />
                <span>{value}</span>
              </Link>
            ))}
          </div>

          <h2>Q&amp;A</h2>
          <div className="legal-table" id="faq">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="legal-row">
                <div>{item.question}</div>
                <div>{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
