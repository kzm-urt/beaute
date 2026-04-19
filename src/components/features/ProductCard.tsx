"use client";
import { BEAUTE_TOKENS, CAT_META } from "@/lib/constants";
import { ProductPhoto, Stars } from "@/components/ui";
import type { Product } from "@/types";

export function ProductCard({ p, variant = "editorial", onOpen }: { p: Product; variant?: "editorial" | "minimal"; onOpen?: (p: Product) => void }) {
  const meta = CAT_META[p.cat];

  if (variant === "minimal") {
    return (
      <div onClick={() => onOpen?.(p)} style={{ background: BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.border}`, cursor: "pointer", transition: "all 0.25s ease", display: "flex", flexDirection: "column" }}
        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
        <ProductPhoto cat={p.cat} label={p.name} ratio={1} pad={24}/>
        <div style={{ padding: "14px 14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.accent }}/>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.brand}</span>
          </div>
          <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 16, lineHeight: 1.3, color: BEAUTE_TOKENS.text, fontWeight: 500, letterSpacing: "0.02em" }}>{p.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
            <span style={{ fontSize: 13, color: BEAUTE_TOKENS.text, fontWeight: 500 }}>{p.price}</span>
            <span style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted }}>{p.volume}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onOpen?.(p)} style={{ background: BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.border}`, cursor: "pointer", transition: "all 0.25s ease", display: "flex", flexDirection: "column", position: "relative" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(21,11,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: meta.color, borderBottom: `1px solid ${meta.accent}33` }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: meta.dark, fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600 }}>{meta.en}</span>
        {p.editors && <span style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: meta.dark, fontFamily: "ui-monospace, Menlo, monospace", padding: "2px 6px", border: `1px solid ${meta.dark}`, borderRadius: 2 }}>Editor&apos;s</span>}
      </div>
      <ProductPhoto cat={p.cat} label={p.name} ratio={1.1} pad={22}/>
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.brand} · N° {p.id.replace("p", "")}</div>
        <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 17, lineHeight: 1.35, color: BEAUTE_TOKENS.text, fontWeight: 500, letterSpacing: "0.02em" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, lineHeight: 1.4 }}>{p.note}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Stars value={p.rating} size={11}/>
          <span style={{ fontSize: 10, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.rating} · {p.reviews.toLocaleString()}</span>
        </div>
        <div style={{ marginTop: 8, paddingTop: 10, borderTop: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 15, color: BEAUTE_TOKENS.text, fontWeight: 600, fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif' }}>{p.price}</span>
          <span style={{ fontSize: 10, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.1em" }}>{p.volume}</span>
        </div>
      </div>
    </div>
  );
}

export function RailCard({ p, onOpen }: { p: Product; onOpen?: (p: Product) => void }) {
  const meta = CAT_META[p.cat];
  return (
    <div onClick={() => onOpen?.(p)} style={{ minWidth: 168, maxWidth: 168, cursor: "pointer", transition: "all 0.2s ease" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.92")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      <ProductPhoto cat={p.cat} label={p.name} ratio={1} pad={16}/>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: meta.accent, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.brand}</div>
        <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 14, lineHeight: 1.35, color: BEAUTE_TOKENS.text, fontWeight: 500, letterSpacing: "0.02em", marginTop: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{p.name}</div>
        <div style={{ fontSize: 10, color: BEAUTE_TOKENS.textMuted, marginTop: 4, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.price}</div>
      </div>
    </div>
  );
}
