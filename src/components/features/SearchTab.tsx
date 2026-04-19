"use client";
import { useState, useMemo } from "react";
import { BEAUTE_TOKENS, CAT_ORDER, PRODUCTS } from "@/lib/constants";
import { CatChip, Icon } from "@/components/ui";
import { ProductCard } from "@/components/features/ProductCard";
import type { CatKey, Product } from "@/types";

export default function SearchTab({ onOpen }: { onOpen?: (p: Product) => void }) {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<CatKey>>(new Set());
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("editor");

  const toggleCat = (c: CatKey) => {
    const next = new Set(activeCats);
    if (next.has(c)) next.delete(c); else next.add(c);
    setActiveCats(next);
  };

  const filtered = useMemo(() => {
    let items = PRODUCTS;
    if (activeCats.size > 0) items = items.filter(p => activeCats.has(p.cat));
    if (query) items = items.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()));
    if (sortBy === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
    if (sortBy === "reviews") items = [...items].sort((a, b) => b.reviews - a.reviews);
    return items;
  }, [query, activeCats, sortBy]);

  const tabBtn = (active: boolean): React.CSSProperties => ({ background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", color: active ? BEAUTE_TOKENS.text : BEAUTE_TOKENS.textMuted, borderBottom: active ? `1px solid ${BEAUTE_TOKENS.gold}` : "1px solid transparent", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.12em" });

  return (
    <div>
      <div style={{ padding: "48px 48px 32px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, background: BEAUTE_TOKENS.cream }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ 検索</div>
        <h1 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 48, margin: "8px 0 24px", fontWeight: 400, lineHeight: 1.2, letterSpacing: "0.02em" }}>探す、見つける。</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: `1px solid ${BEAUTE_TOKENS.text}`, paddingBottom: 12, maxWidth: 640 }}>
          <Icon name="search" size={20} stroke={BEAUTE_TOKENS.text}/>
          <input placeholder="ブランド、製品名で検索..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 20, color: BEAUTE_TOKENS.text }}/>
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>⌘ K</span>
        </div>
      </div>

      <div style={{ padding: "28px 48px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}` }}>
        <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 14 }}>01 ━ カテゴリ</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CAT_ORDER.map(cat => <CatChip key={cat} cat={cat} active={activeCats.has(cat)} onClick={() => toggleCat(cat)} size="lg"/>)}
        </div>
      </div>

      <div style={{ padding: "20px 48px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.12em", color: BEAUTE_TOKENS.textMuted }}>
        <span style={{ color: BEAUTE_TOKENS.text, fontWeight: 600, letterSpacing: "0.2em" }}>02 ━ 絞り込み</span>
        {["all", "under5k", "5-15k", "luxury"].map(r => (
          <button key={r} onClick={() => setPriceRange(r)} style={{ ...tabBtn(priceRange === r), textTransform: "uppercase" }}>
            {r === "all" ? "価格すべて" : r === "under5k" ? "〜¥5,000" : r === "5-15k" ? "¥5〜15千" : "¥15,000〜"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ letterSpacing: "0.2em" }}>並び替え:</span>
          {([["editor", "編集部推薦"], ["rating", "評価順"], ["reviews", "人気順"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSortBy(k)} style={tabBtn(sortBy === k)}>{l}</button>
          ))}
        </span>
      </div>

      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "baseline" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>
            {String(filtered.length).padStart(2, "0")} 件の結果{activeCats.size > 0 && ` · ${activeCats.size} カテゴリ`}
          </div>
          <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 16, color: BEAUTE_TOKENS.textMuted }}>「心が動くものから、先に。」</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {filtered.map(p => <ProductCard key={p.id} p={p} variant="editorial" onOpen={onOpen}/>)}
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: "80px 0", textAlign: "center", fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 24, color: BEAUTE_TOKENS.textMuted, letterSpacing: "0.04em" }}>
            該当なし — 条件を見直してみてください。
          </div>
        )}
      </div>
    </div>
  );
}
