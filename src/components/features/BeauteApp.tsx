"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePersonalPreferences } from "@/hooks/usePersonalPreferences";
import { CAT_META } from "@/lib/constants";
import { formatPrice, getProductKey, toRakutenAffiliateUrl } from "@/lib/utils";
import { getPersonalMatch } from "@/lib/personalization";
import { getProductInsight } from "@/lib/productInsights";
import { getProductGrowthStats } from "@/lib/beautyGrowth";
import { trackProductEvent } from "@/lib/productEvents";
import { supabase } from "@/lib/supabase";
import { BrandLogo, Icon, Stars, FreeBadge, ProBadge, GoldButton, ProductImage } from "@/components/ui";
import type { PersonalPreferences, Product, UserProfile } from "@/types";

const AuthScreen = dynamic(() => import("./AuthScreen"), { loading: () => <TabLoading /> });
const ProfileScreen = dynamic(() => import("./ProfileScreen"), { loading: () => <TabLoading /> });
const HomeTab = dynamic(() => import("./HomeTab"), { loading: () => <TabLoading /> });
const GuideTab = dynamic(() => import("./GuideTab"), { loading: () => <TabLoading /> });
const SearchTab = dynamic(() => import("./SearchTab"), { loading: () => <TabLoading /> });
const AnalyzeTab = dynamic(() => import("./AnalyzeTab"), { loading: () => <TabLoading /> });
const LogTab = dynamic(() => import("./LogTab"), { loading: () => <TabLoading /> });
const PremiumTab = dynamic(() => import("./PremiumTab"), { loading: () => <TabLoading /> });
const KarteTab = dynamic(() => import("./KarteTab"), { loading: () => <TabLoading /> });
const SavedTab = dynamic(() => import("./SavedTab"), { loading: () => <TabLoading /> });

type Tab = "home" | "guide" | "search" | "ranking" | "analyze" | "karte" | "saved" | "log" | "premium";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const TAB_KEYS: Tab[] = ["home", "guide", "search", "ranking", "analyze", "karte", "saved", "log", "premium"];

const NAV: { key: Tab; icon: Parameters<typeof Icon>[0]["name"]; jp: string; en: string }[] = [
  { key: "home",    icon: "home",    jp: "ホーム",   en: "Home"    },
  { key: "guide",   icon: "guide",   jp: "使い方",   en: "Guide"   },
  { key: "search",  icon: "search",  jp: "検索",     en: "Search"  },
  { key: "ranking", icon: "ranking", jp: "ランキング", en: "Ranking" },
  { key: "analyze", icon: "sparkle", jp: "成分解析", en: "Analyze" },
  { key: "karte",   icon: "karte",   jp: "パーソナル",   en: "Personal"   },
  { key: "saved",   icon: "bookmark", jp: "保存",     en: "Saved"   },
  { key: "log",     icon: "note",    jp: "ログ",     en: "Journal" },
  { key: "premium", icon: "crown",   jp: "プラン",   en: "Pro"     },
];

const MOBILE_NAV_KEYS = new Set<Tab>(["home", "guide", "search", "ranking", "karte", "premium"]);
const MOBILE_NAV = NAV.filter(({ key }) => MOBILE_NAV_KEYS.has(key));

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "home";
  const value = new URLSearchParams(window.location.search).get("tab");
  if (value === "personal") return "karte";
  return TAB_KEYS.includes(value as Tab) ? value as Tab : "home";
}

const GUEST_PROFILE: UserProfile = {
  nickname: "ゲスト",
  age: "",
  gender: "回答しない",
  skinType: "\u6df7\u5408\u808c",
  hairType: "\u666e\u901a",
  concerns: ["\u6bdb\u7a74", "\u4e7e\u71e5", "\u304f\u3059\u307f"],
  currentProducts: ["化粧水", "日焼け止め"],
  currentState: ["夕方テカる", "毛穴落ちする"],
  desiredIngredients: ["ナイアシンアミド", "セラミド"],
  habits: ["毎日UV", "メイク前"],
  goals: ["毛穴を目立たせない", "透明感"],
};

function cleanDisplayValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDisplayName(user: User | null, profile?: UserProfile) {
  const nickname = cleanDisplayValue(profile?.nickname);
  if (nickname) return nickname.slice(0, 18);

  const meta = user?.user_metadata ?? {};
  const metadataName =
    cleanDisplayValue(meta.nickname) ||
    cleanDisplayValue(meta.name) ||
    cleanDisplayValue(meta.full_name);
  if (metadataName) return metadataName.slice(0, 18);

  const emailName = cleanDisplayValue(user?.email?.split("@")[0]);
  if (!emailName) return "あなた";
  return emailName.replace(/[._-]+/g, " ").trim().slice(0, 18) || "あなた";
}

function getDisplayInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function TabLoading() {
  return (
    <div className="motion-fade-scale" style={{ minHeight: "45vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BrandLogo size="md" plate />
    </div>
  );
}

function WelcomeBackLoading({ displayName }: { displayName?: string }) {
  return (
    <div
      className="motion-fade-scale"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 28%, rgba(212,168,83,.15), transparent 34%), #F8F4EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#150B00",
      }}
    >
      <div style={{ textAlign: "center", padding: 24 }}>
        <BrandLogo size="lg" plate style={{ marginBottom: 12 }} />
        {displayName ? (
          <>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>
              WELCOME BACK
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#3A281C" }}>
              {displayName}さんのパーソナルを準備しています
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#8A7A6E" }}>読み込み中...</p>
        )}
      </div>
    </div>
  );
}

function PublicComplianceStrip() {
  return (
    <section className="public-compliance-strip" aria-label="beautiaのサービス情報">
      <div>
        <strong>beautiaは、iRiseが運営するパーソナル美容サーチです。</strong>
        <span>美容商品の検索、保存、比較、成分解析、美容ログ、パーソナル相談を提供します。PROは月額¥500（税込）です。</span>
      </div>
      <nav aria-label="公開情報">
        <a href="/about">サービス内容</a>
        <a href="/commercial">特商法表記</a>
        <a href="/terms">利用規約</a>
        <a href="/privacy">プライバシー</a>
      </nav>
    </section>
  );
}

export default function BeauteApp() {
  const { user, loading: authLoading, signIn, signUp, signOut, sendPasswordReset } = useAuth();
  const { profile, updateProfile, profileDone, setProfileDone, completeProfile, profileLoading, isPro, setIsPro, refreshProfile } = useProfile(user);
  const { preferences } = usePersonalPreferences(Boolean(user && profileDone && isPro));
  const [tab, setTab] = useState<Tab>(getInitialTab);
  const [drawer, setDrawer] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "cancel"; message: string } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const isGuest = !user;
  const effectiveProfile = isGuest ? GUEST_PROFILE : profile;
  const effectiveIsPro = !isGuest && isPro;
  const displayName = isGuest ? "ゲスト" : getDisplayName(user, profile);

  // PWAインストールプロンプトの捕捉
  useEffect(() => {
    const dismissed = sessionStorage.getItem("beaute_install_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("beaute_install_dismissed", "1");
  };

  // Stripe決済後のリダイレクト処理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      window.history.replaceState({}, "", "/");
      // Webhookの処理待ち（最大3秒ポーリング）
      let attempts = 0;
      const poll = setInterval(async () => {
        await refreshProfile();
        attempts++;
        if (attempts >= 3) clearInterval(poll);
      }, 1000);
      setToast({ type: "success", message: "🎉 PROメンバーになりました！全機能が解放されました。" });
      setTimeout(() => setToast(null), 5000);
    } else if (params.get("canceled") === "1") {
      window.history.replaceState({}, "", "/");
      setToast({ type: "cancel", message: "決済がキャンセルされました。" });
      setTimeout(() => setToast(null), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  useEffect(() => {
    const tabParam = tab === "karte" ? "personal" : tab;
    const path = tab === "home" ? "/" : `/?tab=${tabParam}`;
    if (`${window.location.pathname}${window.location.search}` !== path) {
      window.history.replaceState({}, "", path);
    }
  }, [tab]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    document.querySelector<HTMLElement>(".app-main")?.scrollTo({ top: 0, left: 0 });
  }, [tab]);

  // 認証・プロフィール読み込み中
  if (authLoading || (user && profileLoading)) {
    return <WelcomeBackLoading displayName={user ? getDisplayName(user, profile) : undefined} />;
  }

  if (isGuest && showAuth) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        onSendPasswordReset={sendPasswordReset}
        onContinueAsGuest={() => setShowAuth(false)}
      />
    );
  }

  // プロフィール未設定
  if (!isGuest && !profileDone)
    return <ProfileScreen profile={profile} onChange={updateProfile} onComplete={completeProfile}/>;

  const goSearch = (cat?: string) => {
    if (cat) sessionStorage.setItem("beaute_initCat", cat);
    setTab("search");
  };
  const upgrade = (sourceArea = "app_upgrade", product?: Product) => {
    void trackProductEvent({
      eventType: "upgrade_click",
      sourceArea,
      product,
      isPro: effectiveIsPro,
    });
    setTab("premium");
  };
  const editProfile = () => {
    if (isGuest) {
      setShowAuth(true);
      return;
    }
    setProfileDone(false);
  };

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh", background: "#F8F4EF", color: "#150B00", fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP",-apple-system,sans-serif' }}>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden md:flex" style={{ width: 220, background: "#1A0E08", color: "#FBF8F3", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid rgba(212,168,83,.15)" }}>
          <BrandLogo size="md" />
          <div style={{ fontSize: 8, letterSpacing: "0.32em", color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace,monospace", marginTop: 5 }}>— EST. MMXXV</div>
        </div>

        <nav style={{ padding: "20px 12px", flex: 1 }}>
          {NAV.map(({ key, icon, jp, en }) => {
            const active = tab === key;
            return (
              <button key={key} className="motion-nav-button" onClick={() => setTab(key)} style={{
                width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 2,
                background: active ? "rgba(212,168,83,.12)" : "transparent", border: "none",
                borderLeft: active ? "2px solid #D4A853" : "2px solid transparent",
                color: active ? "#D4A853" : "rgba(251,248,243,.75)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                borderRadius: "0 8px 8px 0", transition: "all 0.18s ease",
              }}>
                <Icon name={icon} size={17} stroke="currentColor" sw={active ? 2 : 1.5}/>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.1 }}>{en}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: active ? "rgba(212,168,83,.7)" : "rgba(251,248,243,.35)", fontFamily: "ui-monospace,monospace", marginTop: 2 }}>{jp}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(212,168,83,.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#E8D7BE,#C89E6A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#1A0E08", fontWeight: 700, flexShrink: 0 }}>
            {isGuest ? "G" : getDisplayInitial(displayName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#FBF8F3", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isGuest ? "\u30b2\u30b9\u30c8\u95b2\u89a7\u4e2d" : `${displayName}さん`}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: effectiveIsPro ? "#D4A853" : "rgba(251,248,243,.4)", fontFamily: "ui-monospace,monospace" }}>{isGuest ? "ゲスト" : effectiveIsPro ? "PRO" : "無料"}</div>
          </div>
          <button
            onClick={editProfile}
            title={isGuest ? "\u30ed\u30b0\u30a4\u30f3 / \u7121\u6599\u767b\u9332" : "プロフィール編集"}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.4)", padding: 4, flexShrink: 0 }}
          >
            <Icon name="note" size={14} stroke="currentColor" sw={2} />
          </button>
          {!isGuest && (
            <button
              onClick={signOut}
              title="ログアウト"
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.4)", padding: 4, flexShrink: 0 }}
            >
              <Icon name="close" size={14} stroke="currentColor" sw={2} />
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Desktop top bar */}
        <header className="hidden md:flex" style={{ height: 52, padding: "0 40px", alignItems: "center", justifyContent: "space-between", background: "#F8F4EF", borderBottom: "1px solid #EDE5DC", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>
            {isGuest ? "beautia お試し中" : `おかえりなさい、${displayName}さん`} — {NAV.find(n => n.key === tab)?.jp} — {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="motion-nav-button" onClick={() => setTab("ranking")} style={{ fontSize: 11, padding: "6px 14px", background: tab === "ranking" ? "#1A0E08" : "#fff", color: tab === "ranking" ? "#D4A853" : "#8A7A6E", border: "1px solid #EDE5DC", borderRadius: 20, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>ランキング</button>
            {!effectiveIsPro
              ? <button className="motion-cta" onClick={() => isGuest ? setShowAuth(true) : upgrade("desktop_header")} style={{ fontSize: 11, padding: "6px 16px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>{isGuest ? "\u7121\u6599\u767b\u9332 / \u30ed\u30b0\u30a4\u30f3" : "★ PRO へアップグレード"}</button>
              : <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", color: "#D4A853" }}>★ PRO</span>
            }
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden" style={{ height: 52, padding: "0 16px", alignItems: "center", justifyContent: "space-between", background: "#1A0E08", position: "sticky", top: 0, zIndex: 20 }}>
          <div>
            <BrandLogo size="xs" />
            <div style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(212,168,83,.72)", fontFamily: "ui-monospace,monospace", marginTop: 3 }}>
              {isGuest ? "ゲスト" : "あなた用"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="motion-nav-button" onClick={() => setTab("ranking")} style={{ fontSize: 11, padding: "5px 10px", background: tab === "ranking" ? "#D4A853" : "transparent", color: tab === "ranking" ? "#1A0E08" : "#D4A853", border: "1px solid #D4A853", borderRadius: 20, fontWeight: 700, cursor: "pointer" }}>ランキング</button>
            {!effectiveIsPro && <button className="motion-cta" onClick={() => isGuest ? setShowAuth(true) : upgrade("mobile_header")} style={{ fontSize: 11, padding: "5px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer" }}>{isGuest ? "\u767b\u9332" : "PRO"}</button>}
          </div>
        </header>

        {isGuest && (
          <div className="guest-preview-bar" style={{ background: "linear-gradient(90deg,#FFF9EC 0%,#EFF6F1 100%)", borderBottom: "1px solid #DCE7DD" }}>
            <div className="guest-preview-inner section-shell mobile-tight motion-reveal-slow" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 24px" }}>
              <div className="guest-preview-copy" style={{ flex: "1 1 360px", minWidth: 0 }}>
                <div className="guest-preview-eyebrow" style={{ fontSize: 10, letterSpacing: "0.22em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 3 }}>
                  {"お試し中"}
                </div>
                <p className="guest-preview-text" style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "#5F4A3D", fontWeight: 700 }}>
                  {"\u691c\u7d22\u30fb\u30e9\u30f3\u30ad\u30f3\u30b0\u306f\u30b2\u30b9\u30c8\u3067OK\u3002\u4fdd\u5b58\u30fb\u30ed\u30b0\u306f\u7121\u6599\u767b\u9332\u304b\u3089\u3002"}
                </p>
                <p className="guest-preview-text-mobile" style={{ display: "none", margin: 0, fontSize: 11, lineHeight: 1.55, color: "#5F4A3D", fontWeight: 800 }}>
                  {"保存・比較・ログは無料登録で使えます。"}
                </p>
              </div>
              <button className="guest-preview-button motion-cta" onClick={() => setShowAuth(true)} style={{ border: "none", borderRadius: 999, padding: "9px 16px", background: "#1A0E08", color: "#D4A853", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
                {"\u7121\u6599\u767b\u9332 / \u30ed\u30b0\u30a4\u30f3"}
              </button>
            </div>
          </div>
        )}

        <PublicComplianceStrip />

        <main style={{ flex: 1, overflowY: "auto" }} className="app-main">
          {tab === "home"    && <HomeTab    profile={effectiveProfile} displayName={displayName} isGuest={isGuest} isPro={effectiveIsPro} preferences={isGuest ? null : preferences} onUpgrade={upgrade} onGoSearch={goSearch} onOpenProduct={setDrawer} onGoKarte={() => setTab("karte")} onGoAnalyze={() => setTab("analyze")} onGoSaved={() => setTab("saved")} onGoLog={() => setTab("log")} onGoGuide={() => setTab("guide")}/>}
          {tab === "guide"   && <GuideTab   isGuest={isGuest} isPro={effectiveIsPro} onAuth={() => setShowAuth(true)} onUpgrade={upgrade} onGoSearch={() => setTab("search")} onGoRanking={() => setTab("ranking")} onGoKarte={() => setTab("karte")} onGoAnalyze={() => setTab("analyze")} onGoSaved={() => setTab("saved")} onGoLog={() => setTab("log")}/>}
          {tab === "search"  && <SearchTab  isPro={effectiveIsPro} isGuest={isGuest} preferences={isGuest ? null : preferences} onUpgrade={upgrade} onAuth={() => setShowAuth(true)} onOpenProduct={setDrawer} initialMode="search" profile={effectiveProfile}/>}
          {tab === "ranking" && <SearchTab  isPro={effectiveIsPro} isGuest={isGuest} preferences={isGuest ? null : preferences} onUpgrade={upgrade} onAuth={() => setShowAuth(true)} onOpenProduct={setDrawer} initialMode="ranking" profile={effectiveProfile}/>}
          {tab === "analyze" && (isGuest ? <GuestGate title={"\u6210\u5206\u89e3\u6790\u306f\u7121\u6599\u767b\u9332\u304b\u3089"} body={"\u6210\u5206\u306e\u8981\u70b9\u3068\u6ce8\u610f\u70b9\u3092\u6b8b\u305b\u307e\u3059\u3002"} onAuth={() => setShowAuth(true)} onGoSearch={() => setTab("search")} /> : <AnalyzeTab isPro={effectiveIsPro} onUpgrade={upgrade}/>)}
          {tab === "karte"   && (isGuest ? <GuestGate title={"パーソナルはあなた専用"} body={"肌・髪・注意メモを分けて残せます。無料登録すると相談も1日3回使えます。"} onAuth={() => setShowAuth(true)} onGoSearch={() => setTab("search")} /> : <KarteTab profile={effectiveProfile} displayName={displayName} isPro={effectiveIsPro} preferences={preferences} onOpenProduct={setDrawer} onEditProfile={editProfile} onGoAnalyze={() => setTab("analyze")} onGoSearch={() => setTab("search")} onGoLog={() => setTab("log")} onUpgrade={upgrade}/>)}
          {tab === "saved"   && (isGuest ? <GuestGate title={"\u4fdd\u5b58\u306f\u7121\u6599\u767b\u9332\u304b\u3089"} body={"\u6c17\u306b\u306a\u308b\u5546\u54c1\u3092\u6bd4\u8f03\u3067\u304d\u307e\u3059\u3002"} onAuth={() => setShowAuth(true)} onGoSearch={() => setTab("search")} /> : <SavedTab isPro={effectiveIsPro} onUpgrade={upgrade} onOpenProduct={setDrawer}/>)}
          {tab === "log"     && (isGuest ? <GuestGate title={"\u30ed\u30b0\u306f\u7121\u6599\u767b\u9332\u304b\u3089"} body={"\u4f7f\u3063\u305f\u611f\u60f3\u304c\u6b21\u306e\u63d0\u6848\u3092\u80b2\u3066\u307e\u3059\u3002"} onAuth={() => setShowAuth(true)} onGoSearch={() => setTab("search")} /> : <LogTab userId={user.id} isPro={effectiveIsPro} onUpgrade={upgrade}/>)}
          {tab === "premium" && <PremiumTab isPro={effectiveIsPro} onUpgrade={() => isGuest ? setShowAuth(true) : setIsPro(true)} user={user}/>}
          <footer className="public-site-footer">
            <span>beautia / iRise</span>
            <a href="/about">サービス内容</a>
            <a href="/commercial">特商法表記</a>
            <a href="/terms">利用規約</a>
            <a href="/privacy">プライバシー</a>
            <a href="/feedback">問い合わせ</a>
          </footer>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="flex md:hidden hide-scrollbar mobile-bottom-nav" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: 64,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "#1A0E08",
        borderTop: "1px solid rgba(212,168,83,.2)",
        zIndex: 30,
        overflowX: "hidden",
        overflowY: "hidden",
      }}>
        {MOBILE_NAV.map(({ key, icon, jp }) => {
          const active = tab === key;
          return (
            <button key={key} className="motion-nav-button" onClick={() => setTab(key)} style={{
              flex: "1 1 0", minWidth: 0, padding: "8px 2px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#D4A853" : "rgba(251,248,243,.4)", transition: "color 0.15s",
            }}>
              <Icon name={icon} size={19} stroke="currentColor" sw={active ? 2 : 1.4}/>
              <span style={{ fontSize: 8, letterSpacing: "0.03em", whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{jp}</span>
            </button>
          );
        })}
      </nav>

      {/* ── PRODUCT DRAWER ── */}
      {drawer && <ProductDrawer product={drawer} onClose={() => setDrawer(null)} isPro={effectiveIsPro} onUpgrade={upgrade} profile={effectiveProfile} preferences={isGuest ? null : preferences} isGuest={isGuest} onAuthRequired={() => setShowAuth(true)}/>}

      {/* ── PWAインストールバナー ── */}
      {showInstallBanner && tab === "home" && !drawer && (
        <div style={{
          position: "fixed", bottom: 72, left: 12, right: 12,
          zIndex: 150, borderRadius: 16,
          background: "linear-gradient(135deg,#1A0E08,#2C1A0E)",
          border: "1px solid rgba(212,168,83,.4)",
          boxShadow: "0 8px 40px rgba(21,11,0,.3)",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeUp 0.3s ease",
        }} className="md:hidden">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,#D4A853,#A8722A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#1A0E08", fontStyle: "italic", fontWeight: 500 }}>b</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "#FBF8F3", fontWeight: 600, marginBottom: 2 }}>ホーム画面に追加</div>
            <div style={{ fontSize: 11, color: "rgba(251,248,243,.6)", lineHeight: 1.4 }}>アプリとして使えます</div>
          </div>
          <button onClick={handleInstall} style={{
            padding: "8px 14px", background: "linear-gradient(135deg,#D4A853,#A8722A)",
            color: "#1A0E08", border: "none", borderRadius: 10,
            fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
          }}>
            追加
          </button>
          <button onClick={dismissInstallBanner} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.4)", padding: "0 2px", flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, maxWidth: 420, width: "calc(100vw - 40px)",
          padding: "14px 20px", borderRadius: 14,
          background: toast.type === "success"
            ? "linear-gradient(135deg,#1A0E08,#2C1A0E)"
            : "#4A3728",
          border: toast.type === "success"
            ? "1px solid #D4A853"
            : "1px solid #8A6040",
          boxShadow: "0 8px 40px rgba(21,11,0,.25)",
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeInDown 0.3s ease",
        }}>
          <div style={{ flex: 1, fontSize: 13, color: "#FBF8F3", lineHeight: 1.5 }}>
            {toast.message}
          </div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.5)", padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )}
    </div>
  );
}

function GuestGate({ title, body, onAuth, onGoSearch }: {
  title: string;
  body: string;
  onAuth: () => void;
  onGoSearch: () => void;
}) {
  return (
    <div style={{ minHeight: "calc(100vh - 52px)", display: "grid", placeItems: "center", padding: 24 }}>
      <section className="motion-reveal" style={{ width: "min(640px,100%)", background: "#fff", border: "1px solid #EDE5DC", borderRadius: 18, padding: "28px 24px", boxShadow: "0 12px 36px rgba(21,11,0,.08)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.24em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>
          {"お試し画面"}
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.25, color: "#150B00", fontWeight: 500, margin: "0 0 10px" }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, lineHeight: 1.9, color: "#6B5B4A", margin: "0 0 20px" }}>
          {body}
        </p>
        <div className="guest-gate-growth-preview">
          <div>
            <span>今日の調子</span>
            <strong>64</strong>
            <small>記録で更新</small>
          </div>
          <div>
            <span>積み上げ</span>
            <strong>毎日のつや</strong>
            <small>次は比較ログ</small>
          </div>
          <div>
            <span>次にやること</span>
            <strong>1つ</strong>
            <small>今日の状態を残す</small>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 22 }} className="grid-cols-1-mobile motion-stagger">
          {[
            ["\u30b2\u30b9\u30c8", "\u691c\u7d22\u30fb\u30e9\u30f3\u30ad\u30f3\u30b0"],
            ["\u7121\u6599\u4f1a\u54e1", "\u4fdd\u5b58\u30fb\u30ed\u30b0\u30fb\u67083\u56de\u89e3\u6790"],
            ["PRO", "\u7121\u5236\u9650\u89e3\u6790\u30fb\u5168\u5546\u54c1\u3092\u78ba\u8a8d"],
          ].map(([label, value]) => (
            <div key={label} className="motion-card" style={{ border: "1px solid #EDE5DC", borderRadius: 12, padding: 12, background: "#F8F4EF" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#150B00", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, lineHeight: 1.55, color: "#8A7A6E" }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button className="motion-cta" onClick={onAuth} style={{ flex: "1 1 180px", border: "none", borderRadius: 12, padding: "13px 16px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            {"\u7121\u6599\u767b\u9332\u3059\u308b"}
          </button>
          <button className="motion-nav-button" onClick={onGoSearch} style={{ flex: "1 1 180px", border: "1px solid #EDE5DC", borderRadius: 12, padding: "13px 16px", background: "#fff", color: "#150B00", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            {"\u5148\u306b\u5546\u54c1\u3092\u898b\u308b"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProductDrawer({ product: p, onClose, isPro, onUpgrade, profile, preferences, isGuest = false, onAuthRequired }: {
  product: Product; onClose: () => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null; isGuest?: boolean; onAuthRequired?: () => void;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const purchaseUrl = p.url ?? toRakutenAffiliateUrl(p.name, p.brand);
  const match = getPersonalMatch(p, profile, preferences);
  const productKey = getProductKey(p);
  const productSourceLabel = p.source === "rakuten" ? "楽天市場" : p.source === "supabase" ? "保存商品" : "編集部";
  const trustSignals = [
    { label: "評価", value: p.rating ? p.rating.toFixed(2) : "確認中" },
    { label: "レビュー", value: `${p.rev.toLocaleString()}件` },
    { label: p.rank ? "順位" : "価格", value: p.rank ? `#${p.rank}` : formatPrice(p.price) },
  ];
  const fitReasons = match?.reasons.slice(0, 3) ?? [];
  const insight = getProductInsight(p, profile, fitReasons);
  const growthStats = getProductGrowthStats(p, profile);
  const checkoutChecks = [
    p.rank ? `ランキング #${p.rank}` : `価格 ${formatPrice(p.price)}`,
    `レビュー ${p.rev.toLocaleString()}件`,
    isPro && match ? `相性 ${match.score}%` : insight.timing,
  ];
  const [savedFavorite, setSavedFavorite] = useState(false);
  const [savedCompare, setSavedCompare] = useState(false);
  const [saveLoading, setSaveLoading] = useState<"favorite" | "compare" | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    void trackProductEvent({
      eventType: "product_view",
      sourceArea: "product_drawer",
      product: p,
      isPro,
      metadata: {
        locked,
        matchScore: match?.score ?? null,
      },
    });
  }, [isPro, locked, match?.score, p, productKey]);

  useEffect(() => {
    let ignore = false;
    const fetchSaveState = async () => {
      if (isGuest) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/product-saves", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const save = (data.saves ?? []).find((item: { product_key: string }) => item.product_key === productKey);
      if (!ignore && save) {
        setSavedFavorite(Boolean(save.favorite));
        setSavedCompare(Boolean(save.compare));
      }
    };
    fetchSaveState();
    return () => { ignore = true; };
  }, [isGuest, productKey]);

  const updateProductSave = async (kind: "favorite" | "compare") => {
    if (isGuest) {
      onAuthRequired?.();
      return;
    }
    setSaveLoading(kind);
    setSaveMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSaveLoading(null);
      return;
    }

    const nextFavorite = kind === "favorite" ? !savedFavorite : savedFavorite;
    const nextCompare = kind === "compare" ? !savedCompare : savedCompare;

    const res = await fetch("/api/product-saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session.access_token,
        product: p,
        favorite: nextFavorite,
        compare: nextCompare,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429 && data.error) {
      setSaveMessage(data.error);
      if (!isPro) onUpgrade();
    } else if (res.ok) {
      setSavedFavorite(Boolean(data.save?.favorite));
      setSavedCompare(Boolean(data.save?.compare));
      setSaveMessage(kind === "favorite"
        ? nextFavorite ? "お気に入りに保存しました" : "お気に入りから外しました"
        : nextCompare ? "比較リストに追加しました" : "比較リストから外しました");
    } else {
      setSaveMessage("保存に失敗しました。もう一度お試しください。");
    }
    setSaveLoading(null);
  };

  const handleLockedUpgrade = () => {
    void trackProductEvent({
      eventType: "locked_product_click",
      sourceArea: "product_drawer_locked",
      product: p,
      isPro,
      metadata: { matchScore: match?.score ?? null },
    });
    onUpgrade("product_drawer_locked", p);
  };

  const handlePurchaseClick = () => {
    void trackProductEvent({
      eventType: "purchase_click",
      sourceArea: "product_drawer_purchase",
      product: p,
      isPro,
      metadata: { purchaseUrl, matchScore: match?.score ?? null },
    });
  };

  return (
    <div className="product-drawer-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(21,11,0,.55)", display: "flex", justifyContent: "flex-end" }}>
      <div className="product-drawer-panel" onClick={e => e.stopPropagation()} style={{ width: "min(520px,100vw)", background: "#FBF8F3", height: "100%", overflowY: "auto", animation: "slideInRight 0.28s ease" }}>
        <div className="product-drawer-grip" />

        {/* Image */}
        <div className="product-drawer-hero" style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: m.color }}>
          <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} className="product-drawer-image" style={{ position: "absolute", inset: 0 }} imageSize={640}/>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.5) 0%, transparent 55%)" }}/>
          {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(21,11,0,.18)" }}/>}
          <button aria-label="商品詳細を閉じる" className="product-drawer-close" onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={16} stroke="#150B00" sw={2}/>
          </button>
          <div className="product-drawer-hero-caption" style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontSize: 10, color: "rgba(251,248,243,.7)", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em" }}>{productSourceLabel} / {p.brand}</div>
            <div className="product-drawer-title" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>{p.name}</div>
          </div>
        </div>

        {/* Body */}
        <div className="product-drawer-body" style={{ padding: "22px 26px 40px" }}>
          <div className="product-drawer-mobile-summary">
            <span>{productSourceLabel} / {p.brand}</span>
            <h2>{p.name}</h2>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: m.color, color: m.dark, fontWeight: 600 }}>{m.icon} {p.cat} · {p.sub}</span>
            {p.free ? <FreeBadge/> : <ProBadge/>}
            {p.rank && (
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "#1A0E08", color: "#D4A853", fontWeight: 800 }}>
                楽天ランキング #{p.rank}
              </span>
            )}
          </div>

          <div className="product-drawer-decision-card">
            <div className="product-drawer-decision-top">
              <div>
                <span>価格</span>
                <strong>{formatPrice(p.price)}</strong>
                <small>税込</small>
              </div>
              <div>
                <span>評価</span>
                <Stars rating={p.rating}/>
                <small>{p.rev.toLocaleString()}件</small>
              </div>
            </div>
            <div className="product-drawer-growth-chips" aria-label="この商品で確認したいポイント">
              {growthStats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
            <p>{locked ? "詳しい比較はPROで確認できます。" : insight.purchaseCue}</p>
          </div>

          <p className="product-drawer-short-desc">{p.desc}</p>

          <div className="product-drawer-verdict-card">
            <div className="product-drawer-verdict-head">
              <div>
                <div className="product-drawer-micro">買う前の判断</div>
                <h3>{insight.verdict}</h3>
              </div>
              <div className="product-drawer-fit-orb">
                <span>{isPro && match ? match.score : p.rank ? `#${p.rank}` : Math.round(p.rating * 20)}</span>
                <small>{isPro && match ? "相性" : p.rank ? "順位" : "評価"}</small>
              </div>
            </div>
            <div className="product-drawer-check-grid">
              <div>
                <span>合う理由</span>
                <p>{isPro && match ? insight.why : `${p.cat}・${p.sub}として比較価値あり`}</p>
              </div>
              <div>
                <span>使いどころ</span>
                <p>{insight.timing}</p>
              </div>
              <div>
                <span>注意点</span>
                <p>{insight.caution}</p>
              </div>
            </div>
          </div>

          <details className="product-drawer-details">
            <summary>購入前チェック</summary>
            <div className="product-drawer-section-card">
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>確認ポイント</div>
              <div className="product-drawer-signal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {trustSignals.map((signal) => (
                  <div key={signal.label} style={{ background: "#F8F4EF", borderRadius: 12, padding: "10px 8px", textAlign: "center", minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: "#8A7A6E", marginBottom: 4 }}>{signal.label}</div>
                    <div style={{ fontSize: 14, color: "#150B00", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{signal.value}</div>
                  </div>
                ))}
              </div>
              {!locked && (
                <div className="product-drawer-check-tags">
                  {checkoutChecks.map((check) => (
                    <span key={check}>{check}</span>
                  ))}
                </div>
              )}
            </div>
          </details>

          {!isPro && !locked && (
            <div className="product-drawer-pro-teaser">
              <div>
                <div className="product-drawer-micro">PROで詳しく</div>
                <p>相性・注意点・買う順番まで。</p>
              </div>
              <button className="motion-cta" onClick={() => onUpgrade("product_drawer_precision_teaser", p)}>
                詳しく見る
              </button>
            </div>
          )}

          {isPro && match && (
            <div className="product-drawer-section-card" style={{ borderColor: "#D4A85366" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>あなたとの相性</div>
                  <div style={{ fontSize: 13, color: "#150B00", fontWeight: 700 }}>あなたへの相性スコア</div>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: "#A8722A", fontWeight: 600 }}>{match.score}%</div>
              </div>
              {match.reasons.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {fitReasons.map((reason) => (
                    <span key={reason} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 999, background: "#F8F4EF", color: "#A8722A", border: "1px solid #EDE5DC", fontWeight: 700 }}>
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!locked && p.note && (
            <div style={{ background: m.color, borderLeft: `3px solid ${m.accent}`, padding: "12px 16px", marginBottom: 16, borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: m.dark, fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>━━ 買う前メモ</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: m.dark, margin: 0, fontWeight: 600 }}>{p.note}</p>
            </div>
          )}

          {!locked ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {p.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: m.color, color: m.dark, border: `1px solid ${m.accent}44` }}>{t}</span>
                ))}
              </div>

              {/* Video */}
              <a className="tap-card" href={p.video.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#1A0E08", borderRadius: 12, textDecoration: "none", marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${m.dark},${m.accent})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="play" size={14} stroke="#fff"/>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 12, color: "#FBF8F3", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.video.title}</div>
                  <div style={{ fontSize: 10, color: "#D4A853", marginTop: 2 }}>🔥 {p.video.views}回再生 · YouTube で見る</div>
                </div>
              </a>
            </>
          ) : (
            <div className="product-drawer-section-card" style={{ background: "#F8F4EF" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>PRO詳細</div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: "#6B5B4A", margin: 0 }}>
                無料では価格と評価まで。PROで相性、注意点、動画、楽天購入リンクまで開きます。
              </p>
            </div>
          )}

          {locked
            ? (
              <div className="product-drawer-section-card" style={{ borderColor: "#D4A85366" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#150B00", margin: "0 0 5px" }}>この商品はPRO詳細枠です</p>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "#8A7A6E", margin: "0 0 12px" }}>
                  購入前チェックを最後まで開いてから楽天へ進めます。
                </p>
                <GoldButton onClick={handleLockedUpgrade}>PROで開放</GoldButton>
              </div>
            )
            : (
              <div className="product-drawer-actions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="product-drawer-save-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    className="product-action-button"
                    onClick={() => updateProductSave("favorite")}
                    disabled={saveLoading !== null}
                    style={{ width: "100%", padding: "12px", background: savedFavorite ? "#1A0E08" : "#fff", color: savedFavorite ? "#D4A853" : "#150B00", border: "1px solid #EDE5DC", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: saveLoading ? "default" : "pointer" }}
                  >
                    {saveLoading === "favorite" ? "保存中..." : savedFavorite ? "♡ 保存済み" : "♡ お気に入り"}
                  </button>
                  <button
                    className="product-action-button"
                    onClick={() => updateProductSave("compare")}
                    disabled={saveLoading !== null}
                    style={{ width: "100%", padding: "12px", background: savedCompare ? "#1A0E08" : "#fff", color: savedCompare ? "#D4A853" : "#150B00", border: "1px solid #EDE5DC", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: saveLoading ? "default" : "pointer" }}
                  >
                    {saveLoading === "compare" ? "追加中..." : savedCompare ? "比較中" : "比較に追加"}
                  </button>
                </div>
                {saveMessage && (
                  <p style={{ fontSize: 11, color: saveMessage.includes("失敗") || saveMessage.includes("上限") ? "#C62828" : "#8A7A6E", textAlign: "center", margin: 0 }}>
                    {saveMessage}
                  </p>
                )}
                <a
                  className="motion-cta product-purchase-button"
                  href={purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePurchaseClick}
                  style={{ width: "100%", padding: "13px", background: "#BF0000", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" }}
                >
                  🛍 楽天で価格・在庫を見る
                </a>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
