"use client";
import { cn } from "@/lib/utils";

// ── Icon (SVG stroke-based) ──────────────────────────────────────────
type IconName =
  | "home" | "search" | "sparkle" | "note" | "crown" | "user"
  | "upload" | "camera" | "filter" | "chev" | "chevDown" | "play"
  | "plus" | "check" | "bell" | "heart" | "bookmark" | "arrow"
  | "dot" | "close" | "calendar" | "droplet";

export function Icon({ name, size = 18, stroke = "currentColor", sw = 1.4 }: {
  name: IconName; size?: number; stroke?: string; sw?: number;
}) {
  const s = { width: size, height: size, stroke, strokeWidth: sw, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const p: Record<IconName, React.ReactNode> = {
    home:     <><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></>,
    search:   <><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></>,
    sparkle:  <><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/></>,
    note:     <><path d="M4 4h12l4 4v12H4z"/><path d="M8 10h8M8 14h8M8 18h5"/></>,
    crown:    <><path d="M3 8l4 4 5-7 5 7 4-4v10H3z"/></>,
    user:     <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>,
    upload:   <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></>,
    camera:   <><path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="4"/></>,
    filter:   <><path d="M3 5h18M6 12h12M10 19h4"/></>,
    chev:     <><path d="M9 6l6 6-6 6"/></>,
    chevDown: <><path d="M6 9l6 6 6-6"/></>,
    play:     <><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/></>,
    plus:     <><path d="M12 5v14M5 12h14"/></>,
    check:    <><path d="M4 12l5 5L20 6"/></>,
    bell:     <><path d="M6 18h12l-1.5-2V11a4.5 4.5 0 00-9 0v5z"/><path d="M10 21h4"/></>,
    heart:    <><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/></>,
    bookmark: <><path d="M6 3h12v18l-6-4-6 4z"/></>,
    arrow:    <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    dot:      <><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></>,
    close:    <><path d="M5 5l14 14M19 5L5 19"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    droplet:  <><path d="M12 3c-3 5-6 8-6 12a6 6 0 0012 0c0-4-3-7-6-12z"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{p[name]}</svg>;
}

// ── Stars ────────────────────────────────────────────────────────────
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0,1,2,3,4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 16 16">
          <defs>
            <linearGradient id={`half${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" stopColor="#D4A853"/>
              <stop offset="50%" stopColor="#DDD"/>
            </linearGradient>
          </defs>
          <path
            d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.3 3.5 14.7l.9-5L.8 6.2l5-.7z"
            fill={i < full ? "#D4A853" : i === full && rating % 1 >= 0.5 ? `url(#half${i})` : "#DDD"}
          />
        </svg>
      ))}
      <span className="text-[11px] ml-1" style={{ color: "#8A7A6E" }}>{rating}</span>
    </span>
  );
}

// ── Badges ───────────────────────────────────────────────────────────
export function FreeBadge() {
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide" style={{ background: "#E8F5E9", color: "#2E7D32" }}>FREE</span>;
}
export function ProBadge() {
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-[#1A0E08] tracking-wide" style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)" }}>PRO</span>;
}

// ── Chip ─────────────────────────────────────────────────────────────
export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150 border-[1.5px] m-0.5 select-none",
        active
          ? "bg-[#150B00] border-[#150B00] text-white"
          : "bg-white border-[#EDE5DC] text-[#8A7A6E] hover:border-[#A8722A] hover:text-[#A8722A]"
      )}>
      {label}
    </span>
  );
}

// ── GoldButton ───────────────────────────────────────────────────────
export function GoldButton({ children, onClick, disabled, className, small }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; small?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "font-bold rounded-[12px] text-[#1A0E08] tracking-wide transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg",
        small ? "px-5 py-2 text-[12px]" : "w-full py-[13px] text-[14px]",
        className
      )}
      style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", boxShadow: "0 4px 16px rgba(168,114,42,.3)" }}>
      {children}
    </button>
  );
}

// ── DarkButton ───────────────────────────────────────────────────────
export function DarkButton({ children, onClick, disabled, className }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "w-full py-[13px] text-[14px] font-bold rounded-[12px] text-white tracking-wide transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90",
        className
      )}
      style={{ background: "#1A0E08" }}>
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={cn(
        "w-full border-[1.5px] border-[#EDE5DC] rounded-[12px] px-4 py-[11px]",
        "text-[14px] outline-none bg-white text-[#150B00] placeholder:text-[#B4A49A]",
        "focus:border-[#D4A853] transition-colors",
        className
      )}
    />
  );
}

// ── Select ───────────────────────────────────────────────────────────
export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border-[1.5px] border-[#EDE5DC] rounded-[12px] px-4 py-[11px] text-[14px] outline-none bg-white text-[#150B00] focus:border-[#D4A853] transition-colors">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

// ── Card ─────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-[16px] border border-[#EDE5DC] overflow-hidden", className)}
      style={{ boxShadow: "0 4px 24px rgba(21,11,0,0.07)" }}>
      {children}
    </div>
  );
}

// ── ScoreBar ─────────────────────────────────────────────────────────
export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] shrink-0" style={{ color: "rgba(245,238,228,.5)" }}>スコア</span>
      <div className="flex-1 rounded-full h-2" style={{ background: "rgba(255,255,255,0.15)" }}>
        <div className="h-2 rounded-full score-bar"
          style={{ width: `${score}%`, background: "linear-gradient(90deg,#A8722A,#D4A853)" }}/>
      </div>
      <span className="text-[22px] font-bold shrink-0" style={{ color: "#D4A853" }}>{score}</span>
    </div>
  );
}
