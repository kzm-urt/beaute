"use client";
import { useState, useEffect } from "react";
import { PRODUCTS, CAT_META, ALL_TAGS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Chip, Input, Stars, Icon, FreeBadge, ProBadge } from "@/components/ui";
import type { Category, Product } from "@/types";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
  onOpenProduct?: (p: Product) => void;
}

type SortKey = "rating" | "rev" | "price";

export default function SearchTab({ isPro, onUpgrade, onOpenProduct }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("すべて");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("beaute_initCat");
    if (saved) { setActiveCat(saved); sessionStorage.removeItem("beaute_initCat"); }
  }, []);

  const toggleTag = (t: string) =>
    setActiveTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const filtered = PRODUCTS
    .filter((p) => {
      const cOk = activeCat === "すべて" || p.cat === activeCat;
      const tOk = activeTags.length === 0 || activeTags.every((t) => p.tags.includes(t));
      const qOk = !query || p.name.includes(query) || p.brand.includes(query) || p.tags.some((t) => t.includes(query));
      return cOk && tOk && qOk;
    })
    .sort((a, b) =>
      sortBy === "rating" ? b.rating - a.rating :
      sortBy === "rev"    ? b.rev - a.rev :
                            a.price - b.price
    );

  return (
    <div>
      {/* ── SEARCH / FILTER BAR ── */}
      <div style={{ position: "sticky", top: 52, zIndex: 15, background: "rgba(248,244,239,.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EDE5DC", padding: "12px 24px 10px" }} className="top-[52px] md:top-[52px] top-[52px]">
        <Input value={query} onChange={setQuery} placeholder="🔍  製品名・ブランド・キーワード..."/>
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }} className="hide-scrollbar">
          <button onClick={() => setActiveCat("すべて")} style={{
            flexShrink: 0, padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid",
            background: activeCat === "すべて" ? "#150B00" : "#fff",
            color: activeCat === "すべて" ? "#fff" : "#8A7A6E",
            borderColor: activeCat === "すべて" ? "#150B00" : "#EDE5DC",
            cursor: "pointer",
          }}>すべて</button>
          {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m]) => {
            const active = activeCat === name;
            return (
              <button key={name} onClick={() => setActiveCat(name)} style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: active ? m.dark : m.color,
                color: active ? m.color : m.dark,
                border: `1.5px solid ${active ? m.dark : m.accent + "55"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <span>{m.icon}</span>{name}
              </button>
            );
          })}
        </div>

        {/* Tag accordion */}
        <button onClick={() => setShowTags(s => !s)} style={{ fontSize: 12, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer", color: "#A8722A", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name={showTags ? "chevDown" : "chev"} size={14} stroke="#A8722A" sw={2}/>
          タグで絞り込む{activeTags.length > 0 && ` (${activeTags.length}件)`}
        </button>
        {showTags && (
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 6 }}>
            {ALL_TAGS.map(t => <Chip key={t} label={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)}/>)}
          </div>
        )}

        {/* Sort + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: "#8A7A6E" }}>並び替え:</span>
          {([["rating", "評価"], ["rev", "レビュー数"], ["price", "価格"]] as [SortKey, string][]).map(([v, l]) => (
            <Chip key={v} label={l} active={sortBy === v} onClick={() => setSortBy(v)}/>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>{filtered.length} 件</span>
        </div>
      </div>

      {/* ── RESULTS GRID ── */}
      <div style={{ padding: "16px 24px 40px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8A7A6E" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 15 }}>条件に合う製品が見つかりません</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(p => (
              <SearchCard key={p.id} product={p} isPro={isPro} onUpgrade={onUpgrade} onOpen={onOpenProduct}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchCard({ product: p, isPro, onUpgrade, onOpen }: {
  product: Product; isPro: boolean; onUpgrade: () => void; onOpen?: (p: Product) => void;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;

  return (
    <div onClick={() => locked ? onUpgrade() : onOpen?.(p)}
      style={{ background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(21,11,0,.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(21,11,0,.05)"; }}>

      {/* Image */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: m.color }}>
        {locked
          ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 52, opacity: 0.2 }}>{m.icon}</span>
              <span style={{ fontSize: 24 }}>🔒</span>
            </div>
          : <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
        }
        {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(248,244,239,.55)" }}/>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>{p.free ? <FreeBadge/> : <ProBadge/>}</div>
      </div>

      {/* Category strip */}
      <div style={{ background: m.color, padding: "7px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: m.dark, letterSpacing: "0.05em" }}>{m.icon} {p.cat} · {p.sub}</span>
        <span style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace" }}>{p.brand}</span>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, fontWeight: 500, lineHeight: 1.3, color: "#150B00", margin: "0 0 6px" }}>{p.name}</h3>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "#6B5B4A", margin: "0 0 8px" }}>{p.desc}</p>
        <Stars rating={p.rating}/>
        <span style={{ fontSize: 11, color: "#8A7A6E", marginLeft: 6 }}>{p.rev.toLocaleString()}件</span>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0 10px" }}>
          {p.tags.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: m.color, color: m.dark, border: `1px solid ${m.accent}44` }}>{t}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
          {locked
            ? <span style={{ fontSize: 11, color: "#8A7A6E" }}>🔒 PROで見る</span>
            : <span style={{ fontSize: 11, color: m.dark, fontWeight: 600 }}>詳細を見る →</span>
          }
        </div>
      </div>
    </div>
  );
}
