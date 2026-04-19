"use client";
import { BEAUTE_TOKENS, CAT_META, PRODUCTS } from "@/lib/constants";
import { Icon, Tag, ProductPhoto } from "@/components/ui";
import type { Product } from "@/types";

const entries = [
  { date: "04.19 SAT", time: "06:12", product: PRODUCTS[1], action: "morning", mood: 5, note: "雨上がりの光。肌が潤いを吸う日。" },
  { date: "04.18 FRI", time: "22:48", product: PRODUCTS[0], action: "night", mood: 4, note: "週の終わり。丁寧に重ねる。" },
  { date: "04.18 FRI", time: "07:05", product: PRODUCTS[5], action: "morning", mood: 4, note: "UV指数 5。完全防衛の朝。" },
  { date: "04.17 THU", time: "22:10", product: PRODUCTS[9], action: "mask", mood: 5, note: "60秒のクレイ。深呼吸と共に。" },
  { date: "04.17 THU", time: "06:45", product: PRODUCTS[1], action: "morning", mood: 3, note: "少し肌が疲れている。" },
  { date: "04.16 WED", time: "22:30", product: PRODUCTS[3], action: "test", mood: 4, note: "N°08 プラム。試着。" },
];

const stats: [string, string, string][] = [
  ["STREAK", "12", "DAYS"],
  ["PRODUCTS", "8", "ACTIVE"],
  ["AVG MOOD", "4.3", "/ 5"],
  ["THIS MONTH", "47", "SESSIONS"],
];

export default function LogTab({ onOpen }: { onOpen?: (p: Product) => void }) {
  return (
    <div>
      <div style={{ padding: "48px 48px 32px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, background: BEAUTE_TOKENS.cream }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ THE JOURNAL</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 48, margin: "8px 0 0", fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.02em" }}>
            あなたの儀式、<span style={{ color: BEAUTE_TOKENS.gold }}>記録中。</span>
          </h1>
          <button style={{ padding: "12px 22px", background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, border: "none", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, fontFamily: "ui-monospace, Menlo, monospace", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="plus" size={12} stroke={BEAUTE_TOKENS.goldLight}/>新しい記録
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 32, borderTop: `1px solid ${BEAUTE_TOKENS.border}`, paddingTop: 24 }}>
          {stats.map(([label, value, unit]) => (
            <div key={label}>
              <div style={{ fontSize: 10, letterSpacing: "0.24em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 36, lineHeight: 1.1, color: BEAUTE_TOKENS.text, fontWeight: 500 }}>{value}</span>
                <span style={{ fontSize: 10, letterSpacing: "0.15em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "baseline" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>APRIL 2026 · WEEK 16</div>
          <div style={{ display: "flex", gap: 18, fontSize: 10, letterSpacing: "0.2em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>
            <span style={{ color: BEAUTE_TOKENS.text, borderBottom: `1px solid ${BEAUTE_TOKENS.gold}`, paddingBottom: 2 }}>TIMELINE</span>
            <span style={{ cursor: "pointer" }}>CALENDAR</span>
            <span style={{ cursor: "pointer" }}>STATS</span>
          </div>
        </div>

        <div style={{ position: "relative", paddingLeft: 120 }}>
          <div style={{ position: "absolute", left: 100, top: 0, bottom: 0, width: 1, background: BEAUTE_TOKENS.border }}/>
          {entries.map((e, i) => {
            const meta = CAT_META[e.product.cat];
            return (
              <div key={i} style={{ position: "relative", paddingBottom: 40 }}>
                <div style={{ position: "absolute", left: -120, top: 0, width: 90, textAlign: "right" }}>
                  <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 20, lineHeight: 1.1, color: BEAUTE_TOKENS.text, fontWeight: 500 }}>{e.date.split(" ")[0]}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.22em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", marginTop: 4 }}>{e.date.split(" ")[1]} · {e.time}</div>
                </div>
                <div style={{ position: "absolute", left: -24, top: 6, width: 12, height: 12, borderRadius: "50%", background: BEAUTE_TOKENS.bg, border: `2px solid ${meta.accent}` }}/>
                <div style={{ background: BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.border}`, display: "grid", gridTemplateColumns: "120px 1fr auto", cursor: "pointer" }} onClick={() => onOpen?.(e.product)}>
                  <div style={{ borderRight: `1px solid ${BEAUTE_TOKENS.border}` }}>
                    <ProductPhoto cat={e.product.cat} label="" pad={18}/>
                  </div>
                  <div style={{ padding: "18px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <Tag tone="neutral" size="xs">{e.action.toUpperCase()}</Tag>
                      <span style={{ fontSize: 10, letterSpacing: "0.18em", color: meta.accent, fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600 }}>{meta.en.toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 18, color: BEAUTE_TOKENS.text, fontWeight: 500, letterSpacing: "0.02em" }}>{e.product.name}</div>
                    <div style={{ fontSize: 13, color: BEAUTE_TOKENS.textMuted, marginTop: 6, lineHeight: 1.6, fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif' }}>「{e.note}」</div>
                  </div>
                  <div style={{ padding: 24, borderLeft: `1px solid ${BEAUTE_TOKENS.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 80 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>MOOD</div>
                    <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 28, color: BEAUTE_TOKENS.gold, lineHeight: 1.1, marginTop: 4, fontWeight: 500 }}>{e.mood}</div>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>/ 5</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
