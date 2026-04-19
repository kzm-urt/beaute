"use client";
import { CAT_META } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import { Stars, FreeBadge, ProBadge, GoldButton } from "@/components/ui";

interface Props {
  product: Product;
  isPro: boolean;
  onUpgrade: () => void;
}

export default function ProductCard({ product: p, isPro, onUpgrade }: Props) {
  const locked = !p.free && !isPro;
  const m = CAT_META[p.cat];

  return (
    <div className="relative rounded-[18px] overflow-hidden mb-[10px] fade-up"
      style={{ background: "#fff", border: `1px solid ${m.accent}33`, boxShadow: `0 4px 24px rgba(21,11,0,0.06)` }}>

      {/* LOCK OVERLAY */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
          style={{ background: "rgba(248,244,239,0.92)", backdropFilter: "blur(4px)" }}>
          <span className="text-[28px]">🔒</span>
          <p className="text-[14px] font-bold" style={{ color: "#150B00" }}>PROプランで見る</p>
          <p className="text-[11px]" style={{ color: "#8A7A6E" }}>月680円でフル解禁</p>
          <GoldButton small onClick={onUpgrade} className="mt-1">アップグレード</GoldButton>
        </div>
      )}

      {/* CATEGORY STRIP (Claude Design の editorial カードスタイル) */}
      <div style={{ background: m.color, padding: "8px 14px", borderBottom: `1px solid ${m.accent}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="text-[18px]">{m.icon}</span>
          <div>
            <p className="text-[10px] font-bold tracking-[.5px]" style={{ color: m.dark }}>{p.cat} · {p.sub}</p>
            <p className="text-[9px]" style={{ color: m.accent }}>{p.brand}</p>
          </div>
        </div>
        <div className="text-right">
          {p.free ? <FreeBadge/> : <ProBadge/>}
          <p className="text-[16px] font-bold mt-0.5" style={{ color: "#A8722A" }}>{formatPrice(p.price)}</p>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 className="text-[15px] font-bold leading-[1.3] mb-1" style={{ color: "#150B00" }}>{p.name}</h3>
        <p className="text-[12px] leading-[1.6] mb-2" style={{ color: "#6B5B4A" }}>{p.desc}</p>

        {/* 評価 */}
        <div className="flex items-center gap-2 mb-2">
          <Stars rating={p.rating}/>
          <span className="text-[11px]" style={{ color: "#8A7A6E" }}>{p.rev.toLocaleString()}件</span>
        </div>

        {/* タグ — カテゴリカラー付き */}
        <div className="flex flex-wrap gap-1 mb-3">
          {p.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: m.color, color: m.dark, border: `1px solid ${m.accent}44` }}>
              {t}
            </span>
          ))}
        </div>

        {/* バズ動画リンク */}
        <a href={p.video.url} target="_blank" rel="noreferrer" className="block no-underline">
          <div className="flex items-center gap-[10px] rounded-[12px] px-3 py-2"
            style={{ background: m.color, border: `1px solid ${m.accent}33` }}>
            <div className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[14px] shrink-0 font-bold"
              style={{ background: `linear-gradient(135deg,${m.dark},${m.accent})`, color: "#fff" }}>
              ▶
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "#150B00" }}>
                {p.video.title}
              </p>
              <p className="text-[10px]" style={{ color: m.accent }}>🔥 再生 {p.video.views}回</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
