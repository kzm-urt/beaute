"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { CAT_META, ALL_TAGS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { getPersonalMatch, getProfileSignals } from "@/lib/personalization";
import { trackProductEvent } from "@/lib/productEvents";
import { Chip, Input, Stars, Icon, FreeBadge, ProBadge, ProductImage } from "@/components/ui";
import type { Category, PersonalPreferences, Product, UserProfile } from "@/types";

interface Props {
  isPro: boolean;
  onUpgrade: (sourceArea?: string, product?: Product) => void;
  onOpenProduct?: (p: Product) => void;
  initialMode?: BrowseMode;
  profile?: UserProfile;
  preferences?: PersonalPreferences | null;
}

type SortKey = "personal" | "rating" | "rev" | "price";
type BrowseMode = "search" | "ranking";

export default function SearchTab({ isPro, preferences, onUpgrade, onOpenProduct, initialMode = "search", profile }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("すべて");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>(isPro ? "personal" : "rating");
  const [mode, setMode] = useState<BrowseMode>(initialMode);
  const [showTags, setShowTags] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const filterKeyRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileSignals = useMemo(
    () => getProfileSignals(profile, isPro ? preferences : null),
    [profile, isPro, preferences]
  );

  useEffect(() => {
    setMode(initialMode);
    setPage(1);
  }, [initialMode]);

  useEffect(() => {
    if (isPro && sortBy === "rating" && preferences?.confidence) {
      setSortBy("personal");
    }
    if (!isPro && sortBy === "personal") {
      setSortBy("rating");
    }
  }, [isPro, preferences?.confidence, sortBy]);

  // 製品データをAPIから取得（フィルタ変更のたびにfetch）
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const filterKey = JSON.stringify({ query: query.trim(), activeCat, activeTags, mode, profileSignals: isPro ? profileSignals : [] });
    const resetPage = filterKey !== filterKeyRef.current;
    const requestPage = resetPage ? 1 : page;
    filterKeyRef.current = filterKey;
    if (resetPage && page !== 1) setPage(1);

    debounceRef.current = setTimeout(() => {
      if (requestPage === 1) setProductsLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      params.set("mode", mode);
      params.set("limit", "30");
      params.set("page", String(requestPage));
      if (activeCat !== "すべて") params.set("cat", activeCat);
      if (mode === "search" && query.trim()) params.set("q", query.trim());
      if (mode === "search" && activeTags.length > 0) {
        params.set("tags", activeTags.join(","));
      } else if (mode === "search" && isPro && activeCat === "すべて" && !query.trim() && profileSignals.length > 0) {
        params.set("tags", profileSignals.slice(0, 5).join(","));
      }

      fetch(`/api/products?${params}`)
        .then(r => r.json())
        .then(d => {
          const nextProducts: Product[] = d.products ?? [];
          setHasMore(Boolean(d.hasMore));
          setProducts((prev) => {
            if (requestPage === 1) return nextProducts;
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...nextProducts.filter((p) => !seen.has(p.id))];
          });
        })
        .finally(() => {
          setProductsLoading(false);
          setLoadingMore(false);
        });
    }, 300);
  }, [query, activeCat, activeTags, mode, page, isPro, profileSignals]);

  useEffect(() => {
    const saved = sessionStorage.getItem("beaute_initCat");
    if (saved) { setActiveCat(saved); sessionStorage.removeItem("beaute_initCat"); }
  }, []);

  const toggleTag = (t: string) =>
    setActiveTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // クライアント側ソートのみ（フィルタリングはAPI側）。ランキングは順位順を維持。
  const filtered = [...products].sort((a, b) =>
    mode === "ranking" ? (a.rank ?? 9999) - (b.rank ?? 9999) :
    sortBy === "personal" ? (getPersonalMatch(b, profile, preferences)?.score ?? 0) - (getPersonalMatch(a, profile, preferences)?.score ?? 0) :
    sortBy === "rating" ? b.rating - a.rating :
    sortBy === "rev"    ? b.rev - a.rev :
                          a.price - b.price
  );

  return (
    <div>
      {/* ── SEARCH / FILTER BAR ── */}
      <div style={{ position: "sticky", top: 52, zIndex: 15, background: "rgba(248,244,239,.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EDE5DC", padding: "12px 24px 10px" }} className="top-[52px] md:top-[52px] top-[52px]">
        <Input
          value={query}
          onChange={setQuery}
          placeholder={mode === "ranking" ? "🏆  ランキングはカテゴリを選んでチェック" : "🔍  製品名・ブランド・キーワード..."}
        />
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, padding: 4, marginBottom: 12 }}>
          {([["search", "商品検索"], ["ranking", "楽天ランキング"]] as [BrowseMode, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: 9,
                background: mode === value ? "#1A0E08" : "transparent",
                color: mode === value ? "#FBF8F3" : "#8A7A6E",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

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

        {mode === "search" && (
          <>
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
          </>
        )}

        {/* Sort + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          {mode === "search" ? (
            <>
              <span style={{ fontSize: 11, color: "#8A7A6E" }}>並び替え:</span>
              {([
                ...(isPro ? [["personal", "おすすめ順"] as [SortKey, string]] : []),
                ["rating", "評価"],
                ["rev", "レビュー数"],
                ["price", "価格"],
              ] as [SortKey, string][]).map(([v, l]) => (
                <Chip key={v} label={l} active={sortBy === v} onClick={() => setSortBy(v)}/>
              ))}
            </>
          ) : (
            <span style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.08em" }}>
              楽天市場リアルタイムランキング
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>{filtered.length} 件</span>
        </div>

        {profileSignals.length > 0 && (
          <div style={{
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 14,
            border: isPro ? "1px solid #D4A85366" : "1px solid #EDE5DC",
            background: isPro ? "linear-gradient(135deg,#1A0E08,#2C1A0E)" : "#fff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: isPro ? "#D4A853" : "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 3 }}>
                {isPro ? (preferences?.confidence ? "LOG PERSONAL SEARCH ON" : "PERSONAL SEARCH ON") : "PRO PERSONAL"}
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: isPro ? "rgba(251,248,243,.78)" : "#6B5B4A", margin: 0 }}>
                {isPro
                  ? `${profileSignals.slice(0, 3).join("・")}を優先して、楽天商品を並べています。${preferences?.summary ? ` ${preferences.summary}。` : ""}`
                  : `${profileSignals.slice(0, 3).join("・")}に合わせた精密おすすめはPROで解放されます。`}
              </p>
            </div>
            {!isPro && (
              <button onClick={() => onUpgrade("search_personal_teaser")} style={{ flexShrink: 0, border: "none", borderRadius: 999, padding: "8px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                試す
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RESULTS GRID ── */}
      <div style={{ padding: "16px 24px 40px" }}>
        {productsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "#F1EADE" }}>
                <div style={{ height: 160, background: "#EDE5DC" }}/>
                <div style={{ padding: 14 }}>
                  <div style={{ height: 10, background: "#EDE5DC", borderRadius: 4, marginBottom: 8 }}/>
                  <div style={{ height: 10, background: "#EDE5DC", borderRadius: 4, width: "70%", marginBottom: 8 }}/>
                  <div style={{ height: 10, background: "#EDE5DC", borderRadius: 4, width: "50%" }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8A7A6E" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 15 }}>条件に合う製品が見つかりません</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(p => (
              <SearchCard key={p.id} product={p} isPro={isPro} onUpgrade={onUpgrade} onOpen={onOpenProduct} profile={profile} preferences={isPro ? preferences : null} sourceArea={mode === "ranking" ? "ranking_card" : "search_card"}/>
            ))}
          </div>
        )}

        {!productsLoading && filtered.length > 0 && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loadingMore}
              style={{
                minWidth: 180,
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid #D4A853",
                background: loadingMore ? "#F1EADE" : "#1A0E08",
                color: loadingMore ? "#8A7A6E" : "#FBF8F3",
                fontSize: 13,
                fontWeight: 700,
                cursor: loadingMore ? "default" : "pointer",
              }}
            >
              {loadingMore ? "読み込み中..." : "もっと見る"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchCard({ product: p, isPro, onUpgrade, onOpen, profile, preferences, sourceArea }: {
  product: Product; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; onOpen?: (p: Product) => void; profile?: UserProfile; preferences?: PersonalPreferences | null; sourceArea: string;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const handleOpen = () => {
    if (locked) {
      void trackProductEvent({
        eventType: "locked_product_click",
        sourceArea,
        product: p,
        isPro,
        metadata: { rank: p.rank ?? null, matchScore: match?.score ?? null },
      });
      onUpgrade(sourceArea, p);
      return;
    }
    onOpen?.(p);
  };

  return (
    <div onClick={handleOpen}
      style={{ background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(21,11,0,.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(21,11,0,.05)"; }}>

      {/* Image */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} />
        {locked && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(21,11,0,.58),rgba(248,244,239,.18))" }}/>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>{p.free ? <FreeBadge/> : <ProBadge/>}</div>
        {p.rank && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "#1A0E08", color: "#D4A853", borderRadius: 12, padding: "3px 8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em" }}>
            #{p.rank}
          </div>
        )}
        {locked && (
          <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(26,14,8,.9)", color: "#F5EEE4", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
            PROで詳細・購入リンクを解放
          </div>
        )}
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

        {isPro && match && (
          <div style={{ margin: "2px 0 10px", padding: "8px 10px", borderRadius: 10, background: "#F8F4EF", border: "1px solid #EDE5DC" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#A8722A", letterSpacing: "0.08em" }}>あなた向け</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#150B00" }}>{match.score}%</span>
            </div>
            {match.reasons.length > 0 && (
              <div style={{ fontSize: 10, color: "#8A7A6E", marginTop: 3 }}>
                {match.reasons.slice(0, 2).join("・")} に反応
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
          {locked
            ? <span style={{ fontSize: 11, color: "#8A7A6E" }}>🔒 PROで見る</span>
            : <span style={{ fontSize: 11, color: m.dark, fontWeight: 600 }}>{p.url ? "楽天で見る →" : "詳細を見る →"}</span>
          }
        </div>
      </div>
    </div>
  );
}
