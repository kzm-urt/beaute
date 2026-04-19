"use client";
import { useRef, useState } from "react";
import { GoldButton, ScoreBar } from "@/components/ui";
import type { AnalyzeResult } from "@/types";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
}

export default function AnalyzeTab({ isPro, onUpgrade }: Props) {
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImg(ev.target?.result as string);
      setResult(null);
      setError(false);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!img) return;
    setLoading(true);
    setResult(null);
    setError(false);
    try {
      const base64 = img.split(",")[1];
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) throw new Error();
      const data: AnalyzeResult = await res.json();
      setResult(data);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-5">
      {/* ── TITLE ── */}
      <h2 className="text-[26px] italic mb-1" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
        成分解析
      </h2>
      <p className="text-[13px] mb-4" style={{ color: "#8A7A6E" }}>
        製品の成分表を撮影 → AIが瞬時に解析
      </p>

      {/* ── FREE NOTICE ── */}
      {!isPro && (
        <div className="flex justify-between items-center rounded-[14px] px-4 py-3 mb-4 border-[1.5px]"
          style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#150B00" }}>無料プラン: 月3回まで</p>
            <p className="text-[11px]" style={{ color: "#8A7A6E" }}>PROで無制限解析</p>
          </div>
          <GoldButton small onClick={onUpgrade}>PRO へ</GoldButton>
        </div>
      )}

      {/* ── UPLOAD ZONE ── */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#EDE5DC] rounded-[20px] p-10 text-center cursor-pointer transition-all bg-white hover:border-[#D4A853] hover:bg-[#FEFBF6] mb-3">
        {img ? (
          <img src={img} alt="upload" className="max-w-full max-h-[220px] rounded-[12px] object-contain mx-auto" />
        ) : (
          <>
            <p className="text-[50px] mb-2.5">📸</p>
            <p className="text-[15px] font-semibold" style={{ color: "#150B00" }}>成分表をアップロード</p>
            <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>タップして写真を選択</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {img && (
        <>
          <GoldButton onClick={analyze} disabled={loading} className="mb-2">
            {loading ? "🔬 AIが解析中..." : "🧪 成分を解析する"}
          </GoldButton>
          <button
            onClick={() => { setImg(null); setResult(null); setError(false); }}
            className="w-full py-3 rounded-[14px] text-[13px] border-[1.5px] border-[#EDE5DC] bg-transparent cursor-pointer"
            style={{ color: "#8A7A6E" }}>
            別の画像を選ぶ
          </button>
        </>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="mt-5 rounded-[14px] p-4 text-center border-[1.5px]"
          style={{ background: "#FFF5F5", borderColor: "#FFCDD2", color: "#C62828" }}>
          解析に失敗しました。より鮮明な画像でお試しください。
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div className="mt-5 fade-up space-y-3">
          {/* スコアカード */}
          <div className="rounded-[18px] p-5" style={{ background: "linear-gradient(145deg,#1A0E08,#3D2010)" }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(212,168,83,.7)" }}>推定製品タイプ</p>
            <p className="text-[18px] font-bold mb-3.5" style={{ color: "#F5EEE4" }}>{result.productType}</p>
            <ScoreBar score={result.overallScore} />
            {result.keyIngredient && (
              <p className="mt-2.5 text-[12px]" style={{ color: "rgba(212,168,83,.7)" }}>
                🌟 キー成分: <strong style={{ color: "#D4A853" }}>{result.keyIngredient}</strong>
              </p>
            )}
          </div>

          {/* 注目成分 */}
          <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
            <p className="text-[13px] font-bold mb-2.5" style={{ color: "#2E7D32" }}>✅ 注目成分</p>
            {result.highlight.map((h, i) => (
              <p key={i} className="text-[12px] py-1.5 leading-[1.55]"
                style={{ borderBottom: i < result.highlight.length - 1 ? "1px solid #EDE5DC" : "none", color: "#444" }}>
                • {h}
              </p>
            ))}
          </div>

          {/* 注意成分 */}
          {result.caution.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
              <p className="text-[13px] font-bold mb-2.5" style={{ color: "#C62828" }}>⚠️ 注意成分</p>
              {result.caution.map((c, i) => (
                <p key={i} className="text-[12px] py-1.5 leading-[1.55]" style={{ color: "#555" }}>• {c}</p>
              ))}
            </div>
          )}

          {/* 肌との相性 */}
          <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
            <p className="text-[13px] font-bold mb-2.5" style={{ color: "#150B00" }}>🎯 肌との相性</p>
            <p className="text-[11px] mb-1.5" style={{ color: "#8A7A6E" }}>◎ 相性が良い</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {result.skinTypes.map((s, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#E8F5E9", color: "#2E7D32" }}>{s}</span>
              ))}
            </div>
            {result.avoid.length > 0 && (
              <>
                <p className="text-[11px] mb-1.5" style={{ color: "#8A7A6E" }}>△ 注意が必要</p>
                <div className="flex flex-wrap gap-1">
                  {result.avoid.map((a, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#FFEBEE", color: "#C62828" }}>{a}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI総評 */}
          <div className="rounded-[14px] p-4 border-[1.5px]"
            style={{ background: "linear-gradient(135deg,#F3EAF8,#EDE0F5)", borderColor: "#D5BAF5" }}>
            <p className="text-[12px] font-bold mb-1.5" style={{ color: "#6A1B9A" }}>💬 AI総評</p>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4A148C" }}>{result.verdict}</p>
          </div>
        </div>
      )}
    </div>
  );
}
