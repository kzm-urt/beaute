"use client";
import { useState } from "react";
import { BEAUTE_TOKENS } from "@/lib/constants";
import { Icon } from "@/components/ui";
import { ProductCard } from "@/components/features/ProductCard";
import { ProductPhoto, Stars, Tag, CatChip } from "@/components/ui";
import HomeTab from "@/components/features/HomeTab";
import SearchTab from "@/components/features/SearchTab";
import AnalyzeTab from "@/components/features/AnalyzeTab";
import LogTab from "@/components/features/LogTab";
import PremiumTab from "@/components/features/PremiumTab";
import type { CatKey, Product } from "@/types";
import { CAT_META } from "@/lib/constants";

type Tab = "home" | "search" | "analyze" | "log" | "premium";

const NAV_ITEMS: [Tab, string, string, string][] = [
  ["home",    "Home",        "ホーム",   "home"],
  ["search",  "Search",      "検索",     "search"],
  ["analyze", "Analyze",     "成分解析", "sparkle"],
  ["log",     "Journal",     "ログ",     "note"],
  ["premium", "Atelier Pro", "プラン",   "crown"],
];

function ProductDrawer({ p, onClose }: { p: Product; onClose: () => void }) {
  const meta = CAT_META[p.cat];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(21,11,0,0.5)", display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.25s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, background: BEAUTE_TOKENS.cream, height: "100%", overflowY: "auto", animation: "slideIn 0.3s ease" }}>
        <div style={{ position: "relative" }}>
          <ProductPhoto cat={p.cat} label={p.name} ratio={1.05} pad={40}/>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: BEAUTE_TOKENS.cream, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
            <Icon name="close" size={16}/>
          </button>
        </div>
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <CatChip cat={p.cat} size="sm"/>
            {p.editors && <Tag tone="gold" size="sm">EDITOR&apos;S PICK</Tag>}
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.brand} · N° {p.id.replace("p", "")}</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 30, margin: "6px 0 14px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.02em" }}>{p.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Stars value={p.rating} size={14}/>
            <span style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.12em" }}>{p.rating} · {p.reviews.toLocaleString()} REVIEWS</span>
          </div>
          <div style={{ marginTop: 22, padding: "18px 0", borderTop: `1px solid ${BEAUTE_TOKENS.border}`, borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 28, color: BEAUTE_TOKENS.text, fontWeight: 500 }}>{p.price}</span>
            <span style={{ fontSize: 10, letterSpacing: "0.22em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.volume} · TAX INCL.</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 8 }}>━━ 編集部ノート</div>
            <p style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 14, lineHeight: 1.8, color: BEAUTE_TOKENS.text, margin: 0, letterSpacing: "0.02em" }}>「{p.note}」</p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <button style={{ flex: 1, padding: "14px", background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, border: "none", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, fontFamily: "ui-monospace, Menlo, monospace", cursor: "pointer" }}>ADD TO RITUAL</button>
            <button style={{ padding: "14px", background: "transparent", border: `1px solid ${BEAUTE_TOKENS.text}`, cursor: "pointer", color: BEAUTE_TOKENS.text, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48 }}><Icon name="heart" size={16}/></button>
            <button style={{ padding: "14px", background: "transparent", border: `1px solid ${BEAUTE_TOKENS.text}`, cursor: "pointer", color: BEAUTE_TOKENS.text, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48 }}><Icon name="bookmark" size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeauteApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [activeCat, setActiveCat] = useState<CatKey | undefined>();

  const goPremium = () => setTab("premium");
  const gotoCat = (c: CatKey) => { setActiveCat(c); setTab("search"); };

  const headerIconBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", color: BEAUTE_TOKENS.text, display: "inline-flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", background: BEAUTE_TOKENS.bg, color: BEAUTE_TOKENS.text, fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, padding: "28px 0", position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 28px 32px", borderBottom: "1px solid rgba(212,168,83,0.15)" }}>
          <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: BEAUTE_TOKENS.cream }}>beauté</div>
          <div style={{ fontSize: 8, letterSpacing: "0.32em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace", marginTop: 6 }}>— EST. MMXXV</div>
        </div>
        <nav style={{ padding: "24px 16px", flex: 1 }}>
          {NAV_ITEMS.map(([k, en, jp, icon]) => {
            const active = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: active ? "rgba(212,168,83,0.12)" : "transparent", border: "none", borderLeft: active ? `2px solid ${BEAUTE_TOKENS.goldLight}` : "2px solid transparent", color: active ? BEAUTE_TOKENS.goldLight : "rgba(251,248,243,0.85)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s ease" }}>
                <Icon name={icon} size={18} stroke="currentColor"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 15, lineHeight: 1.1, fontWeight: 500, letterSpacing: "0.02em" }}>{en}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: active ? BEAUTE_TOKENS.goldLight : "rgba(251,248,243,0.45)", fontFamily: "ui-monospace, Menlo, monospace", marginTop: 2 }}>{jp}</div>
                </div>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "20px 22px", borderTop: "1px solid rgba(212,168,83,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #E8D7BE, #C89E6A)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 16, color: BEAUTE_TOKENS.navBg, fontWeight: 500 }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: BEAUTE_TOKENS.cream, fontWeight: 500 }}>凛子</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace" }}>PRO · 128 DAYS</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ overflow: "auto" }}>
        <header style={{ height: 56, padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: BEAUTE_TOKENS.bg, borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 11, letterSpacing: "0.2em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>
            <span>beauté ✦ {NAV_ITEMS.find(n => n[0] === tab)?.[1]}</span>
            <span>—</span>
            <span>2026年 春の特集</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <button style={headerIconBtn}><Icon name="search" size={16}/></button>
            <button style={headerIconBtn}><Icon name="bookmark" size={16}/></button>
            <button style={{ ...headerIconBtn, position: "relative" }}>
              <Icon name="bell" size={16}/>
              <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: BEAUTE_TOKENS.gold }}/>
            </button>
          </div>
        </header>

        {tab === "home"    && <HomeTab    onCat={gotoCat} onOpen={setOpenProduct} onOpenPremium={goPremium}/>}
        {tab === "search"  && <SearchTab  onOpen={setOpenProduct}/>}
        {tab === "analyze" && <AnalyzeTab/>}
        {tab === "log"     && <LogTab     onOpen={setOpenProduct}/>}
        {tab === "premium" && <PremiumTab/>}
      </main>

      {openProduct && <ProductDrawer p={openProduct} onClose={() => setOpenProduct(null)}/>}
    </div>
  );
}
