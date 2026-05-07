"use client";

import { Icon } from "@/components/ui";

interface Props {
  isGuest: boolean;
  isPro: boolean;
  onAuth: () => void;
  onUpgrade: (sourceArea?: string) => void;
  onGoSearch: () => void;
  onGoRanking: () => void;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
}

const steps = [
  {
    no: "01",
    title: "まずは商品を見る",
    body: "検索とランキングで楽天の商品を眺めます。ゲストでもここまではすぐ使えます。",
    cta: "商品を探す",
    action: "search",
  },
  {
    no: "02",
    title: "気になるものを保存する",
    body: "候補をお気に入り・比較に分けて、あとから迷わず見返せる状態にします。",
    cta: "保存リストへ",
    action: "saved",
  },
  {
    no: "03",
    title: "カルテを育てる",
    body: "性別、肌・髪、悩み、使っている製品、欲しい成分、習慣を入れるほど提案が鋭くなります。",
    cta: "カルテを見る",
    action: "karte",
  },
  {
    no: "04",
    title: "買う前に判定する",
    body: "成分解析、レビュー量、価格、動画、あなた向けの理由を合わせて買うか決めます。",
    cta: "成分解析へ",
    action: "analyze",
  },
] as const;

const planRows = [
  { label: "商品検索・ランキング", guest: "閲覧OK", free: "閲覧OK", pro: "全商品を深掘り" },
  { label: "保存・比較", guest: "登録が必要", free: "基本枠あり", pro: "候補を多く残せる" },
  { label: "成分解析", guest: "登録が必要", free: "月3回", pro: "無制限" },
  { label: "カルテ・美容ログ", guest: "サンプル閲覧", free: "記録OK", pro: "おすすめ精度に反映" },
  { label: "購入リンク", guest: "一部のみ", free: "FREE商品中心", pro: "全商品で開放" },
] as const;

const signals = ["性別", "年代", "肌タイプ", "髪タイプ", "悩み", "使用中の製品", "欲しい成分", "生活習慣", "今の状態"];

const routines = [
  { label: "初日", body: "ランキングを見て、3つ保存。カルテに肌・髪・悩みを登録。" },
  { label: "買う前", body: "商品詳細で相性理由、注意点、レビュー量、動画を確認。" },
  { label: "週1回", body: "美容ログに使用感を残して、合わない理由と良かった理由を蓄積。" },
  { label: "月1回", body: "成分解析と保存リストを見直して、次に買う候補を整理。" },
] as const;

export default function GuideTab({
  isGuest,
  isPro,
  onAuth,
  onUpgrade,
  onGoSearch,
  onGoRanking,
  onGoKarte,
  onGoAnalyze,
  onGoSaved,
  onGoLog,
}: Props) {
  const runAction = (action: (typeof steps)[number]["action"]) => {
    if (action === "search") onGoSearch();
    if (action === "saved") isGuest ? onAuth() : onGoSaved();
    if (action === "karte") isGuest ? onAuth() : onGoKarte();
    if (action === "analyze") isGuest ? onAuth() : onGoAnalyze();
  };

  return (
    <div className="guide-tab motion-fade-scale">
      <section className="guide-hero section-shell mobile-tight">
        <div className="guide-hero-copy motion-reveal">
          <p className="guide-eyebrow">BEAUTE START GUIDE</p>
          <h1>使い方が分かると、買う理由まで見えてくる。</h1>
          <p className="guide-lead">
            beauteは、楽天の商品情報をただ並べるだけではなく、あなたのカルテ・成分解析・保存リスト・美容ログをつないで「次に何を選ぶか」を決めるための美容サーチです。
          </p>
          <div className="guide-hero-actions">
            <button className="guide-primary motion-cta" onClick={isGuest ? onAuth : onGoKarte}>
              {isGuest ? "無料登録してカルテを作る" : "カルテを育てる"}
            </button>
            <button className="guide-secondary motion-nav-button" onClick={onGoSearch}>
              商品を探す
            </button>
          </div>
        </div>
        <div className="guide-hero-panel motion-reveal-slow">
          <div>
            <span>今やること</span>
            <strong>{isPro ? "ログを残して精度を上げる" : isGuest ? "まず3商品を見てみる" : "保存と解析をつなげる"}</strong>
            <p>{isPro ? "買った後の使用感まで残すと、次のおすすめがさらにパーソナルになります。" : "最初はランキングから入り、気になる商品を保存するだけで十分です。"}</p>
          </div>
          <div className="guide-mini-metrics">
            <div><b>3</b><span>分で開始</span></div>
            <div><b>9</b><span>カルテ信号</span></div>
            <div><b>PRO</b><span>全商品開放</span></div>
          </div>
        </div>
      </section>

      <section className="guide-section section-shell mobile-tight">
        <div className="guide-section-head">
          <p className="guide-eyebrow">FLOW</p>
          <h2>基本の流れ</h2>
          <button className="guide-link-button motion-nav-button" onClick={onGoRanking}>
            ランキングから始める
          </button>
        </div>
        <div className="guide-step-grid">
          {steps.map((step) => (
            <article className="guide-step motion-card" key={step.no}>
              <span>{step.no}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <button onClick={() => runAction(step.action)}>
                {isGuest && step.action !== "search" ? "無料登録して使う" : step.cta}
                <Icon name="arrow" size={15} sw={2} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section guide-personal-section section-shell mobile-tight">
        <div className="guide-personal-copy">
          <p className="guide-eyebrow">PERSONAL ENGINE</p>
          <h2>カルテは、あなた専用の美容OS。</h2>
          <p>
            性別や肌質だけでは弱いので、beauteでは「今使っている製品」「どんな状態か」「欲しい成分」「続けられる習慣」まで見ます。商品を保存し、解析し、ログに残すほど、買う前の判定が自分向けになります。
          </p>
          <div className="guide-hero-actions">
            <button className="guide-primary motion-cta" onClick={isGuest ? onAuth : onGoKarte}>
              {isGuest ? "無料登録して始める" : "カルテを開く"}
            </button>
            <button className="guide-secondary motion-nav-button" onClick={isGuest ? onAuth : onGoLog}>
              美容ログを残す
            </button>
          </div>
        </div>
        <div className="guide-signal-grid">
          {signals.map((signal) => (
            <div key={signal}>{signal}</div>
          ))}
        </div>
      </section>

      <section className="guide-section section-shell mobile-tight">
        <div className="guide-section-head">
          <p className="guide-eyebrow">PLAN VALUE</p>
          <h2>ゲスト・無料会員・PROでできること</h2>
          {!isPro && (
            <button className="guide-link-button motion-nav-button" onClick={() => isGuest ? onAuth() : onUpgrade("guide_plan_table")}>
              {isGuest ? "無料登録" : "PROを見る"}
            </button>
          )}
        </div>
        <div className="guide-plan-table">
          <div className="guide-plan-row guide-plan-row-head">
            <span>機能</span><span>ゲスト</span><span>無料</span><span>PRO</span>
          </div>
          {planRows.map((row) => (
            <div className="guide-plan-row" key={row.label}>
              <span>{row.label}</span>
              <span>{row.guest}</span>
              <span>{row.free}</span>
              <span>{row.pro}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="guide-section section-shell mobile-tight">
        <div className="guide-section-head">
          <p className="guide-eyebrow">ROUTINE</p>
          <h2>売上につながる使い方</h2>
        </div>
        <div className="guide-routine-grid">
          {routines.map((routine) => (
            <article key={routine.label} className="guide-routine-card motion-card">
              <span>{routine.label}</span>
              <p>{routine.body}</p>
            </article>
          ))}
        </div>
      </section>

      {!isPro && (
        <section className="guide-pro-cta section-shell mobile-tight motion-reveal">
          <div>
            <p className="guide-eyebrow">PRO PRECISION</p>
            <h2>本気で選ぶ日は、PROで全商品を開放。</h2>
            <p>無制限の成分解析、全商品の購入リンク、保存・ログから育つおすすめ精度で、迷う時間を減らして購入判断を強くします。</p>
          </div>
          <button className="guide-primary motion-cta" onClick={() => isGuest ? onAuth() : onUpgrade("guide_bottom_cta")}>
            {isGuest ? "無料登録して7日トライアルへ" : "PROを試す"}
          </button>
        </section>
      )}
    </div>
  );
}
