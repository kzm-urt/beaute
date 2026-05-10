import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_INFO } from "@/lib/legalInfo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "料金",
  description:
    "beautiaの料金ページです。無料プランとPROプランの違い、月額料金、無料トライアル、解約方法を掲載しています。",
  path: "/pricing",
});

const planRows = [
  ["料金", "無料", `月額 ${LEGAL_INFO.proPrice}（税込）`],
  ["商品検索・ランキング", "利用できます", "利用できます"],
  ["保存・比較", "基本機能を利用できます", "より深く比較しやすくなります"],
  ["パーソナル相談", "1日3回まで", "1日20回まで"],
  ["肌・髪メモ", "登録できます", "相談や商品選びにより反映しやすくなります"],
  ["成分解析", "基本的な解析", "より細かい見どころを確認しやすくなります"],
];

export default function PricingPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beautia</Link>
        <div className="legal-eyebrow">PRICING</div>
        <h1>料金</h1>
        <p className="legal-intro">
          beautiaは無料でも使えます。PROは、パーソナル相談や記録をもう少し深く使いたい人向けのプランです。
          {LEGAL_INFO.proTrialDays}日間の無料トライアルがあります。
        </p>

        <div className="legal-body">
          <h2>無料とPROの違い</h2>
          <div className="legal-table">
            {planRows.map(([label, free, pro]) => (
              <div key={label} className="legal-row">
                <div>{label}</div>
                <div>
                  FREE: {free}
                  <br />
                  PRO: {pro}
                </div>
              </div>
            ))}
          </div>

          <h2>決済と解約</h2>
          <p>
            決済はStripeで処理されます。解約はアプリ内またはStripeのカスタマーポータルからいつでも行えます。
            解約後も、支払い済み期間の終了まではPRO機能を利用できます。
          </p>

          <div className="legal-link-grid">
            <Link href="/?tab=premium">PROを見る</Link>
            <Link href="/commercial">特商法表記</Link>
            <Link href="/terms">利用規約</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
