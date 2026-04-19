"use client";
import { useRef } from "react";
import { BEAUTE_TOKENS, CAT_META, CAT_ORDER, PRODUCTS } from "@/lib/constants";
import { EditorialPhoto } from "@/components/ui";
import { ProductCard, RailCard } from "@/components/features/ProductCard";
import type { CatKey, Product } from "@/types";

function HomeHero({ onOpenPremium }: { onOpenPremium?: () => void }) {
  const gold = BEAUTE_TOKENS.gold;
  return (
    <section style={{ position: "relative", minHeight: 520, paddingBottom: 48, background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, overflow: "hidden" }}>
      <EditorialPhoto label="cover story · glass skin ritual" tone="warm" style={{ position: "absolute", inset: 0 }}/>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(26,14,8,0.1) 0%, rgba(26,14,8,0.75) 70%, rgba(26,14,8,0.95) 100%)" }}/>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "16.666% 100%", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", top: 24, left: 32, right: 32, display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, letterSpacing: "0.3em", color: "rgba(251,248,243,0.55)" }}>
        <span>カバーストーリー · ISSUE 04</span>
        <span>━━━━━ AI が編集</span>
        <span>2026年4月号</span>
      </div>
      <div style={{ position: "absolute", bottom: 40, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
        <h1 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 76, lineHeight: 1.15, margin: 0, fontWeight: 400, letterSpacing: "0.02em", maxWidth: "70%" }}>
          やわらかな<br/><span style={{ color: gold }}>つや</span>を、<br/>もう一度。
        </h1>
        <div style={{ maxWidth: 260, textAlign: "right" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: gold, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 10 }}>本日の特集 · 04.19</div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(251,248,243,0.75)", margin: 0 }}>AIが観測した今朝のあなた — 乾燥 +2 / 彩度 -1 / 肌温度 36.1°C。繊細な一手を、美しく。</p>
          <button onClick={onOpenPremium} style={{ marginTop: 18, padding: "10px 20px", background: "transparent", border: `1px solid ${gold}`, color: gold, fontSize: 11, letterSpacing: "0.15em", fontWeight: 500, cursor: "pointer" }}>
            エディットを読む →
          </button>
        </div>
      </div>
    </section>
  );
}

function CategoryGrid({ onCat }: { onCat?: (c: CatKey) => void }) {
  return (
    <div style={{ padding: "48px 48px 32px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ 01</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 32, margin: "6px 0 0", fontWeight: 400, color: BEAUTE_TOKENS.text, letterSpacing: "0.02em" }}>カテゴリから探す</h2>
        </div>
        <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.15em" }}>08 / 08 カテゴリ</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {CAT_ORDER.map((cat, idx) => {
          const meta = CAT_META[cat];
          return (
            <button key={cat} onClick={() => onCat?.(cat)} style={{ padding: "20px 18px", background: meta.color, border: `1px solid ${meta.accent}44`, textAlign: "left", cursor: "pointer", transition: "all 0.25s ease", display: "flex", flexDirection: "column", gap: 14, minHeight: 118, color: meta.dark }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = meta.dark; e.currentTarget.style.color = meta.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = meta.color; e.currentTarget.style.color = meta.dark; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: meta.accent }}/>
                <span style={{ fontSize: 9, letterSpacing: "0.2em", fontFamily: "ui-monospace, Menlo, monospace", opacity: 0.6 }}>0{idx + 1}</span>
              </div>
              <div>
                <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 22, lineHeight: 1.2, fontWeight: 500 }}>{meta.jp}</div>
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.65, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.15em" }}>{meta.en}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditorialRail({ title, eyebrow, number, products, onOpen }: { title: string; eyebrow: string; number: string; products: Product[]; onOpen?: (p: Product) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  const railBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BEAUTE_TOKENS.borderDark}`, background: "transparent", cursor: "pointer", fontSize: 14, color: BEAUTE_TOKENS.text, display: "inline-flex", alignItems: "center", justifyContent: "center" };
  return (
    <section style={{ padding: "40px 48px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ {number}</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 28, margin: "6px 0 4px", fontWeight: 400, color: BEAUTE_TOKENS.text, letterSpacing: "0.02em" }}>{title}</h2>
          <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, letterSpacing: "0.1em", fontFamily: "ui-monospace, Menlo, monospace" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => scroll(-1)} style={railBtn}>←</button>
          <button onClick={() => scroll(1)} style={railBtn}>→</button>
        </div>
      </div>
      <div ref={scrollRef} className="hide-scrollbar" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
        {products.map(p => <RailCard key={p.id} p={p} onOpen={onOpen}/>)}
      </div>
    </section>
  );
}

export default function HomeTab({ onCat, onOpen, onOpenPremium }: { onCat?: (c: CatKey) => void; onOpen?: (p: Product) => void; onOpenPremium?: () => void }) {
  const editorsPick = PRODUCTS.filter(p => p.editors);
  const aiPicks = [PRODUCTS[0], PRODUCTS[5], PRODUCTS[1], PRODUCTS[10], PRODUCTS[6], PRODUCTS[3]];
  return (
    <div>
      <HomeHero onOpenPremium={onOpenPremium}/>
      <div style={{ background: BEAUTE_TOKENS.cream, padding: "18px 48px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", gap: 24, alignItems: "center", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.15em", color: BEAUTE_TOKENS.textMuted }}>
        <span style={{ color: BEAUTE_TOKENS.gold, fontWeight: 600 }}>AI 解析済み</span>
        <span>━━ 肌温度: 36.1°C</span><span>湿度: 82%</span><span>UV指数: 4</span><span>PM2.5: 低</span>
        <span style={{ marginLeft: "auto", color: BEAUTE_TOKENS.text }}>更新 05:42</span>
      </div>
      <CategoryGrid onCat={onCat}/>
      <EditorialRail number="02" title="今週のあなたへ、特別な6選" eyebrow="AI × 編集部 — 6 アイテム" products={aiPicks} onOpen={onOpen}/>
      <section style={{ padding: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ 03</div>
            <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 34, margin: "6px 0 0", fontWeight: 400, letterSpacing: "0.02em" }}>編集部が選ぶ、今週の逸品</h2>
          </div>
          <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.15em" }}>すべて見る →</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {editorsPick.slice(0, 4).map(p => <ProductCard key={p.id} p={p} variant="editorial" onOpen={onOpen}/>)}
        </div>
      </section>
      <section style={{ background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, padding: "56px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 14 }}>━━ BEAUTÉ PRO</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 44, margin: 0, fontWeight: 400, lineHeight: 1.2, letterSpacing: "0.02em" }}>アトリエの扉を、<br/>そっと開ける。</h2>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(251,248,243,0.72)", marginTop: 20, maxWidth: 420 }}>月額¥1,800で、無制限の成分解析・プライベート調合レシピ・編集部限定のエディットにアクセス。</p>
          <button onClick={onOpenPremium} style={{ marginTop: 24, padding: "14px 28px", background: `linear-gradient(135deg, ${BEAUTE_TOKENS.goldLight}, ${BEAUTE_TOKENS.gold})`, border: "none", color: BEAUTE_TOKENS.navBg, fontSize: 12, letterSpacing: "0.15em", fontWeight: 600, cursor: "pointer" }}>
            7日間の無料トライアルを始める →
          </button>
        </div>
        <EditorialPhoto label="feature · gold ritual" tone="noir" style={{ aspectRatio: 1.2 }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 80, color: BEAUTE_TOKENS.goldLight, lineHeight: 1.2, opacity: 0.85, fontWeight: 500, letterSpacing: "0.04em" }}>PRO</div>
          </div>
        </EditorialPhoto>
      </section>
    </div>
  );
}
