"use client";
import { useState } from "react";
import { PRODUCTS, CAT_META, ALL_TAGS } from "@/lib/constants";
import { Chip, Input } from "@/components/ui";
import ProductCard from "./ProductCard";
import type { Category } from "@/types";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
  initialCat?: string;
}

type SortKey = "rating" | "rev" | "price";

export default function SearchTab({ isPro, onUpgrade, initialCat }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(initialCat ?? "すべて");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [showTags, setShowTags] = useState(false);

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
    <>
      {/* SEARCH BAR */}
      <div className="sticky top-[57px] z-[100] px-4 py-[10px] border-b border-[#EDE5DC]"
        style={{ background: "rgba(248,244,239,.95)", backdropFilter: "blur(8px)" }}>
        <Input value={query} onChange={setQuery} placeholder="🔍  製品名・ブランド・キーワード..."/>
      </div>

      <div className="px-4 pt-3">
        {/* CATEGORY FILTER — カテゴリ色付きチップ */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button onClick={() => setActiveCat("すべて")}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all"
            style={{ background: activeCat === "すべて" ? "#150B00" : "#fff", color: activeCat === "すべて" ? "#fff" : "#8A7A6E", border: "1.5px solid #EDE5DC" }}>
            すべて
          </button>
          {Object.entries(CAT_META).map(([name, m]) => {
            const active = activeCat === name;
            return (
              <button key={name} onClick={() => setActiveCat(name)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all"
                style={{ background: active ? m.dark : m.color, color: active ? m.color : m.dark, border: `1.5px solid ${active ? m.dark : m.accent}44` }}>
                <span>{m.icon}</span>{name}
              </button>
            );
          })}
        </div>

        {/* TAG ACCORDION */}
        <button onClick={() => setShowTags((s) => !s)}
          className="text-[12px] font-semibold mt-2 border-none bg-transparent cursor-pointer"
          style={{ color: "#A8722A" }}>
          {showTags ? "▾" : "▸"} タグで絞り込む{activeTags.length > 0 && ` (${activeTags.length}件)`}
        </button>
        {showTags && (
          <div className="flex flex-wrap mt-1.5">
            {ALL_TAGS.map((t) => (
              <Chip key={t} label={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)}/>
            ))}
          </div>
        )}

        {/* SORT */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px] shrink-0" style={{ color: "#8A7A6E" }}>並び替え:</span>
          {([ ["rating","評価"], ["rev","レビュー数"], ["price","価格"] ] as [SortKey, string][]).map(([v, l]) => (
            <Chip key={v} label={l} active={sortBy === v} onClick={() => setSortBy(v)}/>
          ))}
        </div>

        <p className="text-[12px] mt-2 mb-1" style={{ color: "#8A7A6E" }}>{filtered.length}件</p>
      </div>

      {/* RESULTS */}
      <div className="px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#8A7A6E" }}>
            <p className="text-[40px] mb-2">🔍</p>
            <p>条件に合う製品が見つかりません</p>
          </div>
        ) : (
          filtered.map((p) => (
            <ProductCard key={p.id} product={p} isPro={isPro} onUpgrade={onUpgrade}/>
          ))
        )}
      </div>
    </>
  );
}
