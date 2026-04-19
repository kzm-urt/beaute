"use client";
import { useState } from "react";
import { BEAUTE_TOKENS, PRODUCTS } from "@/lib/constants";
import { Icon, Tag, ProductPhoto } from "@/components/ui";

type Mode = "upload" | "dragging" | "analyzing" | "result";

function AnalysisResult({ onReset }: { onReset: () => void }) {
  const ingredients = [
    { name: "Niacinamide", pct: "5.0%", verdict: "good", note: "ブライトニング・毛穴ケア" },
    { name: "Hyaluronic Acid", pct: "2.0%", verdict: "good", note: "高深度保湿" },
    { name: "Bakuchiol", pct: "1.0%", verdict: "good", note: "レチノール代替" },
    { name: "Glycerin", pct: "-", verdict: "neutral", note: "ヒューメクタントベース" },
    { name: "Linalool", pct: "<0.1%", verdict: "warn", note: "刺激の可能性 — 避けたいリスト" },
    { name: "Phenoxyethanol", pct: "<0.5%", verdict: "neutral", note: "保存料" },
  ];
  return (
    <div style={{ width: "100%", padding: "60px 40px 40px", overflow: "auto", maxHeight: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ 結果 · A+ グレード</div>
          <h3 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 26, margin: "8px 0 0", fontWeight: 500, letterSpacing: "0.02em" }}>Velvet Repair Serum</h3>
          <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.1em", marginTop: 4 }}>MAISON N. · 6つの主要成分を検出</div>
        </div>
        <button onClick={onReset} style={{ padding: "8px 14px", fontSize: 11, letterSpacing: "0.05em", background: "transparent", border: `1px solid ${BEAUTE_TOKENS.borderDark}`, cursor: "pointer" }}>もう一回スキャン</button>
      </div>
      <div style={{ border: `1px solid ${BEAUTE_TOKENS.border}` }}>
        {ingredients.map((ing, i) => {
          const color = ing.verdict === "good" ? "#4AAD8B" : ing.verdict === "warn" ? "#C4556A" : BEAUTE_TOKENS.textMuted;
          return (
            <div key={ing.name} style={{ display: "grid", gridTemplateColumns: "24px 1fr 80px 60px", gap: 14, alignItems: "center", padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${BEAUTE_TOKENS.border}`, background: ing.verdict === "warn" ? "#FDE8EC55" : "transparent" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }}/>
              <div>
                <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 15, fontWeight: 500, letterSpacing: "0.02em" }}>{ing.name}</div>
                <div style={{ fontSize: 11, color: BEAUTE_TOKENS.textMuted }}>{ing.note}</div>
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", textAlign: "right" }}>{ing.pct}</div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color, fontWeight: 600, textAlign: "right", fontFamily: "ui-monospace, Menlo, monospace" }}>{ing.verdict.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyzeTab() {
  const [mode, setMode] = useState<Mode>("upload");
  const [analysisType, setAnalysisType] = useState("ingredient");

  const runAnalysis = () => {
    setMode("analyzing");
    setTimeout(() => setMode("result"), 2000);
  };

  return (
    <div>
      <div style={{ padding: "48px 48px 32px", borderBottom: `1px solid ${BEAUTE_TOKENS.border}`, background: BEAUTE_TOKENS.cream }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ ラボラトリー</div>
        <h1 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 48, margin: "8px 0 0", fontWeight: 400, lineHeight: 1.2, letterSpacing: "0.02em" }}>
          成分を<span style={{ color: BEAUTE_TOKENS.gold }}>読み解く。</span>
        </h1>
        <p style={{ maxWidth: 520, marginTop: 14, fontSize: 13, lineHeight: 1.7, color: BEAUTE_TOKENS.textMuted }}>パッケージの成分表を撮影するか、画像をアップロードしてください。beauté AI が 1,200+ 成分と照合し、あなたの肌質との相性を評価します。</p>
        <div style={{ display: "flex", gap: 4, marginTop: 28, borderBottom: `1px solid ${BEAUTE_TOKENS.border}` }}>
          {([["ingredient", "成分表を解析", "INGREDIENT LIST"], ["product", "製品を識別", "PRODUCT ID"], ["shade", "シェードマッチ", "SHADE MATCH"]] as const).map(([k, jp, en]) => (
            <button key={k} onClick={() => setAnalysisType(k)} style={{ padding: "14px 22px", background: "transparent", border: "none", borderBottom: analysisType === k ? `2px solid ${BEAUTE_TOKENS.gold}` : "2px solid transparent", cursor: "pointer", color: analysisType === k ? BEAUTE_TOKENS.text : BEAUTE_TOKENS.textMuted, textAlign: "left", marginBottom: -1 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", fontFamily: "ui-monospace, Menlo, monospace" }}>{en}</div>
              <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 18, marginTop: 2, letterSpacing: "0.02em" }}>{jp}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "48px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
        <div onDragEnter={e => { e.preventDefault(); setMode("dragging"); }} onDragOver={e => e.preventDefault()} onDragLeave={() => setMode("upload")} onDrop={e => { e.preventDefault(); runAnalysis(); }}
          style={{ minHeight: 480, background: mode === "dragging" ? BEAUTE_TOKENS.goldLight + "22" : BEAUTE_TOKENS.cream, border: `1.5px dashed ${mode === "dragging" ? BEAUTE_TOKENS.gold : BEAUTE_TOKENS.borderDark}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease", overflow: "hidden" }}>
          {([["tl", { top: 16, left: 16, borderTopWidth: 1, borderLeftWidth: 1 }], ["tr", { top: 16, right: 16, borderTopWidth: 1, borderRightWidth: 1 }], ["bl", { bottom: 16, left: 16, borderBottomWidth: 1, borderLeftWidth: 1 }], ["br", { bottom: 16, right: 16, borderBottomWidth: 1, borderRightWidth: 1 }]] as const).map(([pos, extra]) => (
            <div key={pos} style={{ position: "absolute", width: 28, height: 28, borderColor: BEAUTE_TOKENS.gold, borderStyle: "solid", borderWidth: 0, ...extra }}/>
          ))}
          <div style={{ position: "absolute", top: 24, left: 24, right: 24, display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, letterSpacing: "0.22em", color: BEAUTE_TOKENS.textMuted }}>
            <span>◉ ラボ · CAM 01</span>
            <span>{mode === "analyzing" ? "解析中..." : mode === "result" ? "解析完了" : "待機中"}</span>
            <span>1,284 × 1,284 · RAW</span>
          </div>
          {(mode === "upload" || mode === "dragging") ? (
            <div style={{ textAlign: "center", maxWidth: 360 }}>
              <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.goldLight, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Icon name="camera" size={32} stroke={BEAUTE_TOKENS.goldLight}/>
                <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `1px dashed ${BEAUTE_TOKENS.gold}`, animation: mode === "dragging" ? "spin 8s linear infinite" : "none" }}/>
              </div>
              <h3 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 26, margin: 0, fontWeight: 500, color: BEAUTE_TOKENS.text, letterSpacing: "0.02em" }}>{mode === "dragging" ? "ここへドロップ" : "撮影またはアップロード"}</h3>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: BEAUTE_TOKENS.textMuted, marginTop: 10 }}>ドラッグ&ドロップ、またはボタンから<br/>PNG / JPG / HEIC (最大 20MB)</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
                <button onClick={runAnalysis} style={{ padding: "12px 22px", background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, border: "none", fontSize: 12, letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="camera" size={14} stroke={BEAUTE_TOKENS.goldLight}/>カメラを開く
                </button>
                <button onClick={runAnalysis} style={{ padding: "12px 22px", background: "transparent", border: `1px solid ${BEAUTE_TOKENS.text}`, color: BEAUTE_TOKENS.text, fontSize: 12, letterSpacing: "0.1em", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="upload" size={14}/>ファイルを選ぶ
                </button>
              </div>
            </div>
          ) : mode === "analyzing" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 120, height: 120, margin: "0 auto 28px", border: `1px solid ${BEAUTE_TOKENS.border}`, borderTop: `2px solid ${BEAUTE_TOKENS.gold}`, borderRadius: "50%", animation: "spin 1.2s linear infinite" }}/>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", color: BEAUTE_TOKENS.gold, fontFamily: "ui-monospace, Menlo, monospace" }}>解析中 · 1,284成分を照合</div>
              <h3 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 24, margin: "10px 0 0", fontWeight: 500, letterSpacing: "0.02em" }}>処方を読み解いています...</h3>
            </div>
          ) : (
            <AnalysisResult onReset={() => setMode("upload")}/>
          )}
        </div>

        <div>
          <div style={{ background: BEAUTE_TOKENS.navBg, color: BEAUTE_TOKENS.cream, padding: "28px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: BEAUTE_TOKENS.goldLight, fontFamily: "ui-monospace, Menlo, monospace" }}>━━ あなたのプロフィール</div>
            <h3 style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 22, margin: "10px 0 18px", fontWeight: 500, letterSpacing: "0.02em" }}>凛子 · 混合肌 / 敏感</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12, lineHeight: 1.5 }}>
              {([["HYDRATION", 42, BEAUTE_TOKENS.goldLight], ["BARRIER", 78, "#D4A853"], ["SENSITIVITY", 35, "#C4556A"], ["OIL BALANCE", 64, "#4AAD8B"]] as const).map(([label, pct, col]) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, letterSpacing: "0.2em", color: "rgba(251,248,243,0.7)" }}>
                    <span>{label}</span><span>{pct}%</span>
                  </div>
                  <div style={{ height: 2, marginTop: 6, background: "rgba(251,248,243,0.1)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: col }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: BEAUTE_TOKENS.cream, border: `1px solid ${BEAUTE_TOKENS.border}`, borderTop: "none", padding: "24px 28px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>避けたい成分 · あなたのリスト</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {["Alcohol Denat", "Fragrance", "Methylparaben", "Linalool", "Sulfates"].map(t => <Tag key={t} tone="outline" size="sm">{t}</Tag>)}
            </div>
          </div>
          <div style={{ border: `1px solid ${BEAUTE_TOKENS.border}`, borderTop: "none", padding: "24px 28px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 14 }}>最近のスキャン · 3件</div>
            {PRODUCTS.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, marginTop: 12, borderTop: i === 0 ? "none" : `1px solid ${BEAUTE_TOKENS.border}` }}>
                <div style={{ width: 40, height: 40, flexShrink: 0 }}><ProductPhoto cat={p.cat} label="" pad={6}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.18em", color: BEAUTE_TOKENS.textMuted, fontFamily: "ui-monospace, Menlo, monospace" }}>{p.brand}</div>
                  <div style={{ fontFamily: '"Hiragino Mincho ProN", "Noto Serif JP", serif', fontSize: 13, lineHeight: 1.3, fontWeight: 500 }}>{p.name}</div>
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: [BEAUTE_TOKENS.gold, "#4AAD8B", "#C4556A"][i], fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600 }}>{["A+", "B+", "C"][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
