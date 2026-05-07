"use client";
import { useRef, useEffect, useState } from "react";
import { CAT_META } from "@/lib/constants";
import type { YoutubeVideo } from "@/app/api/youtube/route";
import { formatPrice } from "@/lib/utils";
import { PLAN_RULES } from "@/lib/plan";
import { getPersonalMatch, getProfileSignals } from "@/lib/personalization";
import { trackProductEvent } from "@/lib/productEvents";
import { Icon, Stars, FreeBadge, ProBadge, ProductImage } from "@/components/ui";
import type { PersonalPreferences, UserProfile, Product, Category } from "@/types";

interface Props {
  profile: UserProfile;
  isPro: boolean;
  preferences?: PersonalPreferences | null;
  onUpgrade: (sourceArea?: string, product?: Product) => void;
  onGoSearch: (cat?: string) => void;
  onOpenProduct: (p: Product) => void;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
}

const CATEGORY_GUIDES: Record<Category, { lead: string; route: string; tags: string[] }> = {
  スキンケア: { lead: "肌状態・成分・使用タイミングから選ぶ", route: "化粧水 / 美容液 / 洗顔 / パック", tags: ["毛穴", "保湿", "敏感"] },
  ヘアケア: { lead: "髪質・ダメージ・仕上がりで絞り込む", route: "シャンプー / オイル / マスク", tags: ["うねり", "補修", "艶"] },
  メイク: { lead: "肌悩みと仕上がりから失敗を減らす", route: "下地 / ファンデ / リップ / アイ", tags: ["崩れ", "色味", "カバー"] },
  ボディ: { lead: "保湿・香り・質感で毎日のケアを選ぶ", route: "クリーム / 入浴剤 / スクラブ", tags: ["乾燥", "香り", "ギフト"] },
  UVケア: { lead: "SPFだけでなく肌質と下地相性まで見る", route: "日焼け止め / UV下地 / トーンアップ", tags: ["皮脂", "白浮き", "敏感"] },
  フレグランス: { lead: "香調・シーン・持続感で探す", route: "香水 / ミスト / ルーム", tags: ["甘め", "清潔感", "夜"] },
  ネイル: { lead: "色・持ち・爪悩みに合わせる", route: "カラー / ケア / ジェル", tags: ["速乾", "補強", "血色"] },
  サプリ: { lead: "目的と続けやすさで候補を分ける", route: "ビタミン / 鉄分 / プロテイン", tags: ["肌荒れ", "疲れ", "髪"] },
};

export default function HomeTab({ profile, isPro, preferences, onUpgrade, onGoSearch, onOpenProduct, onGoKarte, onGoAnalyze, onGoSaved, onGoLog }: Props) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activeVideoCategory, setActiveVideoCategory] = useState("全体");
  const [aiPicks, setAiPicks] = useState<Product[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Product[]>([]);
  const profileSignals = getProfileSignals(profile, isPro ? preferences : null);

  useEffect(() => {
    setVideosLoading(true);
    fetch(`/api/youtube?category=${encodeURIComponent(activeVideoCategory)}&max=8`)
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .finally(() => setVideosLoading(false));
  }, [activeVideoCategory]);

  // プロフィールに基づくAIレコメンド
  useEffect(() => {
    const learnedTags = isPro ? preferences?.positiveSignals ?? [] : [];
    const tags = [
      ...learnedTags.slice(0, 4),
      profile.skinType,
      profile.hairType,
      ...profile.concerns.slice(0, 5),
    ].filter(Boolean);

    const params = new URLSearchParams({ limit: "6" });
    if (tags.length > 0) params.set("tags", tags.join(","));
    else params.set("free", "true");

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => {
        const picks: Product[] = d.products ?? [];
        const sorted = isPro
          ? [...picks].sort((a, b) =>
              (getPersonalMatch(b, profile, preferences)?.score ?? 0) -
              (getPersonalMatch(a, profile, preferences)?.score ?? 0)
            )
          : picks;
        setAiPicks(sorted.length >= 3 ? sorted : []);
      });
  }, [profile, isPro, preferences]);

  // エディターズピック（IDが4の倍数 or 評価順上位4件）
  useEffect(() => {
    fetch("/api/products?limit=20")
      .then(r => r.json())
      .then(d => {
        const all: Product[] = d.products ?? [];
        setEditorsPicks(all.filter((_, i) => i % 4 === 0).slice(0, 4));
      });
  }, []);

  const heroProduct = aiPicks[0] ?? editorsPicks[0] ?? null;
  const heroMeta = heroProduct ? CAT_META[heroProduct.cat] : null;
  const heroMatch = heroProduct ? getPersonalMatch(heroProduct, profile, isPro ? preferences : null) : null;
  const recommendationProducts = aiPicks.length > 0 ? aiPicks : editorsPicks.slice(0, 6);

  return (
    <div className="motion-fade-scale" style={{ background: "linear-gradient(180deg,#FBF8F3 0%,#F8F4EF 42%,#F5EFE7 100%)" }}>
      {/* ── HERO ── */}
      <section className="home-hero" style={{ position: "relative", minHeight: 520, overflow: "hidden", background: "#1A0E08" }}>
        {heroProduct && heroMeta && (
          <button
            type="button"
            onClick={() => onOpenProduct(heroProduct)}
            className="home-hero-product tap-card"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "54%",
              border: "none",
              padding: 0,
              background: heroMeta.color,
              overflow: "hidden",
              cursor: "pointer",
            }}
            aria-label={`${heroProduct.name} を見る`}
          >
            <ProductImage
              id={heroProduct.id}
              name={heroProduct.name}
              brand={heroProduct.brand}
              sub={heroProduct.sub}
              src={heroProduct.image}
              alt={heroProduct.name}
              catColor={heroMeta.color}
              catIcon={heroMeta.icon}
              className="home-hero-image"
              style={{ opacity: 0.96 }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(26,14,8,.96) 0%, rgba(26,14,8,.6) 36%, rgba(26,14,8,.04) 100%)" }} />
            <div className="home-hero-product-note motion-reveal" style={{ position: "absolute", right: 30, bottom: 28, maxWidth: 310, textAlign: "right", color: "#FBF8F3" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 8 }}>
                {"TODAY'S PICK"}
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.45, fontWeight: 700, textShadow: "0 2px 18px rgba(0,0,0,.45)" }}>
                {heroProduct.name}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center", marginTop: 10, fontSize: 11, color: "rgba(251,248,243,.75)" }}>
                <span>{heroProduct.brand}</span>
                <span>{formatPrice(heroProduct.price)}</span>
                {heroMatch && <span>{heroMatch.score}% fit</span>}
              </div>
            </div>
          </button>
        )}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "16.666% 100%", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(26,14,8,.98) 0%, rgba(26,14,8,.86) 38%, rgba(26,14,8,.2) 76%, rgba(26,14,8,.08) 100%)", pointerEvents: "none" }}/>

        <div className="motion-reveal" style={{ position: "absolute", top: 22, left: 32, right: 32, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.3em", color: "rgba(251,248,243,.45)", fontFamily: "ui-monospace,monospace" }}>
          <span>カバーストーリー · ISSUE 04</span>
          <span className="hidden md:block">━━ AI が {profile.skinType || "あなた"} のために編集</span>
          <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}</span>
        </div>

        <div className="home-hero-content motion-reveal-slow" style={{ position: "absolute", bottom: 34, left: 32, right: 32, maxWidth: 660 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>
            PERSONAL EDITION · {isPro && preferences?.confidence ? `CONFIDENCE ${preferences.confidence}` : "PROFILE BASED"}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.08, margin: 0, fontWeight: 400, color: "#FBF8F3", letterSpacing: "0.02em" }}>
            {profile.skinType || "今日の肌"}に、<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>似合う一品</span>から。
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(251,248,243,.72)", margin: "18px 0 22px", maxWidth: 440 }}>
            {heroProduct
              ? `${heroProduct.sub}・${heroProduct.cat}を起点に、楽天商品とログ学習から今日の候補を並べています。`
              : `${profile.skinType || "肌質"}と気になる悩みに合わせて、今日の候補を準備しています。`}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {heroProduct && (
              <button className="motion-cta" onClick={() => onOpenProduct(heroProduct)} style={{ padding: "12px 20px", background: "#D4A853", border: "1px solid #D4A853", color: "#1A0E08", fontSize: 12, letterSpacing: "0.1em", fontWeight: 800, cursor: "pointer", borderRadius: 6 }}>
                今日の一品を見る
              </button>
            )}
            <button className="motion-nav-button" onClick={() => onGoSearch()} style={{ padding: "12px 20px", background: "transparent", border: "1px solid rgba(212,168,83,.72)", color: "#D4A853", fontSize: 12, letterSpacing: "0.1em", fontWeight: 800, cursor: "pointer", borderRadius: 6 }}>
              全製品を見る
            </button>
          </div>
        </div>
      </section>

      {/* ── AI STRIP ── */}
      <div style={{ background: "#F1EADE", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell mobile-tight motion-reveal-slow" style={{ padding: "14px 32px", display: "flex", gap: 20, alignItems: "center", overflowX: "auto", fontSize: 11, letterSpacing: "0.12em", color: "#8A7A6E", fontFamily: "ui-monospace,monospace", whiteSpace: "nowrap" }}>
          <span style={{ color: "#D4A853", fontWeight: 600, flexShrink: 0 }}>{isPro && preferences?.confidence ? "LOG 学習済み" : "AI 解析済み"}</span>
          <span>━━ {profile.skinType || "肌質未設定"}</span>
          {isPro && preferences?.positiveSignals.slice(0, 2).map(signal => <span key={signal}>/ {signal}</span>)}
          {profile.hairType && <span>{profile.hairType}</span>}
          {profile.concerns.slice(0, 3).map(c => <span key={c}>/ {c}</span>)}
          <span style={{ marginLeft: "auto", color: "#150B00", flexShrink: 0 }}>更新 {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <TutorialGuide
        isPro={isPro}
        onGoKarte={onGoKarte}
        onGoAnalyze={onGoAnalyze}
        onGoSearch={() => onGoSearch()}
        onGoSaved={onGoSaved}
        onGoLog={onGoLog}
        onUpgrade={() => onUpgrade("home_tutorial")}
      />

      {!isPro && profileSignals.length > 0 && (
        <section className="mobile-tight motion-reveal" style={{ padding: "18px 32px", borderBottom: "1px solid #EDE5DC", background: "#fff" }}>
          <div className="section-shell" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>PRO PERSONAL FIT</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#4A3728", margin: 0 }}>
              {profileSignals.slice(0, 3).join("・")}に合わせたスコア表示と全楽天商品の詳細はPROで使えます。
            </p>
          </div>
          <button className="motion-cta" onClick={() => onUpgrade("home_personal_fit_teaser")} style={{ padding: "10px 16px", border: "none", borderRadius: 999, background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>
            精度を上げる
          </button>
          </div>
        </section>
      )}

      {isPro && preferences && preferences.confidence > 0 && (
        <section className="mobile-tight motion-reveal" style={{ padding: "18px 32px", borderBottom: "1px solid #EDE5DC", background: "#fff" }}>
          <div className="section-shell" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>LEARNING FROM YOUR LOG</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#4A3728", margin: 0 }}>
              {preferences.summary}。ログ{preferences.logCount}件・保存{preferences.savedCount}件からおすすめを調整しています。
            </p>
          </div>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1A0E08", color: "#D4A853", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 700 }}>
            {preferences.confidence}
          </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY GRID ── */}
      <section className="editorial-section mobile-tight" style={{ padding: "44px 32px 38px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 01</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>目的から探す</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.7, color: "#7A6A5D" }}>
              大きなカテゴリだけで終わらせず、悩み・質感・使う場面まで分解して候補を出します。
            </p>
          </div>
          <button className="motion-nav-button" onClick={() => onUpgrade("home_category_precision")} style={{ border: "1px solid #D4A853", borderRadius: 999, padding: "9px 14px", background: "#fff", color: "#A8722A", fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
            PROで細かく絞る
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="grid-cols-1-mobile motion-stagger">
          {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m], i) => {
            const guide = CATEGORY_GUIDES[name];
            return (
            <button key={name} className="lift-card motion-card" onClick={() => onGoSearch(name)} style={{
              padding: 0, background: "#fff", border: `1px solid ${m.accent}30`,
              textAlign: "left", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              display: "flex", flexDirection: "column", minHeight: 178,
              color: "#150B00", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 22px rgba(21,11,0,.04)",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 30px rgba(21,11,0,.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${m.accent}88`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 22px rgba(21,11,0,.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${m.accent}30`; }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${m.accent}, ${m.color})` }} />
              <div style={{ padding: "16px 16px 14px", display: "grid", gap: 10, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: m.color, display: "grid", placeItems: "center", color: m.dark, fontSize: 20 }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: "0.18em", fontFamily: "ui-monospace,monospace", color: "#B99B7C" }}>0{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.25, color: "#150B00" }}>{name}</div>
                  <div style={{ fontSize: 10, marginTop: 2, color: "#A8722A", fontFamily: "ui-monospace,monospace", letterSpacing: "0.12em" }}>{m.en}</div>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#6B5B4A", fontWeight: 700 }}>{guide.lead}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {guide.tags.map((tag) => (
                    <span key={tag} style={{ border: `1px solid ${m.accent}28`, borderRadius: 999, padding: "3px 7px", background: m.color, color: m.dark, fontSize: 10, fontWeight: 800 }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "auto", paddingTop: 6, borderTop: "1px solid #F1EADE", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#8A7A6E", lineHeight: 1.5 }}>{guide.route}</span>
                  <span style={{ color: m.accent, fontSize: 13, fontWeight: 900 }}>→</span>
                </div>
              </div>
            </button>
          )})}
        </div>
        {!isPro && (
          <div style={{ marginTop: 14, border: "1px solid #E8D7BE", borderRadius: 12, padding: "12px 14px", background: "#FFF9EC", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 420px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>PRECISION LOCKED</div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "#5F4A3D", fontWeight: 700 }}>
                無料ではカテゴリと基本悩みまで。PROでは「朝/夜・予算・避けたい成分・ログの相性」まで使って候補を並べ替えます。
              </p>
            </div>
            <button className="motion-cta" onClick={() => onUpgrade("home_precision_locked")} style={{ border: "none", borderRadius: 999, padding: "9px 14px", background: "#1A0E08", color: "#D4A853", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              精密診断を開放
            </button>
          </div>
        )}
        </div>
      </section>

      {/* ── AI PICKS RAIL ── */}
      <ProductRail
        number="02"
        title={`今週の ${profile.skinType || "あなた"} 向け候補`}
        eyebrow={aiPicks.length > 0 ? (isPro && preferences?.confidence ? "ログ評価・保存商品・プロフィールによる提案" : "AI × 編集部によるパーソナル提案") : "まずは編集部ピックから表示中。ログと保存が増えるほど精度が上がります"}
        products={recommendationProducts}
        onOpen={onOpenProduct}
        isPro={isPro}
        onUpgrade={onUpgrade}
        profile={profile}
        preferences={isPro ? preferences : null}
      />

      {/* ── EDITOR'S PICKS GRID ── */}
        <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 03</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>編集部が選ぶ、今週の逸品</h2>
          </div>
          <button className="motion-nav-button" onClick={() => onGoSearch()} style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer" }}>すべて見る →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-cols-2-mobile motion-stagger">
          {editorsPicks.map(p => (
            <EditorCard key={p.id} product={p} onOpen={onOpenProduct} isPro={isPro}/>
          ))}
        </div>
        </div>
      </section>

      {/* ── TRENDING VIDEOS ── */}
      <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 04</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>🔥 今バズってる動画</h2>
          </div>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideoCategory === "全体" ? "美容 おすすめ コスメ" : activeVideoCategory)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", textDecoration: "none" }}>
            YouTubeで見る →
          </a>
        </div>

        {/* カテゴリタブ */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }} className="hide-scrollbar">
          {["全体", ...Object.keys(CAT_META)].map(cat => (
            <button key={cat} className="motion-nav-button" onClick={() => setActiveVideoCategory(cat)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: activeVideoCategory === cat ? "#D4A853" : "#EDE5DC",
              background: activeVideoCategory === cat ? "#D4A853" : "transparent",
              color: activeVideoCategory === cat ? "#1A0E08" : "#8A7A6E",
              fontSize: 11, fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em",
              cursor: "pointer", fontWeight: activeVideoCategory === cat ? 700 : 400,
            }}>
              {cat === "全体" ? "すべて" : cat}
            </button>
          ))}
        </div>

        {/* 動画一覧 */}
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
          {videosLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 200 }}>
                  <div style={{ height: 112, borderRadius: 10, background: "#F1EADE", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}/>
                  <div style={{ height: 12, borderRadius: 4, background: "#F1EADE", marginBottom: 4 }}/>
                  <div style={{ height: 10, borderRadius: 4, background: "#F1EADE", width: "60%" }}/>
                </div>
              ))
            : videos.map(v => (
                <a key={v.id} className="motion-card" href={v.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0, width: 200, textDecoration: "none" }}>
                  <div style={{ height: 112, borderRadius: 10, overflow: "hidden", position: "relative", marginBottom: 8, background: "#1A0E08" }}>
                    <img src={v.thumbnail} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} loading="lazy"/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.6) 0%, transparent 50%)" }}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
                        <Icon name="play" size={14} stroke="#1A0E08"/>
                      </div>
                    </div>
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, color: "#FBF8F3", fontFamily: "ui-monospace,monospace", background: "rgba(0,0,0,.65)", padding: "2px 6px", borderRadius: 10 }}>
                      👁 {v.views}回
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#150B00", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {v.title}
                  </p>
                </a>
              ))
          }
        </div>
        </div>
      </section>

      {/* ── PRO TEASER ── */}
      {!isPro && (
        <section className="mobile-tight motion-reveal motion-premium-hero" style={{ background: "#1A0E08", color: "#FBF8F3", padding: "56px 32px", position: "relative", overflow: "hidden" }}>
          <div className="section-shell" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>━━ BEAUTÉ PRO</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(28px,5vw,44px)", margin: "0 0 16px", fontWeight: 400, lineHeight: 1.2 }}>
              アトリエの扉を、<br/>そっと開ける。
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(251,248,243,.65)", margin: "0 0 24px", maxWidth: 380 }}>
              月額{PLAN_RULES.pro.priceLabel}で、無制限の成分解析・全製品フルアクセス・AIパーソナル診断。
            </p>
            <button className="motion-cta" onClick={() => onUpgrade("home_pro_teaser")} style={{ padding: "13px 28px", background: "linear-gradient(135deg,#D4A853,#A8722A)", border: "none", color: "#1A0E08", fontSize: 13, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
              PRO へアップグレード →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 180 }} className="hidden md:flex">
            {["✦ 成分解析 無制限", "✦ 全30製品 フルアクセス", "✦ AIパーソナル診断", "✦ 優先サポート"].map(f => (
              <div key={f} style={{ fontSize: 13, color: "rgba(251,248,243,.8)", letterSpacing: "0.05em" }}>{f}</div>
            ))}
          </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TutorialGuide({ isPro, onGoKarte, onGoAnalyze, onGoSearch, onGoSaved, onGoLog, onUpgrade }: {
  isPro: boolean;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSearch: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
  onUpgrade: () => void;
}) {
  const steps = [
    {
      no: "01",
      title: "カルテを整える",
      body: "肌・髪・予算・避けたいものを入れるほど、検索結果と商品理由が自分用になります。",
      action: "カルテを見る",
      onClick: onGoKarte,
      badge: "最初にやる",
    },
    {
      no: "02",
      title: "商品を保存・比較",
      body: "気になる楽天商品を残すと、あとで比較できて、PROのおすすめ学習にも使われます。",
      action: "保存リスト",
      onClick: onGoSaved,
      badge: "無料でOK",
    },
    {
      no: "03",
      title: "成分を確認",
      body: "成分表や説明文を解析して、合う理由・注意点・避けたい傾向を見ます。",
      action: "成分分析",
      onClick: onGoAnalyze,
      badge: "月3回無料",
    },
    {
      no: "04",
      title: "使った感想をログ",
      body: "合った/合わなかったを残すと、次の候補がかなり鋭くなります。",
      action: "ログを書く",
      onClick: onGoLog,
      badge: "精度UP",
    },
  ];

  return (
    <section className="mobile-tight motion-reveal" style={{ padding: "30px 32px", background: "#fff", borderBottom: "1px solid #EDE5DC" }}>
      <div className="section-shell grid-cols-1-mobile" style={{ display: "grid", gridTemplateColumns: "minmax(240px,.75fr) minmax(0,1.25fr)", gap: 18, alignItems: "stretch" }}>
        <div className="motion-card" style={{ borderRadius: 16, padding: "20px 20px 18px", background: "linear-gradient(145deg,#1A0E08,#3A1D0D)", color: "#FBF8F3", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>3 MINUTE GUIDE</div>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.15, fontWeight: 500 }}>
              迷わず、<br/>買う理由まで。
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.85, color: "rgba(251,248,243,.7)" }}>
              beautéは「検索する」だけではなく、カルテ、保存、成分分析、ログをつなげて候補を育てるアプリです。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="motion-nav-button" onClick={onGoSearch} style={{ border: "1px solid rgba(212,168,83,.45)", borderRadius: 999, padding: "9px 12px", background: "rgba(212,168,83,.12)", color: "#D4A853", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              商品を探す
            </button>
            {!isPro && (
              <button className="motion-cta" onClick={onUpgrade} style={{ border: "none", borderRadius: 999, padding: "9px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
                PROで精度を上げる
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }} className="grid-cols-1-mobile motion-stagger">
          {steps.map((step) => (
            <button
              key={step.no}
              onClick={step.onClick}
              className="lift-card motion-card"
              style={{
                border: "1px solid #EDE5DC",
                borderRadius: 14,
                padding: 14,
                background: "#FBF8F3",
                textAlign: "left",
                cursor: "pointer",
                minHeight: 170,
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>{step.no}</span>
                <span style={{ fontSize: 10, borderRadius: 999, padding: "3px 7px", background: "#FFF0C8", color: "#A8722A", fontWeight: 900 }}>{step.badge}</span>
              </div>
              <div style={{ fontSize: 14, color: "#150B00", fontWeight: 900, lineHeight: 1.35 }}>{step.title}</div>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "#6B5B4A", flex: 1 }}>{step.body}</p>
              <span style={{ fontSize: 11, color: "#A8722A", fontWeight: 900 }}>{step.action} →</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Horizontal product rail ──────────────────────────────────────────
function ProductRail({ number, title, eyebrow, products, onOpen, isPro, onUpgrade, profile, preferences }: {
  number: string; title: string; eyebrow: string; products: Product[];
  onOpen: (p: Product) => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  return (
    <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 40px", borderBottom: "1px solid #EDE5DC" }}>
      <div className="section-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ {number}</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, margin: "0 0 4px", fontWeight: 400, color: "#150B00" }}>{title}</h2>
          <div style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["←", "→"].map((d, i) => (
            <button key={d} className="motion-nav-button" onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #D9CDBC", background: "transparent", cursor: "pointer", fontSize: 14, color: "#150B00", display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar motion-stagger">
        {products.map(p => <RailCard key={p.id} product={p} onOpen={onOpen} isPro={isPro} onUpgrade={onUpgrade} profile={profile} preferences={preferences}/>)}
      </div>
      </div>
    </section>
  );
}

function RailCard({ product: p, onOpen, isPro, onUpgrade, profile, preferences }: {
  product: Product; onOpen: (p: Product) => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const handleOpen = () => {
    if (locked) {
      void trackProductEvent({
        eventType: "locked_product_click",
        sourceArea: "home_recommendation_rail",
        product: p,
        isPro,
        metadata: { matchScore: match?.score ?? null },
      });
      onUpgrade("home_recommendation_rail", p);
      return;
    }
    onOpen(p);
  };
  return (
    <div className="lift-card motion-card tap-card" role="button" tabIndex={0} onClick={handleOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }} style={{ flexShrink: 0, width: 220, cursor: "pointer", background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.06)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(21,11,0,.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(21,11,0,.06)"; }}>
      <div style={{ position: "relative", height: 140, overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon}/>
        {locked && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(21,11,0,.55),rgba(248,244,239,.15))", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 10 }}><span style={{ fontSize: 10, color: "#F5EEE4", background: "rgba(26,14,8,.9)", borderRadius: 999, padding: "5px 9px", fontWeight: 800 }}>PROで詳細</span></div>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>{p.free ? <FreeBadge/> : <ProBadge/>}</div>
        {isPro && match && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "#1A0E08", color: "#D4A853", borderRadius: 999, padding: "3px 7px", fontSize: 9, fontWeight: 800 }}>
            {match.score}%
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", marginBottom: 3 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 6 }}>{p.name}</div>
        <Stars rating={p.rating} size={11}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, fontWeight: 500, color: "#150B00" }}>{formatPrice(p.price)}</span>
          <span className="tap-card-hint" style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: m.color, color: m.dark }}>詳細 →</span>
        </div>
      </div>
    </div>
  );
}

function EditorCard({ product: p, onOpen, isPro }: { product: Product; onOpen: (p: Product) => void; isPro: boolean }) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  return (
    <div className="lift-card motion-card tap-card" role="button" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p); } }} style={{ cursor: "pointer", background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 10, overflow: "hidden", transition: "transform 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.55) 0%, transparent 50%)" }}/>
        {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(21,11,0,.2)" }}/>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ fontSize: 9, background: "rgba(212,168,83,.9)", color: "#1A0E08", padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.1em" }}>EDITOR PICK</span>
        </div>
        {locked && (
          <div style={{ position: "absolute", right: 8, bottom: 8, fontSize: 9, background: "rgba(26,14,8,.9)", color: "#D4A853", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
            PRO DETAIL
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.12em", marginBottom: 2 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 4 }}>{p.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stars rating={p.rating} size={10}/>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
        </div>
      </div>
    </div>
  );
}
