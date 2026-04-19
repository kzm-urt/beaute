"use client";
import { cn } from "@/lib/utils";

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-wide text-[12px]">
      <span style={{ color: "#D4A853" }}>{"★".repeat(Math.round(rating))}</span>
      <span style={{ color: "#ddd" }}>{"☆".repeat(5 - Math.round(rating))}</span>
      <span className="text-[11px] ml-1" style={{ color: "#8A7A6E" }}>{rating}</span>
    </span>
  );
}

export function FreeBadge() {
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "#E8F5E9", color: "#388E3C" }}>FREE</span>
  );
}
export function ProBadge() {
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ background: "linear-gradient(135deg,#A8722A,#D4A853)" }}>PRO</span>
  );
}

export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150 border-[1.5px] m-0.5 select-none",
        active
          ? "bg-[#150B00] border-[#150B00] text-white"
          : "bg-white border-[#EDE5DC] text-[#8A7A6E] hover:border-[#A8722A] hover:text-[#A8722A]"
      )}
    >{label}</span>
  );
}

export function GoldButton({ children, onClick, disabled, className, small }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; small?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "font-bold rounded-[14px] text-white tracking-wide transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg",
        small ? "px-5 py-2 text-[12px]" : "w-full py-[13px] text-[14px]",
        className
      )}
      style={{ background: "linear-gradient(135deg,#A8722A,#D4A853)" }}
    >{children}</button>
  );
}

export function Input({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={cn("w-full border-[1.5px] border-[#EDE5DC] rounded-[12px] px-4 py-[11px]", "text-[14px] outline-none bg-white text-[#150B00]", "focus:border-[#D4A853] transition-colors", className)}
    />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border-[1.5px] border-[#EDE5DC] rounded-[12px] px-4 py-[11px] text-[14px] outline-none bg-white text-[#150B00] focus:border-[#D4A853] transition-colors">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-[16px] border border-[#EDE5DC] overflow-hidden", className)}
      style={{ boxShadow: "0 4px 24px rgba(21,11,0,0.07)" }}>
      {children}
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] shrink-0" style={{ color: "rgba(245,238,228,.5)" }}>スコア</span>
      <div className="flex-1 rounded-full h-2" style={{ background: "#EDE5DC" }}>
        <div className="h-2 rounded-full score-bar"
          style={{ width: `${score}%`, background: "linear-gradient(90deg,#A8722A,#D4A853)" }}/>
      </div>
      <span className="text-[22px] font-bold shrink-0" style={{ color: "#D4A853" }}>{score}</span>
    </div>
  );
}
