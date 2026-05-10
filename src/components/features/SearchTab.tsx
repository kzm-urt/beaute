"use client";
import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { CAT_META, ALL_TAGS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { getPersonalMatch, getProfileSignals } from "@/lib/personalization";
import { getProductInsight } from "@/lib/productInsights";
import { trackProductEvent } from "@/lib/productEvents";
import { Chip, Input, Stars, Icon, FreeBadge, ProBadge, ProductImage } from "@/components/ui";
import type { Category, PersonalPreferences, Product, UserProfile } from "@/types";

interface Props {
  isPro: boolean;
  isGuest?: boolean;
  onUpgrade: (sourceArea?: string, product?: Product) => void;
  onAuth?: () => void;
  onOpenProduct?: (p: Product) => void;
  initialMode?: BrowseMode;
  initialQuery?: string;
  profile?: UserProfile;
  preferences?: PersonalPreferences | null;
}

type SortKey = "personal" | "rating" | "rev" | "price";
type BrowseMode = "search" | "ranking";

const ALL_CATEGORY = "\u3059\u3079\u3066";
const DEFAULT_CATEGORY = Object.keys(CAT_META)[0] as Category;
const RESULTS_PAGE_SIZE = 18;

export default function SearchTab({ isPro, isGuest = false, preferences, onUpgrade, onAuth, onOpenProduct, initialMode = "search", initialQuery = "", profile }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCat, setActiveCat] = useState<string>(ALL_CATEGORY);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>(isPro ? "personal" : "rating");
  const [mode, setMode] = useState<BrowseMode>(initialMode);
  const [showTags, setShowTags] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPlanPath, setShowPlanPath] = useState(false);
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
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

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
    const controller = new AbortController();
    let ignore = false;

    const filterKey = JSON.stringify({ query: query.trim(), activeCat, activeTags, mode, profileSignals: isPro ? profileSignals : [] });
    const resetPage = filterKey !== filterKeyRef.current;
    const requestPage = resetPage ? 1 : page;
    filterKeyRef.current = filterKey;
    if (resetPage && page !== 1) setPage(1);

    debounceRef.current = setTimeout(() => {
      if (requestPage === 1) setProductsLoading(true);
      else setLoadingMore(true);

      const trimmedQuery = query.trim();
      const showRankingAsDefault = mode === "search" && !trimmedQuery && activeTags.length === 0;
      const requestMode = showRankingAsDefault && !isPro ? "search" : showRankingAsDefault ? "ranking" : mode;
      const params = new URLSearchParams();
      params.set("mode", requestMode);
      params.set("limit", String(RESULTS_PAGE_SIZE));
      params.set("page", String(requestPage));
      if (showRankingAsDefault && !isPro) params.set("free", "true");
      if (activeCat !== ALL_CATEGORY) params.set("cat", activeCat);
      if (!showRankingAsDefault && mode === "search" && trimmedQuery) params.set("q", trimmedQuery);
      if (!showRankingAsDefault && mode === "search" && activeTags.length > 0) {
        params.set("tags", activeTags.join(","));
      }

      fetch(`/api/products?${params}`, { signal: controller.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error("products request failed");
          return r.json();
        })
        .then(d => {
          if (ignore) return;
          const nextProducts: Product[] = d.products ?? [];
          setHasMore(Boolean(d.hasMore));
          setProducts((prev) => {
            if (requestPage === 1) return nextProducts;
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...nextProducts.filter((p) => !seen.has(p.id))];
          });
        })
        .catch((error) => {
          if (!ignore && error?.name !== "AbortError") {
            if (requestPage === 1) setProducts([]);
            setHasMore(false);
          }
        })
        .finally(() => {
          if (ignore) return;
          setProductsLoading(false);
          setLoadingMore(false);
        });
    }, requestPage === 1 ? 180 : 0);

    return () => {
      ignore = true;
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeCat, activeTags, mode, page, isPro, profileSignals]);

  useEffect(() => {
    const saved = sessionStorage.getItem("beaute_initCat");
    if (saved) {
      if (saved === ALL_CATEGORY || saved in CAT_META) setActiveCat(saved);
      sessionStorage.removeItem("beaute_initCat");
    }
  }, []);

  const toggleTag = (t: string) =>
    setActiveTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const resetFilters = () => {
    setQuery("");
    setActiveCat(ALL_CATEGORY);
    setActiveTags([]);
    setMode("ranking");
    setPage(1);
  };

  const showDefaultCategory = () => {
    setQuery("");
    setActiveCat(DEFAULT_CATEGORY);
    setActiveTags([]);
    setMode("ranking");
    setPage(1);
  };

  // クライアント側ソートのみ（フィルタリングはAPI側）。ランキングは順位順を維持。
  const filtered = useMemo(() => {
    const scores = new Map<number, number>();
    if (sortBy === "personal") {
      for (const product of products) {
        scores.set(product.id, getPersonalMatch(product, profile, preferences)?.score ?? 0);
      }
    }

    return [...products].sort((a, b) =>
      mode === "ranking" ? (a.rank ?? 9999) - (b.rank ?? 9999) :
      sortBy === "personal" ? (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) :
      sortBy === "rating" ? b.rating - a.rating :
      sortBy === "rev"    ? b.rev - a.rev :
                            a.price - b.price
    );
  }, [products, mode, sortBy, profile, preferences]);
  const sortLabel =
    mode === "ranking" ? "ランキング順" :
    sortBy === "personal" ? "おすすめ順" :
    sortBy === "rating" ? "評価順" :
    sortBy === "rev" ? "レビュー順" :
    "価格順";
  const activeSummary = [
    mode === "ranking" ? "楽天ランキング" : "商品検索",
    activeCat !== ALL_CATEGORY ? activeCat : "すべて",
    activeTags.length > 0 ? `タグ${activeTags.length}` : null,
    sortLabel,
  ].filter(Boolean).join(" / ");

  return (
    <div className="motion-fade-scale">
      {/* ── SEARCH / FILTER BAR ── */}
      <div style={{ position: "sticky", top: 52, zIndex: 15, background: "rgba(248,244,239,.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EDE5DC", padding: "12px 24px 10px" }} className="search-filter-bar motion-reveal">
        <Input
          value={query}
          onChange={setQuery}
          placeholder={mode === "ranking" ? "🏆  ランキングはカテゴリを選んでチェック" : "🔍  製品名・ブランド・キーワード..."}
        />
      </div>

      <div className="search-browse-controls" style={{ padding: "12px 24px 0" }}>
        <div className="search-control-row">
          <div className="search-mode-switch" style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, padding: 4 }}>
            {([["search", "商品検索"], ["ranking", "楽天ランキング"]] as [BrowseMode, string][]).map(([value, label]) => (
              <button
                className="motion-nav-button"
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

          <div className="search-control-actions">
            <button
              className={`search-small-toggle ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters((s) => !s)}
              type="button"
            >
              絞り込み{activeTags.length > 0 ? ` ${activeTags.length}` : ""}
            </button>
            <button
              className={`search-small-toggle ${showPlanPath ? "active" : ""}`}
              onClick={() => setShowPlanPath((s) => !s)}
              type="button"
            >
              {isPro ? "PRO" : isGuest ? "ゲスト" : "無料"}
            </button>
          </div>
        </div>

        <div className="search-active-summary">
          <span>{activeSummary}</span>
          <strong>{productsLoading ? "取得中..." : `${filtered.length} 件`}</strong>
        </div>

        {showFilters && (
          <div className="search-advanced-panel motion-reveal">
            {/* Category filter */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }} className="search-category-rail hide-scrollbar">
              <button className="motion-nav-button" onClick={() => setActiveCat(ALL_CATEGORY)} style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid",
                background: activeCat === ALL_CATEGORY ? "#150B00" : "#fff",
                color: activeCat === ALL_CATEGORY ? "#fff" : "#8A7A6E",
                borderColor: activeCat === ALL_CATEGORY ? "#150B00" : "#EDE5DC",
                cursor: "pointer",
              }}>すべて</button>
              {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m]) => {
                const active = activeCat === name;
                return (
                  <button key={name} className="motion-nav-button" onClick={() => setActiveCat(name)} style={{
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
                <button className="motion-nav-button" onClick={() => setShowTags(s => !s)} style={{ fontSize: 12, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer", color: "#A8722A", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}>
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
            <div className="search-sort-row" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
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
            </div>

            {profileSignals.length > 0 && (
              <div className="search-personal-panel" style={{
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
                    {isPro ? (preferences?.confidence ? "記録から並び替え" : "パーソナルから並び替え") : "PROで詳しく"}
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: isPro ? "rgba(251,248,243,.78)" : "#6B5B4A", margin: 0 }}>
                    {isPro
                      ? `${profileSignals.slice(0, 3).join("・")}を優先中。`
                      : `${profileSignals.slice(0, 3).join("・")}まで見た並び替えはPRO。`}
                  </p>
                </div>
                {!isPro && (
                  <button className="motion-cta" onClick={() => onUpgrade("search_personal_teaser")} style={{ flexShrink: 0, border: "none", borderRadius: 999, padding: "8px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    試す
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showPlanPath && (
          <PlanPathStrip
            isGuest={isGuest}
            isPro={isPro}
            onAuth={onAuth}
            onUpgrade={() => onUpgrade("search_plan_path")}
          />
        )}
      </div>

      {/* ── RESULTS GRID ── */}
      <div style={{ padding: "16px 24px 40px" }}>
        {productsLoading ? (
          <div className="search-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
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
          <div className="app-empty-state motion-reveal">
            <span>検索</span>
            <div>
              <strong>{"\u6761\u4ef6\u306b\u5408\u3046\u5546\u54c1\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093"}</strong>
              <p>{"\u6761\u4ef6\u3092\u5e83\u3052\u3066\u307f\u3066\u304f\u3060\u3055\u3044\u3002"}</p>
              <div className="app-empty-actions">
                <button className="motion-cta" onClick={resetFilters} style={{ border: "none", borderRadius: 999, padding: "9px 14px", background: "#150B00", color: "#FBF8F3", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {"\u4eba\u6c17\u9806\u3067\u898b\u308b"}
                </button>
                <button className="motion-nav-button" onClick={showDefaultCategory} style={{ border: "1px solid #D4A853", borderRadius: 999, padding: "9px 14px", background: "#fff", color: "#8A5B18", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {"\u30b9\u30ad\u30f3\u30b1\u30a2\u3092\u898b\u308b"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="motion-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(p => (
              <SearchCard key={p.id} product={p} isPro={isPro} isGuest={isGuest} onUpgrade={onUpgrade} onOpen={onOpenProduct} profile={profile} preferences={isPro ? preferences : null} sourceArea={mode === "ranking" ? "ranking_card" : "search_card"}/>
            ))}
          </div>
        )}

        {!productsLoading && filtered.length > 0 && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              className="motion-nav-button"
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

function PlanPathStrip({ isGuest, isPro, onAuth, onUpgrade }: {
  isGuest: boolean;
  isPro: boolean;
  onAuth?: () => void;
  onUpgrade: () => void;
}) {
  const steps = [
    {
      label: "ゲスト",
      body: "検索",
      state: isGuest ? "now" : "done",
    },
    {
      label: "無料",
      body: "保存・ログ",
      state: !isGuest && !isPro ? "now" : isGuest ? "next" : "done",
    },
    {
      label: "PRO",
      body: "詳細・購入",
      state: isPro ? "now" : "next",
    },
  ];

  return (
    <div className="plan-path-strip motion-reveal">
      <div className="plan-path-steps">
        {steps.map((step) => (
          <div key={step.label} className={`plan-path-step ${step.state}`}>
            <span>{step.label}</span>
            <strong>{step.body}</strong>
          </div>
        ))}
      </div>
      {!isPro ? (
        <button className="motion-cta" onClick={isGuest ? onAuth : onUpgrade}>
          {isGuest ? "無料登録で残す" : "PROで判断する"}
        </button>
      ) : (
        <span className="plan-path-pro">PRO適用中</span>
      )}
    </div>
  );
}

function SearchCard({ product: p, isPro, isGuest, onUpgrade, onOpen, profile, preferences, sourceArea }: {
  product: Product; isPro: boolean; isGuest: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; onOpen?: (p: Product) => void; profile?: UserProfile; preferences?: PersonalPreferences | null; sourceArea: string;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const insight = getProductInsight(p, profile, match?.reasons ?? []);
  const handleOpen = () => {
    if (locked) {
      void trackProductEvent({
        eventType: "locked_product_click",
        sourceArea,
        product: p,
        isPro,
        metadata: { rank: p.rank ?? null, matchScore: match?.score ?? null },
      });
      if (onOpen) {
        onOpen(p);
      } else {
        onUpgrade(sourceArea, p);
      }
      return;
    }
    onOpen?.(p);
  };

  return (
    <div
      className="search-product-card motion-card tap-card"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }}
      style={{ "--product-accent": m.accent, "--product-soft": m.color } as CSSProperties}
    >
      <div className="search-product-hero">
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} imageSize={320} />
        <div className="search-product-hero-shade" />
        <div className="search-product-badges">
          {p.free ? <FreeBadge/> : <ProBadge/>}
          {p.rank && <span className="search-product-rank">#{p.rank}</span>}
        </div>
        <div className="search-product-brand">{p.brand}</div>
        {locked && (
          <div className="search-product-lock">
            <span>詳しい比較はPRO</span>
          </div>
        )}
      </div>

      <div className="search-product-body">
        <div className="search-product-meta">
          <span>{m.icon} {p.cat} · {p.sub}</span>
          <span>{p.source === "rakuten" ? "楽天" : "beautia"}</span>
        </div>

        <h3 className="search-product-title">{p.name}</h3>
        <p className="search-product-desc">{p.desc}</p>

        <div className="search-product-proof">
          <Stars rating={p.rating}/>
          <span>{p.rev.toLocaleString()}件</span>
        </div>

        <div className="search-product-insight">
          <div>
            <span className="search-product-insight-label">{isPro && match ? "あなた向け" : isGuest ? "無料で確認" : "買う前メモ"}</span>
            <p>{isPro && match ? insight.why : insight.verdict}</p>
          </div>
          {isPro && match ? (
            <strong>{match.score}%</strong>
          ) : (
            <strong>{locked ? "PRO" : "OK"}</strong>
          )}
        </div>

        <div className="search-product-tags">
          {p.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}
        </div>

        <div className="search-product-footer">
          <span>{formatPrice(p.price)}</span>
          <span className="tap-card-hint">{locked ? "詳しく比較 →" : isGuest ? "登録で保存 →" : "購入前チェック →"}</span>
        </div>
      </div>
    </div>
  );
}
