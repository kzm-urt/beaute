"use client";
import { useState } from "react";
import { BEAUTE_TOKENS } from "@/lib/constants";
import { Icon } from "@/components/ui";

export default function PremiumTab() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div>
      <div style={{ background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, padding: "56px 48px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${BEAUTE_TOKENS.goldLight}22 0%, transparent 60%)` }}/>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ アトリエ会員</div>
        <h1 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 72, margin: "14px 0 0", fontWeight: 400, lineHeight: 1.15, letterSpacing: "0.02em" }}>
          あなたの肌に、<br/>
          <span style={{ background: `linear-gradient(135deg, ${BEAUTE_TOKENS.goldLight} 0%, ${BEAUTE_TOKENS.gold} 60%, #F5E8D0 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>私信のように。</span>
        </h1>
        <div style={{ marginTop: 32, display: "flex", gap: 4 }}>
          <button onClick={() => setBilling("monthly")} style={{ padding: "10px 22px", background: billing === "monthly" ? BEAUTE_TOKENS.cream : "transparent", color: billing === "monthly" ? BEAUTE_TOKENS.navBg : BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.cream}`, fontSize: 12, letterSpacing: "0.1em", fontWeight: 500, cursor: "pointer" }}>月額プラン</button>
          <button onClick={() => setBilling("annual")} style={{ padding: "10px 22px", background: billing === "annual" ? BEAUTE_TOKENS.cream : "transparent", color: billing === "annual" ? BEAUTE_TOKENS.navBg : BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.cream}`, borderLeft: "none", fontSize: 12, letterSpacing: "0.1em", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            年額プラン
            <span style={{ padding: "2px 6px", background: BEAUTE_TOKENS.goldLight, color: BEAUTE_TOKENS.navBg, fontSize: 8, letterSpacing: "0.18em" }}>-20%</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "0 48px", marginTop: -48, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div style={{ background: BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.border}`, padding: "40px 36px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ ベーシック</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 34, margin: "8px 0 4px", fontWeight: 500, letterSpacing: "0.02em" }}>beauté 無料プラン</h2>
          <p style={{ fontSize: 12, color: BEAUTE_TOKENS.textMuted, lineHeight: 1.6 }}>はじめての方へ。基本機能を無料でご利用いただけます。</p>
          <div style={{ marginTop: 28, paddingTop: 28, borderTop: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 44, lineHeight: 1.1, color: BEAUTE_TOKENS.text, fontWeight: 500 }}>¥0</span>
            <span style={{ fontSize: 11, letterSpacing: "0.1em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>/ ずっと無料</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: BEAUTE_TOKENS.text, flex: 1 }}>
            {["月5回の成分解析", "基本的な製品レコメンド", "使用ログ記録", "カテゴリ検索", "ウィッシュリスト"].map(f => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="check" size={14} stroke={BEAUTE_TOKENS.text} sw={1.6}/><span>{f}</span>
              </li>
            ))}
          </ul>
          <button style={{ marginTop: 32, padding: "14px", background: "transparent", color: BEAUTE_TOKENS.text, border: `1px solid ${BEAUTE_TOKENS.text}`, fontSize: 12, letterSpacing: "0.08em", fontWeight: 500, cursor: "pointer" }}>現在のプラン</button>
        </div>

        <div style={{ background: "linear-gradient(160deg, #241710 0%, #1A0E08 50%, #0F0703 100%)", color: BEAUTE_TOKENS.cream, padding: "40px 40px", position: "relative", overflow: "hidden", border: `1px solid ${BEAUTE_TOKENS.gold}55`, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${BEAUTE_TOKENS.goldLight}, transparent)` }}/>
          <div style={{ position: "absolute", top: -150, right: -100, width: 400, height: 400, background: `radial-gradient(circle, ${BEAUTE_TOKENS.goldLight}22 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }}/>
          <div style={{ position: "absolute", top: 20, right: 20, padding: "6px 12px", background: `linear-gradient(135deg, ${BEAUTE_TOKENS.goldLight}, ${BEAUTE_TOKENS.gold})`, color: BEAUTE_TOKENS.navBg, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 700 }}>★ RECOMMENDED</div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ アトリエ</div>
          <h2 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 44, margin: "8px 0 4px", fontWeight: 500, lineHeight: 1.15, letterSpacing: "0.02em", background: `linear-gradient(135deg, #F5E8D0 0%, ${BEAUTE_TOKENS.goldLight} 70%, ${BEAUTE_TOKENS.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>beauté プロプラン</h2>
          <p style={{ fontSize: 12, color: "rgba(251,248,243,0.7)", lineHeight: 1.6 }}>編集部と AI の二重監修。無制限のアクセスと、プライベートなルーティン設計。</p>
          <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid rgba(212, 168, 83, 0.25)", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 58, lineHeight: 1.1, fontWeight: 500, background: `linear-gradient(135deg, #F5E8D0 0%, ${BEAUTE_TOKENS.goldLight} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>¥{billing === "monthly" ? "1,800" : "17,280"}</span>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(251,248,243,0.55)", fontFamily: "ui-monospace, Menlo, monospace" }}>/ {billing === "monthly" ? "月" : "年"}</span>
          </div>
          {billing === "annual" && <div style={{ fontSize: 10, letterSpacing: "0.2em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace", marginTop: 6 }}>= ¥1,440 / 月 · 年間 ¥4,320 お得</div>}
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "rgba(251,248,243,0.92)", flex: 1 }}>
            {["無制限の成分解析", "AI プライベート調合", "編集部限定エディット", "シェードマッチング AI", "気象連動ルーティン", "優先カスタマーケア", "アフィリエイト還元 3%", "先行アクセス"].map(f => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: `linear-gradient(135deg, ${BEAUTE_TOKENS.goldLight}, ${BEAUTE_TOKENS.gold})`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={BEAUTE_TOKENS.navBg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button style={{ marginTop: 32, padding: "16px", background: `linear-gradient(135deg, #F5E8D0 0%, ${BEAUTE_TOKENS.goldLight} 45%, ${BEAUTE_TOKENS.gold} 100%)`, color: BEAUTE_TOKENS.navBg, border: "none", fontSize: 13, letterSpacing: "0.08em", fontWeight: 700, cursor: "pointer", boxShadow: `0 10px 30px ${BEAUTE_TOKENS.gold}44` }}>7日間の無料トライアルを始める →</button>
          <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, letterSpacing: "0.05em", color: "rgba(251,248,243,0.55)" }}>いつでもキャンセル可能 · 請求は8日目から</div>
        </div>
      </div>

      <div style={{ padding: "80px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[
            { q: "毎朝、自分専用の編集部がいるような感覚。", n: "— 田中 A. · 2025年からPRO会員" },
            { q: "成分表が「読める」ようになった。", n: "— 中島 M. · 2024年からPRO会員" },
            { q: "無駄買いが本当に減った。", n: "— 近藤 Y. · 2025年からPRO会員" },
          ].map((t, i) => (
            <div key={i} style={{ borderLeft: `1px solid ${BEAUTE_TOKENS.borderDark}`, paddingLeft: 20 }}>
              <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 22, lineHeight: 1.5, color: BEAUTE_TOKENS.text, fontWeight: 500, letterSpacing: "0.02em" }}>「{t.q}」</div>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", marginTop: 14, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{t.n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
