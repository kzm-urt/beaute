"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePersonalPreferences } from "@/hooks/usePersonalPreferences";
import { CAT_META } from "@/lib/constants";
import { formatPrice, getProductKey, toRakutenAffiliateUrl } from "@/lib/utils";
import { getPersonalMatch } from "@/lib/personalization";
import { trackProductEvent } from "@/lib/productEvents";
import { supabase } from "@/lib/supabase";
import { Icon, Stars, FreeBadge, ProBadge, GoldButton, ProductImage } from "@/components/ui";
import AuthScreen from "./AuthScreen";
import ProfileScreen from "./ProfileScreen";
import HomeTab from "./HomeTab";
import SearchTab from "./SearchTab";
import AnalyzeTab from "./AnalyzeTab";
import LogTab from "./LogTab";
import PremiumTab from "./PremiumTab";
import KarteTab from "./KarteTab";
import SavedTab from "./SavedTab";
import type { PersonalPreferences, Product, UserProfile } from "@/types";

type Tab = "home" | "search" | "ranking" | "analyze" | "karte" | "saved" | "log" | "premium";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const NAV: { key: Tab; icon: Parameters<typeof Icon>[0]["name"]; jp: string; en: string }[] = [
  { key: "home",    icon: "home",    jp: "ホーム",   en: "Home"    },
  { key: "search",  icon: "search",  jp: "検索",     en: "Search"  },
  { key: "ranking", icon: "ranking", jp: "ランキング", en: "Ranking" },
  { key: "analyze", icon: "sparkle", jp: "成分解析", en: "Analyze" },
  { key: "karte",   icon: "karte",   jp: "カルテ",   en: "Karte"   },
  { key: "saved",   icon: "bookmark", jp: "保存",     en: "Saved"   },
  { key: "log",     icon: "note",    jp: "ログ",     en: "Journal" },
  { key: "premium", icon: "crown",   jp: "プラン",   en: "Pro"     },
];

export default function BeauteApp() {
  const { user, loading: authLoading, signIn, signUp, signOut, sendPasswordReset } = useAuth();
  const { profile, updateProfile, profileDone, setProfileDone, completeProfile, profileLoading, isPro, setIsPro, refreshProfile } = useProfile(user);
  const { preferences } = usePersonalPreferences(Boolean(user && profileDone && isPro));
  const [tab, setTab] = useState<Tab>("home");
  const [drawer, setDrawer] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "cancel"; message: string } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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

  // 認証・プロフィール読み込み中
  if (authLoading || (user && profileLoading)) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F4EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, color: "#A8722A" }}>beauté</div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onSendPasswordReset={sendPasswordReset} />;
  }

  // プロフィール未設定
  if (!profileDone)
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
      isPro,
    });
    setTab("premium");
  };
  const editProfile = () => setProfileDone(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F4EF", color: "#150B00", fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP",-apple-system,sans-serif' }}>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden md:flex" style={{ width: 220, background: "#1A0E08", color: "#FBF8F3", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid rgba(212,168,83,.15)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 500, color: "#FBF8F3" }}>beauté</div>
          <div style={{ fontSize: 8, letterSpacing: "0.32em", color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace,monospace", marginTop: 5 }}>— EST. MMXXV</div>
        </div>

        <nav style={{ padding: "20px 12px", flex: 1 }}>
          {NAV.map(({ key, icon, jp, en }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
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
            {user.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#FBF8F3", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: isPro ? "#D4A853" : "rgba(251,248,243,.4)", fontFamily: "ui-monospace,monospace" }}>{isPro ? "PRO MEMBER" : "FREE PLAN"}</div>
          </div>
          <button
            onClick={editProfile}
            title="プロフィール編集"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.4)", padding: 4, flexShrink: 0 }}
          >
            <Icon name="note" size={14} stroke="currentColor" sw={2} />
          </button>
          <button
            onClick={signOut}
            title="ログアウト"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(251,248,243,.4)", padding: 4, flexShrink: 0 }}
          >
            <Icon name="close" size={14} stroke="currentColor" sw={2} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Desktop top bar */}
        <header className="hidden md:flex" style={{ height: 52, padding: "0 40px", alignItems: "center", justifyContent: "space-between", background: "#F8F4EF", borderBottom: "1px solid #EDE5DC", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>
            beauté ✦ {NAV.find(n => n.key === tab)?.en} — {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setTab("ranking")} style={{ fontSize: 11, padding: "6px 14px", background: tab === "ranking" ? "#1A0E08" : "#fff", color: tab === "ranking" ? "#D4A853" : "#8A7A6E", border: "1px solid #EDE5DC", borderRadius: 20, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>ランキング</button>
            {!isPro
              ? <button onClick={() => upgrade("desktop_header")} style={{ fontSize: 11, padding: "6px 16px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>★ PRO へアップグレード</button>
              : <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", color: "#D4A853" }}>★ PRO MEMBER</span>
            }
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden" style={{ height: 52, padding: "0 16px", alignItems: "center", justifyContent: "space-between", background: "#1A0E08", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>beauté</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setTab("ranking")} style={{ fontSize: 11, padding: "5px 10px", background: tab === "ranking" ? "#D4A853" : "transparent", color: tab === "ranking" ? "#1A0E08" : "#D4A853", border: "1px solid #D4A853", borderRadius: 20, fontWeight: 700, cursor: "pointer" }}>ランキング</button>
            {!isPro && <button onClick={() => upgrade("mobile_header")} style={{ fontSize: 11, padding: "5px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer" }}>PRO</button>}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }} className="app-main">
          {tab === "home"    && <HomeTab    profile={profile} isPro={isPro} preferences={preferences} onUpgrade={upgrade} onGoSearch={goSearch} onOpenProduct={setDrawer}/>}
          {tab === "search"  && <SearchTab  isPro={isPro} preferences={preferences} onUpgrade={upgrade} onOpenProduct={setDrawer} initialMode="search" profile={profile}/>}
          {tab === "ranking" && <SearchTab  isPro={isPro} preferences={preferences} onUpgrade={upgrade} onOpenProduct={setDrawer} initialMode="ranking" profile={profile}/>}
          {tab === "analyze" && <AnalyzeTab isPro={isPro} onUpgrade={upgrade}/>}
          {tab === "karte"   && <KarteTab   profile={profile} isPro={isPro} preferences={preferences} onOpenProduct={setDrawer} onEditProfile={editProfile} onGoAnalyze={() => setTab("analyze")} onUpgrade={upgrade}/>}
          {tab === "saved"   && <SavedTab   isPro={isPro} onUpgrade={upgrade} onOpenProduct={setDrawer}/>}
          {tab === "log"     && <LogTab userId={user.id} isPro={isPro} onUpgrade={upgrade}/>}
          {tab === "premium" && <PremiumTab isPro={isPro} onUpgrade={() => setIsPro(true)} user={user}/>}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="flex md:hidden hide-scrollbar" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: 64,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "#1A0E08",
        borderTop: "1px solid rgba(212,168,83,.2)",
        zIndex: 30,
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>
        {NAV.map(({ key, icon, jp }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: "0 0 70px", minWidth: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#D4A853" : "rgba(251,248,243,.4)", transition: "color 0.15s",
            }}>
              <Icon name={icon} size={19} stroke="currentColor" sw={active ? 2 : 1.4}/>
              <span style={{ fontSize: 8, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{jp}</span>
            </button>
          );
        })}
      </nav>

      {/* ── PRODUCT DRAWER ── */}
      {drawer && <ProductDrawer product={drawer} onClose={() => setDrawer(null)} isPro={isPro} onUpgrade={upgrade} profile={profile} preferences={preferences}/>}

      {/* ── PWAインストールバナー ── */}
      {showInstallBanner && (
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

function ProductDrawer({ product: p, onClose, isPro, onUpgrade, profile, preferences }: {
  product: Product; onClose: () => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null;
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
  }, [productKey]);

  const updateProductSave = async (kind: "favorite" | "compare") => {
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(21,11,0,.55)", display: "flex", justifyContent: "flex-end" }}>
      <div className="product-drawer-panel" onClick={e => e.stopPropagation()} style={{ width: "min(520px,100vw)", background: "#FBF8F3", height: "100%", overflowY: "auto", animation: "slideInRight 0.28s ease" }}>

        {/* Image */}
        <div className="product-drawer-hero" style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: m.color }}>
          <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} style={{ position: "absolute", inset: 0 }}/>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.5) 0%, transparent 55%)" }}/>
          {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(21,11,0,.18)" }}/>}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={16} stroke="#150B00" sw={2}/>
          </button>
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontSize: 10, color: "rgba(251,248,243,.7)", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em" }}>{productSourceLabel} / {p.brand}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>{p.name}</div>
          </div>
        </div>

        {/* Body */}
        <div className="product-drawer-body" style={{ padding: "22px 26px 40px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: m.color, color: m.dark, fontWeight: 600 }}>{m.icon} {p.cat} · {p.sub}</span>
            {p.free ? <FreeBadge/> : <ProBadge/>}
            {p.rank && (
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, background: "#1A0E08", color: "#D4A853", fontWeight: 800 }}>
                楽天ランキング #{p.rank}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Stars rating={p.rating}/>
            <span style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>{p.rev.toLocaleString()} reviews</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid #EDE5DC", borderBottom: "1px solid #EDE5DC", marginBottom: 16 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: "#150B00", fontWeight: 500 }}>{formatPrice(p.price)}</span>
            <span style={{ fontSize: 10, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em" }}>税込</span>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#6B5B4A", marginBottom: 16 }}>{p.desc}</p>

          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>BUYING SIGNALS</div>
            <div className="product-drawer-signal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {trustSignals.map((signal) => (
                <div key={signal.label} style={{ background: "#F8F4EF", borderRadius: 12, padding: "10px 8px", textAlign: "center", minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: "#8A7A6E", marginBottom: 4 }}>{signal.label}</div>
                  <div style={{ fontSize: 14, color: "#150B00", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{signal.value}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "#8A7A6E", margin: "10px 0 0" }}>
              価格・レビュー・商品情報を見ながら、買う前の候補として比較できます。
            </p>
          </div>

          {isPro && match && (
            <div style={{ background: "#fff", border: "1px solid #D4A85366", borderRadius: 14, padding: "13px 15px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>PERSONAL FIT</div>
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
              <a href={p.video.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#1A0E08", borderRadius: 12, textDecoration: "none", marginBottom: 20 }}>
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
            <div style={{ background: "#F8F4EF", border: "1px solid #EDE5DC", borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>LOCKED DETAILS</div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: "#6B5B4A", margin: 0 }}>
                買う前メモ、タグ全文、関連レビュー動画、楽天購入リンクはPROで表示されます。
              </p>
            </div>
          )}

          {locked
            ? (
              <div style={{ background: "#fff", border: "1px solid #D4A85366", borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#150B00", margin: "0 0 5px" }}>この商品はPRO詳細枠です</p>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "#8A7A6E", margin: "0 0 12px" }}>
                  PROで楽天購入リンク、あなた向けスコア、比較リストを解放できます。気になる商品を買う前に一気に絞り込めます。
                </p>
                <GoldButton onClick={handleLockedUpgrade}>🔓 PROで全情報を解放する</GoldButton>
              </div>
            )
            : (
              <div className="product-drawer-actions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="product-drawer-save-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    onClick={() => updateProductSave("favorite")}
                    disabled={saveLoading !== null}
                    style={{ width: "100%", padding: "12px", background: savedFavorite ? "#1A0E08" : "#fff", color: savedFavorite ? "#D4A853" : "#150B00", border: "1px solid #EDE5DC", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: saveLoading ? "default" : "pointer" }}
                  >
                    {saveLoading === "favorite" ? "保存中..." : savedFavorite ? "♡ 保存済み" : "♡ お気に入り"}
                  </button>
                  <button
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
