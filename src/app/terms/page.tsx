import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約",
  description: "beauté の利用規約です。",
};

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" updatedAt="2026年5月2日">
      <p>
        本規約は、beauté が提供する美容レコメンド、成分解析、商品検索、ログ保存、PROプランに関する利用条件を定めるものです。
      </p>
      <h2>1. サービス内容</h2>
      <p>
        beauté は、ユーザーが入力したプロフィール、使用ログ、保存商品、画像解析結果などをもとに、美容商品の候補や関連情報を表示します。表示内容は参考情報であり、効果や適合性を保証するものではありません。
      </p>
      <h2>2. アカウント</h2>
      <p>
        ユーザーは、正確な情報でアカウントを作成し、ログイン情報を自身の責任で管理するものとします。不正利用が疑われる場合、運営者は利用を制限することがあります。
      </p>
      <h2>3. PROプラン</h2>
      <p>
        PROプランは月額課金の有料機能です。決済、請求、解約は Stripe の仕組みにより処理されます。無料トライアルや価格はアプリ内表示に従います。
      </p>
      <h2>4. 商品リンク</h2>
      <p>
        楽天市場など外部サイトへのリンクにはアフィリエイトリンクが含まれる場合があります。購入、配送、返品、問い合わせは遷移先サイトの条件に従います。
      </p>
      <h2>5. 禁止事項</h2>
      <p>
        法令違反、第三者の権利侵害、不正アクセス、サービス運営を妨げる行為、解析機能の過度な自動利用を禁止します。
      </p>
      <h2>6. 免責</h2>
      <p>
        成分解析やおすすめはAIを含むシステムにより生成されるため、誤りを含む場合があります。医療判断、治療、アレルギー判断が必要な場合は専門家に相談してください。
      </p>
      <h2>7. 規約変更</h2>
      <p>
        運営者は、必要に応じて本規約を変更できます。重要な変更はアプリ内または適切な方法で告知します。
      </p>
    </LegalPage>
  );
}

function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link href="/" className="legal-back">beauté</Link>
        <div className="legal-eyebrow">LEGAL</div>
        <h1>{title}</h1>
        <div className="legal-date">最終更新: {updatedAt}</div>
        <div className="legal-body">{children}</div>
      </div>
    </main>
  );
}
