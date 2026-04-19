"use client";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { CAT_META } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Icon, Stars, FreeBadge, ProBadge, GoldButton } from "@/components/ui";
import ProfileScreen from "./ProfileScreen";
import HomeTab from "./HomeTab";
import SearchTab from "./SearchTab";
import AnalyzeTab from "./AnalyzeTab";
import LogTab from "./LogTab";
import PremiumTab from "./PremiumTab";
import type { Product } from "@/types";

type Tab = "home" | "search" | "analyze" | "log" | "premium";

const NAV: { key: Tab; icon: Parameters<typeof Icon>[0]["name"]; jp: string; en: string }[] = [
  { key: "home",    icon: "home",    jp: "ホーム",   en: "Home"    },
  { key: "search",  icon: "search",  jp: "検索",     en: "Search"  },
  { key: "analyze", icon: "sparkle", jp: "成分解析", en: "Analyze" },
  { key: "log",     icon: "note",    jp: "ログ",     en: "Journal" },
  { key: "premium", icon: "crown",   jp: "プラン",   en: "Pro"     },
];

export default function BeauteApp() {
  const { profile, updateProfile, profileDone, completeProfile } = useProfile();
  const [tab, setTab] = useState<Tab>("home");
  const [isPro, setIsPro] = useState(false);
  const [drawer, setDrawer] = useState<Product | null>(null);

  if (!profileDone && !profile.age && !profile.skinType)
    return <ProfileScreen profile={profile} onChange={updateProfile} onComplete={completeProfile}/>;

  const goSearch = (cat?: string) => {
    if (cat) sessionStorage.setItem("beaute_initCat", cat);
    setTab("search");
  };
  const upgrade = () => setTab("premium");

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
            {profile.skinType?.[0] || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#FBF8F3", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.skinType || "ゲスト"}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: isPro ? "#D4A853" : "rgba(251,248,243,.4)", fontFamily: "ui-monospace,monospace" }}>{isPro ? "PRO MEMBER" : "FREE PLAN"}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Desktop top bar */}
        <header className="hidden md:flex" style={{ height: 52, padding: "0 40px", alignItems: "center", justifyContent: "space-between", background: "#F8F4EF", borderBottom: "1px solid #EDE5DC", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>
            beauté ✦ {NAV.find(n => n.key === tab)?.en} — {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
          </div>
          {!isPro
            ? <button onClick={upgrade} style={{ fontSize: 11, padding: "6px 16px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>★ PRO へアップグレード</button>
            : <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", color: "#D4A853" }}>★ PRO MEMBER</span>
          }
        </header>

        {/* Mobile header */}
        <header className="flex md:hidden" style={{ height: 52, padding: "0 16px", alignItems: "center", justifyContent: "space-between", background: "#1A0E08", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>beauté</div>
          {!isPro && <button onClick={upgrade} style={{ fontSize: 11, padding: "5px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer" }}>PRO</button>}
        </header>

        <main style={{ flex: 1, overflowY: "auto", paddingBottom: 0 }} className="pb-16 md:pb-0">
          {tab === "home"    && <HomeTab    profile={profile} isPro={isPro} onUpgrade={upgrade} onGoSearch={goSearch} onOpenProduct={setDrawer}/>}
          {tab === "search"  && <SearchTab  isPro={isPro} onUpgrade={upgrade} onOpenProduct={setDrawer}/>}
          {tab === "analyze" && <AnalyzeTab isPro={isPro} onUpgrade={upgrade}/>}
          {tab === "log"     && <LogTab/>}
          {tab === "premium" && <PremiumTab isPro={isPro} onUpgrade={() => setIsPro(true)}/>}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="flex md:hidden" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 60, background: "#1A0E08", borderTop: "1px solid rgba(212,168,83,.2)", zIndex: 30 }}>
        {NAV.map(({ key, icon, jp }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#D4A853" : "rgba(251,248,243,.4)", transition: "color 0.15s",
            }}>
              <Icon name={icon} size={20} stroke="currentColor" sw={active ? 2 : 1.4}/>
              <span style={{ fontSize: 9, letterSpacing: "0.05em" }}>{jp}</span>
            </button>
          );
        })}
      </nav>

      {/* ── PRODUCT DRAWER ── */}
      {drawer && <ProductDrawer product={drawer} onClose={() => setDrawer(null)} isPro={isPro} onUpgrade={upgrade}/>}
    </div>
  );
}

function ProductDrawer({ product: p, onClose, isPro, onUpgrade }: {
  product: Product; onClose: () => void; isPro: boolean; onUpgrade: () => void;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(21,11,0,.55)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(480px,100vw)", background: "#FBF8F3", height: "100%", overflowY: "auto", animation: "slideInRight 0.28s ease" }}>

        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: m.color }}>
          {locked
            ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 72, opacity: 0.25 }}>{m.icon}</span></div>
            : <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.5) 0%, transparent 55%)" }}/>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={16} stroke="#150B00" sw={2}/>
          </button>
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontSize: 10, color: "rgba(251,248,243,.7)", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em" }}>{p.brand}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>{p.name}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 26px 40px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: m.color, color: m.dark, fontWeight: 600 }}>{m.icon} {p.cat} · {p.sub}</span>
            {p.free ? <FreeBadge/> : <ProBadge/>}
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

          {p.note && (
            <div style={{ background: m.color, borderLeft: `3px solid ${m.accent}`, padding: "12px 16px", marginBottom: 16, borderRadius: "0 8px 8px 0" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.22em", color: m.dark, fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>━━ 編集部ノート</div>
              <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 14, lineHeight: 1.7, color: m.dark, margin: 0 }}>「{p.note}」</p>
            </div>
          )}

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

          {locked
            ? <GoldButton onClick={onUpgrade}>🔓 PROで全情報を解放する</GoldButton>
            : <button style={{ width: "100%", padding: "13px", background: "#1A0E08", color: "#FBF8F3", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>ログに記録する →</button>
          }
        </div>
      </div>
    </div>
  );
}
