import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata, safeJsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "AI顔診断・メイク診断",
  description:
    "beautiaのAI顔診断・メイク診断。顔写真から印象、黄金比バランス、似合うメイク、パーソナルカラーのヒント、診断後のおすすめコスメを整理します。",
  path: "/face-analysis",
});

const reportItems = [
  ["総合印象", "写真から伝わる雰囲気、透明感、上品さ、親しみやすさなどを短く整理します。"],
  ["顔タイプ推定", "直線・曲線、ソフト・シャープなど、メイクや髪型選びに使いやすい言葉でまとめます。"],
  ["黄金比バランス", "目元、眉、顔全体のバランスを、写真の角度や光をふまえて参考情報として表示します。"],
  ["似合う色・避けたい色", "パーソナルカラーのヒントとして、得意な色と重く見えやすい色を提案します。"],
  ["髪型・服装の方向性", "前髪、ツヤ、シルエット、服の雰囲気など、すぐ試しやすい提案を出します。"],
  ["おすすめコスメ", "診断結果に近いベースメイク、リップ、チーク、アイメイク、ヘアケアを表示します。"],
];

const useCases = [
  "自分に似合うメイクの方向性を知りたい",
  "SNSで共有しやすい顔診断レポートを作りたい",
  "パーソナルカラーや顔タイプをコスメ選びのヒントにしたい",
  "診断後にそのままおすすめコスメを見たい",
];

const faqs = [
  {
    q: "顔診断は医療的な診断ですか？",
    a: "いいえ。beautiaの顔・メイク写真分析は美容の参考情報です。本人識別、医療診断、効果保証を行うものではありません。",
  },
  {
    q: "無料で使えますか？",
    a: "無料会員は週1回まで写真分析を使えます。PROでは回数制限なく、診断や履歴をより使いやすくできます。",
  },
  {
    q: "診断後にコスメも見られますか？",
    a: "はい。診断結果のキーワードに近いメイク、スキンケア、ヘアケア商品をアプリ内の商品データから表示します。",
  },
];

export default function FaceAnalysisPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_URL}/face-analysis#webpage`,
      name: "AI顔診断・メイク診断",
      url: `${SITE_URL}/face-analysis`,
      inLanguage: "ja-JP",
      description:
        "顔写真から印象、黄金比バランス、似合うメイク、診断後のおすすめコスメを整理するbeautiaの写真分析機能です。",
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}/face-analysis#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <main className="legal-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">AI FACE & MAKEUP ANALYSIS</div>
        <h1>AI顔診断・メイク診断</h1>
        <p className="legal-intro">
          顔写真から、顔立ちの印象、黄金比バランス、似合うメイク、色の方向性、診断後のおすすめコスメをまとめて確認できます。
          SNSで共有しやすいレポートとしても使いやすい診断です。
        </p>

        <div className="legal-body">
          <h2>診断レポートで分かること</h2>
          <div className="legal-table">
            {reportItems.map(([label, value]) => (
              <div key={label} className="legal-row">
                <div>{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>

          <h2>こんな人におすすめ</h2>
          <ul>
            {useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>写真分析からコスメ提案まで</h2>
          <p>
            beautiaでは、顔診断・メイク診断の結果をその場で終わらせず、ベースメイク、リップ、チーク、アイメイク、
            ヘアケアなどのおすすめコスメにつなげます。診断結果を保存しておくと、あとから見返しながら商品選びができます。
          </p>

          <h2>注意事項</h2>
          <p>
            写真分析は、撮影角度、光、表情、メイク状態によって結果が変わります。医療的な診断や効果保証ではなく、
            美容・コスメ選びの参考情報としてご利用ください。
          </p>

          <h2>Q&amp;A</h2>
          <div className="legal-table" id="faq">
            {faqs.map((item) => (
              <div key={item.q} className="legal-row">
                <div>{item.q}</div>
                <div>{item.a}</div>
              </div>
            ))}
          </div>

          <div className="legal-link-grid">
            <Link href="/?tab=analyze">写真分析を始める</Link>
            <Link href="/guide">使い方を見る</Link>
            <Link href="/pricing">無料とPROの違い</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
