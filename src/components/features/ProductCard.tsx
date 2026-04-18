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
    <div className="relative rounded-[16px] overflow-hidden border border-[#EDE5DC] mb-[10px] fade-up"
      style={{ background: "#fff", boxShadow: "0 4px 24px rgba(21,11,0,0.07)" }}>

      {/* ── LOCK OVERLAY ── */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
          style={{ background: "rgba(248,244,239,0.9)", backdropFilter: "blur(4px)" }}>
          <span className="text-[28px]">🔒</span>
          <p className="text-[14px] font-bold" style={{ color: "#150B00" }}>PROプランで見る</p>
          <p className="text-[11px]" style={{ color: "#8A7A6E" }}>月680円でフル解禁</p>
          <GoldButton small onClick={onUpgrade} className="mt-1">アップグレード</GoldButton>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: m.color, padding: "16px 16px 12px" }}>
        {/* アイコン */}
        <div className="h-[62px] rounded-[12px] flex items-center justify-center text-[34px] mb-[10px]"
          style={{ background: `linear-gradient(135deg,${m.color},${m.accent}33)` }}>
          {m.icon}
        </div>
        {/* タイトル行 */}
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: m.dark }}>
              {p.brand} · {p.sub}
            </p>
            <h3 className="text-[15px] font-bold leading-[1.25]" style={{ color: "#150B00" }}>
              {p.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            {p.free ? <FreeBadge /> : <ProBadge />}
            <p className="text-[15px] font-bold mt-1" style={{ color: "#A8722A" }}>
              {formatPrice(p.price)}
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "12px 16px 14px" }}>
        {/* 評価 */}
        <div className="mb-2">
          <Stars rating={p.rating} />
          <span className="text-[11px] ml-1.5" style={{ color: "#8A7A6E" }}>
            {p.rev.toLocaleString()}件
          </span>
        </div>

        {/* タグ */}
        <div className="flex flex-wrap gap-1 mb-3">
          {p.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-[10px]"
              style={{ background: `${m.accent}18`, color: m.dark }}>
              {t}
            </span>
          ))}
        </div>

        {/* バズ動画リンク */}
        <a href={p.video.url} target="_blank" rel="noreferrer" className="block no-underline">
          <div className="flex items-center gap-[10px] rounded-[12px] px-3 py-2 border border-[#EDE5DC]"
            style={{ background: "#F8F4EF" }}>
            <div className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[13px] shrink-0"
              style={{ background: `linear-gradient(135deg,${m.accent},${m.color})` }}>
              ▶
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[11px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: "#150B00" }}>
                {p.video.title}
              </p>
              <p className="text-[10px]" style={{ color: "#8A7A6E" }}>
                🔥 再生 {p.video.views}回
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
