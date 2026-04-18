"use client";
import { CAT_META, PRODUCTS } from "@/lib/constants";
import type { UserProfile } from "@/types";
import ProductCard from "./ProductCard";

interface Props {
  profile: UserProfile;
  isPro: boolean;
  onUpgrade: () => void;
  onGoSearch: (cat?: string) => void;
}

export default function HomeTab({ profile, isPro, onUpgrade, onGoSearch }: Props) {
  // プロフィールに合わせたおすすめ抽出
  const recs = PRODUCTS.filter((p) => {
    if (profile.hairType && p.tags.includes(profile.hairType)) return true;
    if (profile.skinType && p.tags.some((t) => t.includes(profile.skinType.replace("肌", "")))) return true;
    if (profile.concerns.some((c) => p.tags.some((t) => t.includes(c.slice(0, 2))))) return true;
    return false;
  });
  const display = recs.length >= 3 ? recs.slice(0, 5) : PRODUCTS.filter((p) => p.free).slice(0, 5);

  return (
    <>
      {/* ── HERO ── */}
      <div className="mx-4 mt-4 rounded-[22px] overflow-hidden relative"
        style={{ background: "linear-gradient(145deg,#1A0E08 0%,#3D2010 60%,#6B3720 100%)", padding: "28px 24px" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 20%,rgba(212,168,83,.2) 0%,transparent 60%)" }} />
        <div className="relative">
          <p className="text-[10px] font-semibold tracking-[2px] mb-2" style={{ color: "rgba(212,168,83,.8)" }}>
            TODAY'S PICK
          </p>
          <h2 className="text-[22px] font-bold leading-[1.3] mb-1.5" style={{ color: "#F5EEE4" }}>
            あなたへの<br />おすすめ {display.length} 選
          </h2>
          {profile.age && (
            <p className="text-[11px]" style={{ color: "rgba(245,238,228,.45)" }}>
              {profile.age} · {profile.skinType} · {profile.hairType || "髪質未設定"}
            </p>
          )}
          <button
            onClick={() => onGoSearch()}
            className="mt-3.5 rounded-[10px] px-5 py-2 text-[12px] font-bold border-none cursor-pointer"
            style={{ background: "#D4A853", color: "#1A0E08" }}>
            全製品を見る →
          </button>
        </div>
      </div>

      {/* ── CATEGORY RAIL ── */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[13px] font-bold mb-3" style={{ color: "#150B00" }}>カテゴリ</p>
      </div>
      <div className="flex gap-[10px] overflow-x-auto hide-scrollbar px-4 pb-1">
        {Object.entries(CAT_META).map(([name, m]) => (
          <div key={name}
            onClick={() => onGoSearch(name)}
            className="shrink-0 w-[74px] rounded-[16px] py-3.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 border-2 border-transparent hover:-translate-y-0.5"
            style={{ background: m.color }}>
            <span className="text-[26px]">{m.icon}</span>
            <span className="text-[10px] font-semibold text-center leading-[1.3]" style={{ color: m.dark }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* ── TRENDING VIDEOS ── */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[13px] font-bold mb-3" style={{ color: "#150B00" }}>🔥 今週バズってる動画</p>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
        {PRODUCTS.slice(0, 7).map((p) => {
          const m = CAT_META[p.cat];
          return (
            <a key={p.id} href={p.video.url} target="_blank" rel="noreferrer"
              className="shrink-0 w-[158px] cursor-pointer no-underline transition-transform duration-200 hover:-translate-y-0.5">
              <div className="h-[88px] rounded-[12px] flex items-center justify-center text-[36px] relative overflow-hidden mb-1.5"
                style={{ background: `linear-gradient(145deg,${m.dark},${m.accent})` }}>
                {m.icon}
                <span className="absolute bottom-1.5 right-2 text-white text-[9px] px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,.7)" }}>{p.video.views}回</span>
              </div>
              <p className="text-[11px] font-medium leading-[1.35]" style={{ color: "#150B00" }}>
                {p.video.title.slice(0, 28)}…
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8A7A6E" }}>{p.cat}</p>
            </a>
          );
        })}
      </div>

      {/* ── RECOMMENDED ── */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[13px] font-bold mb-3.5" style={{ color: "#150B00" }}>✨ あなたへのおすすめ</p>
        {display.map((p) => (
          <ProductCard key={p.id} product={p} isPro={isPro} onUpgrade={onUpgrade} />
        ))}
      </div>
    </>
  );
}
