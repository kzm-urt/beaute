"use client";
import { useRef, useEffect, useState } from "react";
import { CAT_META, PRODUCTS } from "@/lib/constants";
import type { YoutubeVideo } from "@/app/api/youtube/route";
import { formatPrice } from "@/lib/utils";
import { Icon, Stars, FreeBadge, ProBadge } from "@/components/ui";
import type { UserProfile, Product, Category } from "@/types";

interface Props {
  profile: UserProfile;
  isPro: boolean;
  onUpgrade: () => void;
  onGoSearch: (cat?: string) => void;
  onOpenProduct: (p: Product) => void;
}

export default function HomeTab({ profile, isPro, onUpgrade, onGoSearch, onOpenProduct }: Props) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activeVideoCategory, setActiveVideoCategory] = useState("全体");

  useEffect(() => {
    setVideosLoading(true);
    fetch(`/api/youtube?category=${encodeURIComponent(activeVideoCategory)}&max=8`)
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .finally(() => setVideosLoading(false));
  }, [activeVideoCategory]);

  const recs = PRODUCTS.filter((p) => {
    if (profile.hairType && p.tags.includes(profile.hairType)) return true;
    if (profile.skinType && p.tags.some((t) => t.includes(profile.skinType.replace("肌", "")))) return true;
    if (profile.concerns.some((c) => p.tags.some((t) => t.includes(c.slice(0, 2))))) return true;
    return false;
  });
  const aiPicks = recs.length >= 3 ? recs.slice(0, 6) : PRODUCTS.filter((p) => p.free).slice(0, 6);
  const editorsPicks = PRODUCTS.filter((p, i) => i % 4 === 0).slice(0, 4);

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: 460, overflow: "hidden", background: "#1A0E08" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(212,168,83,.22) 0%, transparent 60%)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "16.666% 100%", pointerEvents: "none" }}/>

        <div style={{ position: "absolute", top: 22, left: 32, right: 32, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.3em", color: "rgba(251,248,243,.45)", fontFamily: "ui-monospace,monospace" }}>
          <span>カバーストーリー · ISSUE 04</span>
          <span className="hidden md:block">━━ AI が {profile.skinType || "あなた"} のために編集</span>
          <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}</span>
        </div>

        <div style={{ position: "absolute", bottom: 36, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(44px,7vw,72px)", lineHeight: 1.15, margin: 0, fontWeight: 400, color: "#FBF8F3", letterSpacing: "0.02em" }}>
            やわらかな<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>つや</span>を、<br/>もう一度。
          </h1>
          <div className="hidden md:block" style={{ maxWidth: 240, textAlign: "right" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>本日の特集 · AI EDIT</div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(251,248,243,.7)", margin: "0 0 16px" }}>
              {profile.skinType} × {profile.age || "—"} の<br/>あなたへの {aiPicks.length} 選
            </p>
            <button onClick={() => onGoSearch()} style={{ padding: "10px 20px", background: "transparent", border: "1px solid #D4A853", color: "#D4A853", fontSize: 11, letterSpacing: "0.15em", fontWeight: 500, cursor: "pointer", borderRadius: 4 }}>
              全製品を見る →
            </button>
          </div>
        </div>
      </section>

      {/* ── AI STRIP ── */}
      <div style={{ background: "#F1EADE", padding: "14px 32px", borderBottom: "1px solid #EDE5DC", display: "flex", gap: 20, alignItems: "center", overflowX: "auto", fontSize: 11, letterSpacing: "0.12em", color: "#8A7A6E", fontFamily: "ui-monospace,monospace", whiteSpace: "nowrap" }}>
        <span style={{ color: "#D4A853", fontWeight: 600, flexShrink: 0 }}>AI 解析済み</span>
        <span>━━ {profile.skinType || "肌質未設定"}</span>
        {profile.hairType && <span>{profile.hairType}</span>}
        {profile.concerns.slice(0, 3).map(c => <span key={c}>/ {c}</span>)}
        <span style={{ marginLeft: "auto", color: "#150B00", flexShrink: 0 }}>更新 {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* ── CATEGORY GRID ── */}
      <section style={{ padding: "44px 32px 36px", borderBottom: "1px solid #EDE5DC" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 01</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>カテゴリから探す</h2>
          </div>
          <div style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em" }}>08 / 08</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }} className="grid-cols-2-mobile">
          {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m], i) => (
            <button key={name} onClick={() => onGoSearch(name)} style={{
              padding: "18px 14px", background: m.color, border: `1px solid ${m.accent}44`,
              textAlign: "left", cursor: "pointer", transition: "transform 0.2s ease",
              display: "flex", flexDirection: "column", gap: 12, minHeight: 100,
              color: m.dark, borderRadius: 4,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ fontSize: 9, letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", opacity: 0.55 }}>0{i + 1}</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, fontWeight: 500, lineHeight: 1.2 }}>{name}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.6, fontFamily: "ui-monospace,monospace", letterSpacing: "0.12em" }}>{m.en}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── AI PICKS RAIL ── */}
      <ProductRail
        number="02"
        title={`今週の ${profile.skinType || "あなた"} へ — ${aiPicks.length} 選`}
        eyebrow="AI × 編集部によるパーソナル提案"
        products={aiPicks}
        onOpen={onOpenProduct}
        isPro={isPro}
        onUpgrade={onUpgrade}
      />

      {/* ── EDITOR'S PICKS GRID ── */}
      <section style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 03</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>編集部が選ぶ、今週の逸品</h2>
          </div>
          <button onClick={() => onGoSearch()} style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer" }}>すべて見る →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-cols-2-mobile">
          {editorsPicks.map(p => (
            <EditorCard key={p.id} product={p} onOpen={onOpenProduct} isPro={isPro}/>
          ))}
        </div>
      </section>

      {/* ── TRENDING VIDEOS ── */}
      <section style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 04</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>🔥 今バズってる動画</h2>
          </div>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideoCategory === "全体" ? "美容 おすすめ コスメ" : activeVideoCategory)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", textDecoration: "none" }}>
            YouTubeで見る →
          </a>
        </div>

        {/* カテゴリタブ */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }} className="hide-scrollbar">
          {["全体", ...Object.keys(CAT_META)].map(cat => (
            <button key={cat} onClick={() => setActiveVideoCategory(cat)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: activeVideoCategory === cat ? "#D4A853" : "#EDE5DC",
              background: activeVideoCategory === cat ? "#D4A853" : "transparent",
              color: activeVideoCategory === cat ? "#1A0E08" : "#8A7A6E",
              fontSize: 11, fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em",
              cursor: "pointer", fontWeight: activeVideoCategory === cat ? 700 : 400,
            }}>
              {cat === "全体" ? "すべて" : cat}
            </button>
          ))}
        </div>

        {/* 動画一覧 */}
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
          {videosLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 200 }}>
                  <div style={{ height: 112, borderRadius: 10, background: "#F1EADE", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}/>
                  <div style={{ height: 12, borderRadius: 4, background: "#F1EADE", marginBottom: 4 }}/>
                  <div style={{ height: 10, borderRadius: 4, background: "#F1EADE", width: "60%" }}/>
                </div>
              ))
            : videos.map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0, width: 200, textDecoration: "none" }}>
                  <div style={{ height: 112, borderRadius: 10, overflow: "hidden", position: "relative", marginBottom: 8, background: "#1A0E08" }}>
                    <img src={v.thumbnail} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} loading="lazy"/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.6) 0%, transparent 50%)" }}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
                        <Icon name="play" size={14} stroke="#1A0E08"/>
                      </div>
                    </div>
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, color: "#FBF8F3", fontFamily: "ui-monospace,monospace", background: "rgba(0,0,0,.65)", padding: "2px 6px", borderRadius: 10 }}>
                      👁 {v.views}回
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#150B00", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {v.title}
                  </p>
                </a>
              ))
          }
        </div>
      </section>

      {/* ── PRO TEASER ── */}
      {!isPro && (
        <section style={{ background: "#1A0E08", color: "#FBF8F3", padding: "56px 32px", display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>━━ BEAUTÉ PRO</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(28px,5vw,44px)", margin: "0 0 16px", fontWeight: 400, lineHeight: 1.2 }}>
              アトリエの扉を、<br/>そっと開ける。
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(251,248,243,.65)", margin: "0 0 24px", maxWidth: 380 }}>
              月額¥680で、無制限の成分解析・全製品フルアクセス・AIパーソナル診断。
            </p>
            <button onClick={onUpgrade} style={{ padding: "13px 28px", background: "linear-gradient(135deg,#D4A853,#A8722A)", border: "none", color: "#1A0E08", fontSize: 13, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
              PRO へアップグレード →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 180 }} className="hidden md:flex">
            {["✦ 成分解析 無制限", "✦ 全30製品 フルアクセス", "✦ AIパーソナル診断", "✦ 優先サポート"].map(f => (
              <div key={f} style={{ fontSize: 13, color: "rgba(251,248,243,.8)", letterSpacing: "0.05em" }}>{f}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Horizontal product rail ──────────────────────────────────────────
function ProductRail({ number, title, eyebrow, products, onOpen, isPro, onUpgrade }: {
  number: string; title: string; eyebrow: string; products: Product[];
  onOpen: (p: Product) => void; isPro: boolean; onUpgrade: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  return (
    <section style={{ padding: "44px 32px 40px", borderBottom: "1px solid #EDE5DC" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ {number}</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, margin: "0 0 4px", fontWeight: 400, color: "#150B00" }}>{title}</h2>
          <div style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["←", "→"].map((d, i) => (
            <button key={d} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #D9CDBC", background: "transparent", cursor: "pointer", fontSize: 14, color: "#150B00", display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
        {products.map(p => <RailCard key={p.id} product={p} onOpen={onOpen} isPro={isPro}/>)}
      </div>
    </section>
  );
}

function RailCard({ product: p, onOpen, isPro }: { product: Product; onOpen: (p: Product) => void; isPro: boolean }) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  return (
    <div onClick={() => onOpen(p)} style={{ flexShrink: 0, width: 220, cursor: "pointer", background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.06)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(21,11,0,.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(21,11,0,.06)"; }}>
      <div style={{ position: "relative", height: 140, overflow: "hidden", background: m.color }}>
        {locked
          ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 48, opacity: 0.3 }}>{m.icon}</span></div>
          : <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
        }
        {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(248,244,239,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 28 }}>🔒</span></div>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>{p.free ? <FreeBadge/> : <ProBadge/>}</div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", marginBottom: 3 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 6 }}>{p.name}</div>
        <Stars rating={p.rating} size={11}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, fontWeight: 500, color: "#150B00" }}>{formatPrice(p.price)}</span>
          <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: m.color, color: m.dark }}>{p.cat}</span>
        </div>
      </div>
    </div>
  );
}

function EditorCard({ product: p, onOpen, isPro }: { product: Product; onOpen: (p: Product) => void; isPro: boolean }) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  return (
    <div onClick={() => onOpen(p)} style={{ cursor: "pointer", background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 10, overflow: "hidden", transition: "transform 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: m.color }}>
        {locked
          ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 56, opacity: 0.25 }}>{m.icon}</span></div>
          : <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.55) 0%, transparent 50%)" }}/>
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ fontSize: 9, background: "rgba(212,168,83,.9)", color: "#1A0E08", padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.1em" }}>EDIT'S PICK</span>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.12em", marginBottom: 2 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 4 }}>{p.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stars rating={p.rating} size={10}/>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
        </div>
      </div>
    </div>
  );
}
