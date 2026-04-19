"use client";
import { BEAUTE_TOKENS, CAT_META } from "@/lib/constants";
import type { CatKey } from "@/types";

export function ProductPhoto({
  cat, label, ratio = 1, radius = 0, pad = 20,
}: {
  cat: CatKey; label: string; ratio?: number; radius?: number; pad?: number;
}) {
  const meta = CAT_META[cat];
  const stripe = meta.accent + "22";
  const stripeDark = meta.accent + "33";
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: ratio,
      background: `repeating-linear-gradient(135deg, ${meta.color} 0 14px, ${stripe} 14px 28px)`,
      borderRadius: radius, overflow: "hidden",
      border: `1px solid ${stripeDark}`,
    }}>
      <div style={{
        position: "absolute",
        inset: `${pad}px ${pad * 1.5}px`,
        background: `linear-gradient(180deg, ${meta.color} 0%, ${meta.accent}22 100%)`,
        border: `1px dashed ${meta.accent}66`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <div style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
          color: meta.dark, opacity: 0.75, textAlign: "center", padding: "0 6px",
        }}>{label || "product shot"}</div>
        <div style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 8, letterSpacing: "0.2em", color: meta.dark, opacity: 0.4,
        }}>{meta.en.toLowerCase()}</div>
      </div>
    </div>
  );
}

export function EditorialPhoto({
  label = "editorial image", tone = "warm", style: extraStyle, children,
}: {
  label?: string; tone?: "warm" | "cool" | "blush" | "noir";
  style?: React.CSSProperties; children?: React.ReactNode;
}) {
  const gradients: Record<string, string> = {
    warm: "linear-gradient(135deg, #E8D7BE 0%, #C89E6A 40%, #6B4A2A 100%)",
    cool: "linear-gradient(135deg, #D6DEE6 0%, #8E9CA8 50%, #2C3640 100%)",
    blush: "linear-gradient(135deg, #F5DCD5 0%, #D99E8E 45%, #7A3929 100%)",
    noir: "linear-gradient(135deg, #3A2A20 0%, #150B00 100%)",
  };
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: gradients[tone] || gradients.warm,
      overflow: "hidden", ...extraStyle,
    }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, transparent 0 40px, rgba(255,255,255,0.04) 40px 80px)" }}/>
      <div style={{ position: "absolute", inset: "15% 25%", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: 4 }}/>
      <div style={{ position: "absolute", top: 12, left: 12, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{label}</div>
      {children}
    </div>
  );
}

export function CatChip({ cat, active = false, onClick, size = "md" }: { cat: CatKey; active?: boolean; onClick?: () => void; size?: "sm" | "md" | "lg" }) {
  const meta = CAT_META[cat];
  const sizes = { sm: { py: 4, px: 10, fs: 11, dot: 6 }, md: { py: 6, px: 14, fs: 12, dot: 7 }, lg: { py: 9, px: 18, fs: 13, dot: 8 } };
  const s = sizes[size];
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: `${s.py}px ${s.px}px`, borderRadius: 999, border: `1px solid ${active ? meta.dark : meta.accent + "55"}`, background: active ? meta.dark : meta.color, color: active ? meta.color : meta.dark, fontSize: s.fs, letterSpacing: "0.05em", cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
      <span style={{ width: s.dot, height: s.dot, borderRadius: "50%", background: active ? meta.color : meta.accent }}/>
      {meta.jp}
    </button>
  );
}

export function Tag({ children, tone = "neutral", size = "sm" }: { children: React.ReactNode; tone?: "neutral" | "gold" | "dark" | "outline"; size?: "xs" | "sm" | "md" }) {
  const tones = { neutral: { bg: BEAUTE_TOKENS.cream, fg: BEAUTE_TOKENS.text, border: BEAUTE_TOKENS.border }, gold: { bg: "#F5E8D0", fg: "#6B4A10", border: "#D4A85355" }, dark: { bg: BEAUTE_TOKENS.navBg, fg: "#F5E8D0", border: "transparent" }, outline: { bg: "transparent", fg: BEAUTE_TOKENS.text, border: BEAUTE_TOKENS.borderDark } };
  const t = tones[tone];
  const sizes = { xs: { py: 2, px: 6, fs: 9 }, sm: { py: 3, px: 8, fs: 10 }, md: { py: 5, px: 12, fs: 11 } };
  const s = sizes[size];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: `${s.py}px ${s.px}px`, borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.border}`, fontSize: s.fs, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 500 }}>{children}</span>
  );
}

export function Stars({ value = 4.5, size = 12, color }: { value?: number; size?: number; color?: string }) {
  const c = color || BEAUTE_TOKENS.gold;
  const dim = BEAUTE_TOKENS.border;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[0, 1, 2, 3, 4].map(i => {
        let fill = dim;
        if (i < full) fill = c;
        else if (i === full && half) fill = `url(#half-${size})`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 16 16">
            <defs><linearGradient id={`half-${size}`} x1="0" x2="1" y1="0" y2="0"><stop offset="50%" stopColor={c}/><stop offset="50%" stopColor={dim}/></linearGradient></defs>
            <path d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.3 3.5 14.7l.9-5L.8 6.2l5-.7z" fill={fill}/>
          </svg>
        );
      })}
    </span>
  );
}

export function Icon({ name, size = 18, stroke = "currentColor", sw = 1.4 }: { name: string; size?: number; stroke?: string; sw?: number }) {
  const s = { width: size, height: size, stroke, strokeWidth: sw, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    home:    <><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></>,
    search:  <><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></>,
    sparkle: <><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/></>,
    note:    <><path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8M8 18h5"/></>,
    crown:   <><path d="M3 8l4 4 5-7 5 7 4-4v10H3z"/></>,
    upload:  <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></>,
    camera:  <><path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="4"/></>,
    plus:    <><path d="M12 5v14M5 12h14"/></>,
    check:   <><path d="M4 12l5 5L20 6"/></>,
    bell:    <><path d="M6 18h12l-1.5-2V11a4.5 4.5 0 00-9 0v5z"/><path d="M10 21h4"/></>,
    heart:   <><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></>,
    bookmark:<><path d="M6 3h12v18l-6-4-6 4z"/></>,
    close:   <><path d="M5 5l14 14M19 5L5 19"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s as React.CSSProperties}>{paths[name]}</svg>;
}
