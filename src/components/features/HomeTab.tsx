"use client";
import { useRef, useEffect, useState, type CSSProperties } from "react";
import { CAT_META } from "@/lib/constants";
import type { YoutubeVideo } from "@/app/api/youtube/route";
import { formatPrice } from "@/lib/utils";
import { PLAN_RULES } from "@/lib/plan";
import { getPersonalMatch, getProfileSignals } from "@/lib/personalization";
import { getProductInsight } from "@/lib/productInsights";
import { trackProductEvent } from "@/lib/productEvents";
import { Icon, Stars, FreeBadge, ProBadge, ProductImage } from "@/components/ui";
import type { PersonalPreferences, UserProfile, Product, Category } from "@/types";

interface Props {
  profile: UserProfile;
  displayName: string;
  isGuest: boolean;
  isPro: boolean;
  preferences?: PersonalPreferences | null;
  onUpgrade: (sourceArea?: string, product?: Product) => void;
  onGoSearch: (cat?: string) => void;
  onOpenProduct: (p: Product) => void;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
  onGoGuide: () => void;
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

type CategoryArtVariant = "skincare" | "haircare" | "makeup" | "body" | "uv" | "fragrance" | "nail" | "supplement";

const categoryArt = (accent: string, variant: CategoryArtVariant) => {
  const bottle = `<rect x="610" y="178" width="170" height="370" rx="34" fill="#F8EBDD" opacity=".48"/><rect x="650" y="120" width="90" height="76" rx="18" fill="#D8B56A" opacity=".52"/><rect x="642" y="250" width="106" height="148" rx="20" fill="#150B00" opacity=".2"/>`;
  const tube = `<g transform="rotate(-16 352 396)"><rect x="278" y="150" width="150" height="430" rx="44" fill="#F8EBDD" opacity=".45"/><rect x="307" y="544" width="92" height="58" rx="12" fill="${accent}" opacity=".5"/></g>`;
  const compact = `<circle cx="795" cy="404" r="128" fill="#F8EBDD" opacity=".24"/><circle cx="795" cy="404" r="88" fill="${accent}" opacity=".32"/><circle cx="795" cy="404" r="56" fill="#120804" opacity=".28"/>`;
  const cap = `<rect x="270" y="232" width="90" height="300" rx="42" fill="${accent}" opacity=".5"/><rect x="295" y="170" width="40" height="78" rx="12" fill="#F8EBDD" opacity=".48"/>`;
  const shapes: Record<CategoryArtVariant, string> = {
    skincare: `${bottle}<ellipse cx="355" cy="525" rx="170" ry="72" fill="#F8EBDD" opacity=".22"/><rect x="255" y="390" width="220" height="118" rx="54" fill="#F8EBDD" opacity=".34"/><circle cx="430" cy="214" r="34" fill="${accent}" opacity=".5"/>`,
    haircare: `${tube}<path d="M635 190 C860 260 842 470 650 540" fill="none" stroke="#F8EBDD" stroke-width="54" stroke-linecap="round" opacity=".22"/><path d="M690 158 C865 292 802 450 612 548" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" opacity=".48"/>`,
    makeup: `${compact}<g transform="rotate(-28 405 438)"><rect x="350" y="265" width="82" height="290" rx="38" fill="${accent}" opacity=".54"/><rect x="366" y="180" width="50" height="112" rx="22" fill="#F8EBDD" opacity=".5"/></g><rect x="478" y="172" width="80" height="340" rx="38" fill="#F8EBDD" opacity=".3"/>`,
    body: `<ellipse cx="420" cy="520" rx="190" ry="76" fill="#F8EBDD" opacity=".24"/><circle cx="376" cy="390" r="128" fill="#F8EBDD" opacity=".28"/><circle cx="374" cy="390" r="86" fill="${accent}" opacity=".2"/>${bottle}`,
    uv: `${bottle}<circle cx="300" cy="218" r="96" fill="${accent}" opacity=".26"/><circle cx="300" cy="218" r="152" fill="none" stroke="#F8EBDD" stroke-width="18" opacity=".14"/><path d="M196 408 C310 326 430 326 544 408" fill="none" stroke="#F8EBDD" stroke-width="28" stroke-linecap="round" opacity=".2"/>`,
    fragrance: `<rect x="522" y="194" width="236" height="322" rx="36" fill="#F8EBDD" opacity=".32"/><rect x="586" y="126" width="108" height="94" rx="22" fill="#D8B56A" opacity=".46"/><circle cx="364" cy="464" r="118" fill="${accent}" opacity=".22"/><path d="M248 282 C364 182 492 214 554 310" fill="none" stroke="#F8EBDD" stroke-width="22" stroke-linecap="round" opacity=".18"/>`,
    nail: `${cap}<g transform="rotate(18 704 410)"><rect x="656" y="226" width="92" height="312" rx="38" fill="#F8EBDD" opacity=".32"/><rect x="676" y="162" width="52" height="92" rx="16" fill="${accent}" opacity=".5"/></g><ellipse cx="752" cy="560" rx="168" ry="48" fill="#F8EBDD" opacity=".18"/>`,
    supplement: `<rect x="522" y="176" width="214" height="344" rx="44" fill="${accent}" opacity=".32"/><rect x="566" y="122" width="126" height="82" rx="18" fill="#F8EBDD" opacity=".35"/><g opacity=".42"><ellipse cx="330" cy="392" rx="58" ry="28" fill="#F8EBDD" transform="rotate(-24 330 392)"/><ellipse cx="400" cy="486" rx="58" ry="28" fill="#D8B56A" transform="rotate(20 400 486)"/><ellipse cx="818" cy="418" rx="58" ry="28" fill="#F8EBDD" transform="rotate(-18 818 418)"/></g>`,
  };

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760">
      <defs>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="36"/></filter>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#120804"/><stop offset=".52" stop-color="#291409"/><stop offset="1" stop-color="#080402"/></linearGradient>
      </defs>
      <rect width="1100" height="760" fill="url(#g)"/>
      <circle cx="850" cy="126" r="250" fill="${accent}" opacity=".28" filter="url(#blur)"/>
      <circle cx="180" cy="650" r="240" fill="#F8EBDD" opacity=".1" filter="url(#blur)"/>
      <path d="M104 112 H996 M104 650 H996 M170 76 V684 M930 76 V684" stroke="#F8EBDD" stroke-width="1" opacity=".13"/>
      <rect x="86" y="68" width="928" height="624" rx="34" fill="none" stroke="#F8EBDD" stroke-width="1" opacity=".18"/>
      ${shapes[variant]}
    </svg>
  `)}`;
};

const CATEGORY_VISUALS: Record<Category, { image: string; mood: string; mark: string; prompt: string }> = {
  スキンケア: {
    image: categoryArt("#C4556A", "skincare"),
    mood: "skin ritual",
    mark: "SK",
    prompt: "Luxury Japanese beauty editorial still life, translucent serum bottle, porcelain cream jar, soft ivory stone, single camellia petal, warm morning light, premium skincare ritual, no text, no logo.",
  },
  ヘアケア: {
    image: categoryArt("#4A8BAD", "haircare"),
    mood: "silk hair",
    mark: "HR",
    prompt: "Luxury haircare editorial still life, glossy hair oil bottle, silk ribbon, dark walnut surface, soft salon light, refined Japanese magazine composition, no text, no logo.",
  },
  メイク: {
    image: categoryArt("#AD4A8B", "makeup"),
    mood: "soft glamour",
    mark: "MK",
    prompt: "High-end makeup editorial still life, lipstick, compact powder, sheer fabric, muted rose and black lacquer, cinematic studio light, no text, no logo.",
  },
  ボディ: {
    image: categoryArt("#4AAD8B", "body"),
    mood: "body veil",
    mark: "BD",
    prompt: "Premium body care still life, cream texture, bath oil glass bottle, pale stone, clean spa atmosphere, soft steam, elegant minimal composition, no text, no logo.",
  },
  UVケア: {
    image: categoryArt("#C49A2A", "uv"),
    mood: "sun shield",
    mark: "UV",
    prompt: "Luxury sunscreen editorial still life, slim SPF bottle, sunlit frosted glass, pale gold reflection, clean summer light, premium skincare advertising, no text, no logo.",
  },
  フレグランス: {
    image: categoryArt("#8B4AAD", "fragrance"),
    mood: "sillage",
    mark: "FR",
    prompt: "Luxury fragrance editorial still life, sculptural perfume bottle, black marble, dried rose, amber reflection, moody premium lighting, no text, no logo.",
  },
  ネイル: {
    image: categoryArt("#AD4A4A", "nail"),
    mood: "lacquer",
    mark: "NL",
    prompt: "High-end nail polish editorial still life, glass nail lacquer bottle, subtle pearl powder, polished stone, elegant hand care mood, no text, no logo.",
  },
  サプリ: {
    image: categoryArt("#4AAD4A", "supplement"),
    mood: "inner glow",
    mark: "SP",
    prompt: "Premium beauty supplement editorial still life, amber glass supplement jar, capsules, linen, morning light, wellness luxury aesthetic, no text, no logo.",
  },
};

export default function HomeTab({ profile, displayName, isGuest, isPro, preferences, onUpgrade, onGoSearch, onOpenProduct, onGoKarte, onGoAnalyze, onGoSaved, onGoLog, onGoGuide }: Props) {
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
  const concernText = profile.concerns.slice(0, 3).join("・") || "今日の悩み";
  const conditionText = profile.currentState.slice(0, 2).join("・") || concernText;
  const personalHeroCopy = isGuest
    ? "ゲスト用カルテのサンプルで、検索・ランキング・おすすめの流れを体験できます。登録すると保存やログがあなた専用に育ちます。"
    : `${profile.skinType || "肌質"}・${conditionText}を起点に、楽天商品、保存、ログから${displayName}さん向けの候補を整えています。`;

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
              imageSize={720}
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
          <span className="hidden md:block">━━ {isGuest ? "ゲスト体験用に編集" : `${displayName}さんのために編集`}</span>
          <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}</span>
        </div>

        <div className="home-hero-content motion-reveal-slow" style={{ position: "absolute", bottom: 34, left: 32, right: 32, maxWidth: 660 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>
            {isGuest ? "GUEST PREVIEW" : "WELCOME BACK"} · {isPro && preferences?.confidence ? `CONFIDENCE ${preferences.confidence}` : "PROFILE BASED"}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.08, margin: 0, fontWeight: 400, color: "#FBF8F3", letterSpacing: "0.02em" }}>
            {isGuest ? "あなたに合う美容選びを、" : `${displayName}さんの今日に、`}<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>迷わず買う理由</span>まで。
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(251,248,243,.72)", margin: "18px 0 22px", maxWidth: 440 }}>
            {personalHeroCopy}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="motion-cta" onClick={onGoGuide} style={{ padding: "12px 20px", background: "#F8F4EF", border: "1px solid rgba(248,244,239,.9)", color: "#1A0E08", fontSize: 12, letterSpacing: "0.1em", fontWeight: 900, cursor: "pointer", borderRadius: 6 }}>
              使い方を見る
            </button>
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
          <span>━━ {isGuest ? "ゲストカルテ" : `${displayName}さんのカルテ`}</span>
          <span>{profile.skinType || "肌質未設定"}</span>
          {isPro && preferences?.positiveSignals.slice(0, 2).map(signal => <span key={signal}>/ {signal}</span>)}
          {profile.hairType && <span>{profile.hairType}</span>}
          {profile.concerns.slice(0, 3).map(c => <span key={c}>/ {c}</span>)}
          <span style={{ marginLeft: "auto", color: "#150B00", flexShrink: 0 }}>更新 {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {!isGuest && (
        <section className="mobile-tight motion-reveal" style={{ padding: "20px 32px", borderBottom: "1px solid #EDE5DC", background: "#FBF8F3" }}>
          <div
            className="section-shell home-personal-desk"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr .9fr",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            <div style={{ border: "1px solid #E8D7BE", borderRadius: 16, padding: "18px 18px 16px", background: "linear-gradient(135deg,#fffaf0,#fff)", boxShadow: "0 12px 34px rgba(21,11,0,.05)" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 8 }}>YOUR BEAUTY DESK</div>
              <h2 style={{ margin: "0 0 8px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, lineHeight: 1.2, color: "#150B00", fontWeight: 500 }}>
                おかえりなさい、{displayName}さん。
              </h2>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "#5F4A3D" }}>
                今日は「{conditionText}」を優先して、相性の高い商品・使い方・動画の入口をまとめています。
              </p>
            </div>
            <div style={{ border: "1px solid #EDE5DC", borderRadius: 16, padding: 16, background: "#fff", display: "grid", gap: 10 }}>
              {[
                ["肌・髪", [profile.skinType, profile.hairType].filter(Boolean).join(" / ") || "未設定"],
                ["気になること", concernText],
                ["次の精度UP", profile.currentProducts.length > 0 ? "使用中アイテムをもとに比較" : "使っている製品を登録"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #F1EADE", paddingBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#A8722A", fontWeight: 900 }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#3A281C", fontWeight: 800, textAlign: "right" }}>{value}</span>
                </div>
              ))}
              <button className="motion-nav-button" onClick={onGoKarte} style={{ border: "none", borderRadius: 999, padding: "10px 14px", background: "#1A0E08", color: "#D4A853", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                カルテを育てる →
              </button>
            </div>
          </div>
        </section>
      )}

      <TutorialGuide
        isPro={isPro}
        onGoKarte={onGoKarte}
        onGoAnalyze={onGoAnalyze}
        onGoSearch={() => onGoSearch()}
        onGoSaved={onGoSaved}
        onGoLog={onGoLog}
        onGoGuide={onGoGuide}
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
        <div className="category-couture-grid grid-cols-1-mobile motion-stagger">
          {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m], i) => {
            const guide = CATEGORY_GUIDES[name];
            const visual = CATEGORY_VISUALS[name];
            const cardStyle = {
              "--category-accent": m.accent,
              "--category-image": `url(${visual.image})`,
            } as CSSProperties;
            return (
            <button
              key={name}
              className="category-couture-card motion-card tap-card"
              onClick={() => onGoSearch(name)}
              style={cardStyle}
              aria-label={`${name}を詳しく探す`}
            >
              <div className="category-couture-content">
                <div className="category-couture-topline">
                  <span>{visual.mood}</span>
                  <span>0{i + 1}</span>
                </div>

                <div className="category-couture-title-wrap">
                  <span className="category-couture-icon">{visual.mark}</span>
                  <div>
                    <div className="category-couture-title">{name}</div>
                    <div className="category-couture-en">{m.en}</div>
                  </div>
                </div>

                <p className="category-couture-lead">{guide.lead}</p>

                <div className="category-couture-tags">
                  {guide.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="category-couture-footer">
                  <span>{guide.route}</span>
                  <span className="tap-card-hint">Explore →</span>
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
            <EditorCard key={p.id} product={p} onOpen={onOpenProduct} isPro={isPro} profile={profile} preferences={preferences}/>
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

function TutorialGuide({ isPro, onGoKarte, onGoAnalyze, onGoSearch, onGoSaved, onGoLog, onGoGuide, onUpgrade }: {
  isPro: boolean;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSearch: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
  onGoGuide: () => void;
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
              初めてなら、<br/>まず使い方を。
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.85, color: "rgba(251,248,243,.7)" }}>
              検索、保存、カルテ、成分分析、ログ。何から触ればいいかを先に見ると、beauteの良さがかなり掴みやすくなります。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="motion-cta" onClick={onGoGuide} style={{ border: "none", borderRadius: 999, padding: "9px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              使い方を見る
            </button>
            <button className="motion-nav-button" onClick={onGoSearch} style={{ border: "1px solid rgba(212,168,83,.45)", borderRadius: 999, padding: "9px 12px", background: "rgba(212,168,83,.12)", color: "#D4A853", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              商品を探す
            </button>
            {!isPro && (
              <button className="motion-nav-button" onClick={onUpgrade} style={{ border: "1px solid rgba(212,168,83,.35)", borderRadius: 999, padding: "9px 12px", background: "transparent", color: "rgba(251,248,243,.78)", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
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
  const insight = getProductInsight(p, profile, match?.reasons ?? []);
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
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} imageSize={320}/>
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
        <div style={{ marginTop: 9, padding: "8px 9px", borderRadius: 10, background: "#FBF8F3", border: "1px solid #EDE5DC" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.14em", color: "#A8722A", fontFamily: "ui-monospace,monospace", fontWeight: 900 }}>BUY REASON</div>
          <p style={{ margin: "3px 0 0", fontSize: 10, lineHeight: 1.45, color: "#6B5B4A", fontWeight: 700, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {isPro && match ? insight.why : insight.verdict}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, fontWeight: 500, color: "#150B00" }}>{formatPrice(p.price)}</span>
          <span className="tap-card-hint" style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: m.color, color: m.dark }}>チェック →</span>
        </div>
      </div>
    </div>
  );
}

function EditorCard({ product: p, onOpen, isPro, profile, preferences }: {
  product: Product; onOpen: (p: Product) => void; isPro: boolean; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const insight = getProductInsight(p, profile, match?.reasons ?? []);
  return (
    <div className="lift-card motion-card tap-card" role="button" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p); } }} style={{ cursor: "pointer", background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 10, overflow: "hidden", transition: "transform 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} imageSize={360}/>
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
        <p style={{ minHeight: 32, margin: "0 0 8px", fontSize: 10, lineHeight: 1.5, color: "#6B5B4A", fontWeight: 700, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {isPro && match ? insight.why : insight.verdict}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stars rating={p.rating} size={10}/>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
        </div>
      </div>
    </div>
  );
}
