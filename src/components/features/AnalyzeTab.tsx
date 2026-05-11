"use client";
import { useRef, useState, useEffect } from "react";
import { FreeBadge, GoldButton, ProductImage, ProBadge, ScoreBar, Stars } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { PLAN_RULES, getRemaining } from "@/lib/plan";
import { CAT_META, PRODUCTS } from "@/lib/constants";
import { formatPrice, toRakutenAffiliateUrl } from "@/lib/utils";
import type { AnalyzeResult, Product } from "@/types";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
}

type AnalyzeMode = "ingredient" | "face";

const FACE_ANALYSIS_POINTS = [
  { title: "印象・黄金比", body: "顔写真から雰囲気、目元や眉、顔全体のバランスを参考情報として整理します。" },
  { title: "似合うメイク", body: "色、眉、リップ、チーク、髪型の方向性を、すぐ試しやすい言葉で出します。" },
  { title: "SNS向け分類", body: "建国顔、主人公顔、透明感顔など、共有しやすい診断タイプも作ります。" },
];

const INGREDIENT_ANALYSIS_POINTS = [
  { title: "注目成分", body: "成分表から見どころ、キー成分、期待しやすい方向性を整理します。" },
  { title: "注意ポイント", body: "刺激になりやすい成分や、肌質によって気をつけたい点を先に見ます。" },
  { title: "買う前チェック", body: "診断後に近いコスメ候補を出して、比較や保存につなげます。" },
];

const PERSONAL_BENEFITS = [
  "分析結果はパーソナルの履歴に残り、あとから見返せます。",
  "顔・メイクの方向性や注意点を、相談やおすすめコスメの判断材料にできます。",
  "肌・髪メモと一緒に見ると、買う前に似合う/避けたいを整理しやすくなります。",
];

function getRecommendedProducts(result: AnalyzeResult, mode: AnalyzeMode) {
  const text = [
    result.keyIngredient,
    result.verdict,
    result.memeType,
    ...result.highlight,
    ...result.caution,
    ...result.skinTypes,
    ...result.avoid,
    ...(result.makeupAdvice ?? []),
  ].join(" ");

  const baseCats = mode === "face"
    ? new Set(["メイク", "ヘアケア", "UVケア", "フレグランス"])
    : new Set(["スキンケア", "メイク", "UVケア"]);

  const scored = PRODUCTS
    .filter((product) => baseCats.has(product.cat))
    .map((product) => {
      const haystack = `${product.cat} ${product.sub} ${product.name} ${product.brand} ${product.desc} ${product.tags.join(" ")} ${product.note ?? ""}`;
      const score = product.tags.reduce((total, tag) => total + (text.includes(tag) ? 3 : 0), 0)
        + (text.includes(product.sub) ? 4 : 0)
        + (text.includes(product.cat) ? 2 : 0)
        + (/(透明感|清潔感|ライト|ツヤ|上品)/.test(text) && /(透明感|ツヤ|ライト|ナチュラル|くすみ補正|下地)/.test(haystack) ? 5 : 0)
        + (/(毛穴|凹凸|ベース|中顔面)/.test(text) && /(毛穴|ベース|ファンデ|プライマー|ハイライト)/.test(haystack) ? 5 : 0)
        + (/(眉|目元|アイ|まつ毛)/.test(text) && /(眉|アイ|マスカラ|ライナー|ハイライト)/.test(haystack) ? 5 : 0)
        + (/(血色|リップ|チーク|ピーチ|コーラル)/.test(text) && /(リップ|チーク|血色|ピーチ|コーラル)/.test(haystack) ? 5 : 0)
        + (/(髪|ヘア|前髪|ツヤ束感)/.test(text) && product.cat === "ヘアケア" ? 5 : 0)
        + (product.free ? 1 : 0)
        + Math.min(product.rating, 5);
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || b.product.rev - a.product.rev);

  const picked: Product[] = [];
  const seenSub = new Set<string>();
  for (const item of scored) {
    if (picked.length >= 4) break;
    const subKey = `${item.product.cat}-${item.product.sub}`;
    if (seenSub.has(subKey) && picked.length < 3) continue;
    picked.push(item.product);
    seenSub.add(subKey);
  }
  return picked;
}

export default function AnalyzeTab({ isPro, onUpgrade }: Props) {
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<AnalyzeMode>("face");
  const [shareCopied, setShareCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // フリープランの場合、今月の使用回数を取得
  useEffect(() => {
    if (isPro) return;
    const fetchUsage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const now = new Date();
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - startOfYear.getTime()) / 86400000) + 1;
      const week = Math.ceil((dayOfYear + startOfYear.getUTCDay()) / 7);
      const yearMonth = `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
      const { data } = await supabase
        .from("analyze_usage")
        .select("count")
        .eq("user_id", session.user.id)
        .eq("year_month", yearMonth)
        .single();
      setUsageCount(data?.count ?? 0);
    };
    fetchUsage();
  }, [isPro]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImg(ev.target?.result as string);
      setResult(null);
      setError(false);
      setLimitReached(false);
      setShareCopied(false);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!img) return;
    setLoading(true);
    setResult(null);
    setError(false);
    setLimitReached(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const base64 = img.split(",")[1];
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, accessToken: session?.access_token, mode }),
      });
      if (res.status === 429) {
        setLimitReached(true);
        return;
      }
      if (!res.ok) throw new Error();
      const data: AnalyzeResult = await res.json();
      setResult(data);
      if (session?.access_token) {
        await fetch("/api/analysis-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: session.access_token, result: data }),
        }).catch(() => undefined);
      }

      // DB保存に失敗した場合でもパーソナルで見返せるようにローカルにも控える
      const savedLimit = isPro ? PLAN_RULES.pro.savedAnalysisLimit : PLAN_RULES.free.savedAnalysisLimit;
      const saved = JSON.parse(localStorage.getItem("beaute_analyses") ?? "[]");
      saved.unshift({ id: Date.now().toString(), date: new Date().toISOString(), result: data });
      localStorage.setItem("beaute_analyses", JSON.stringify(saved.slice(0, savedLimit)));
      // 使用回数を更新
      if (!isPro) setUsageCount((c) => (c ?? 0) + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const remainingCount = isPro ? null : getRemaining(usageCount ?? 0, PLAN_RULES.free.analyzeLimit);
  const isFaceMode = mode === "face";
  const shareText = result
    ? `${result.shareTitle ?? (isFaceMode ? "私の顔・メイク分析" : "私の成分分析")}\n${result.shareText ?? result.verdict}\n#beautia #美容分析`
    : "";
  const recommendedProducts = result ? getRecommendedProducts(result, mode) : [];
  const analysisPoints = isFaceMode ? FACE_ANALYSIS_POINTS : INGREDIENT_ANALYSIS_POINTS;

  const shareResult = async () => {
    if (!shareText) return;
    if (navigator.share) {
      await navigator.share({ title: result?.shareTitle ?? "beautia分析", text: shareText, url: window.location.origin }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
    setShareCopied(true);
  };

  return (
    <div className="px-4 py-5">
      {/* ── TITLE ── */}
      <h2 className="text-[26px] italic mb-1" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
        写真分析
      </h2>
      <p className="text-[13px] mb-4" style={{ color: "#8A7A6E" }}>
        顔分析もここでできます。顔・メイク写真か、成分表の写真を選んでAIで整理します。
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {([
          ["face", "顔・メイク", "顔分析はこちら"],
          ["ingredient", "成分表", "注目成分/注意点"],
        ] as const).map(([key, label, caption]) => {
          const active = mode === key;
          return (
            <button
              key={key}
              onClick={() => { setMode(key); setResult(null); setError(false); setLimitReached(false); setShareCopied(false); }}
              className="rounded-[14px] border px-3 py-3 text-left cursor-pointer transition-all"
              style={{ background: active ? "#1A0E08" : "#fff", borderColor: active ? "#D4A853" : "#EDE5DC", color: active ? "#F5EEE4" : "#150B00" }}
            >
              <span className="block text-[13px] font-black">{label}</span>
              <span className="block text-[10px] mt-0.5" style={{ color: active ? "rgba(212,168,83,.85)" : "#8A7A6E" }}>{caption}</span>
            </button>
          );
        })}
      </div>

      <section className="mb-4 rounded-[18px] border border-[#EDE5DC] bg-white p-4">
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.22em] font-semibold mb-1" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>
            {isFaceMode ? "FACE ANALYSIS" : "INGREDIENT ANALYSIS"}
          </p>
          <h3 className="text-[17px] font-black" style={{ color: "#150B00" }}>
            {isFaceMode ? "顔分析は「顔・メイク」を選んで写真をアップロード" : "成分分析は「成分表」を選んで写真をアップロード"}
          </h3>
          <p className="text-[12px] leading-[1.75] mt-1" style={{ color: "#6B5B4A" }}>
            {isFaceMode
              ? "1枚の写真から、顔立ちの印象、黄金比バランス、似合うメイク、SNSで共有しやすい診断タイプ、おすすめコスメを出します。"
              : "成分表から、注目成分、注意成分、肌との相性、買う前に見るポイント、おすすめコスメを出します。"}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {analysisPoints.map((item) => (
            <div key={item.title} className="rounded-[12px] p-3" style={{ background: "#F8F4EF" }}>
              <strong className="block text-[12px]" style={{ color: "#150B00" }}>{item.title}</strong>
              <p className="text-[11px] leading-[1.65] mt-1" style={{ color: "#6B5B4A" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-[16px] border p-4" style={{ background: "linear-gradient(135deg,#FFF9EC,#EFF6F1)", borderColor: "#DCE7DD" }}>
        <p className="text-[12px] font-black mb-2" style={{ color: "#150B00" }}>パーソナルにどう役立つ？</p>
        <div className="grid gap-2 md:grid-cols-3">
          {PERSONAL_BENEFITS.map((benefit) => (
            <p key={benefit} className="text-[11px] leading-[1.65] rounded-[12px] p-3 m-0" style={{ background: "rgba(255,255,255,.72)", color: "#4A3728" }}>
              {benefit}
            </p>
          ))}
        </div>
      </section>

      {/* ── FREE NOTICE ── */}
      {!isPro && (
        <div className="flex justify-between items-center rounded-[14px] px-4 py-3 mb-4 border-[1.5px]"
          style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#150B00" }}>
              無料プラン: 今週あと{remainingCount ?? "…"}回
            </p>
            <p className="text-[11px]" style={{ color: "#8A7A6E" }}>PRO: 無制限・履歴50件</p>
          </div>
          <GoldButton small onClick={onUpgrade}>PRO へ</GoldButton>
        </div>
      )}

      {/* ── UPLOAD ZONE ── */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#EDE5DC] rounded-[20px] p-10 text-center cursor-pointer transition-all bg-white hover:border-[#D4A853] hover:bg-[#FEFBF6] mb-3">
        {img ? (
          <img src={img} alt={isFaceMode ? "アップロードした顔・メイク写真" : "アップロードした成分表"} className="max-w-full max-h-[220px] rounded-[12px] object-contain mx-auto" />
        ) : (
          <>
            <p className="text-[50px] mb-2.5">📸</p>
            <p className="text-[15px] font-semibold" style={{ color: "#150B00" }}>{isFaceMode ? "顔・メイク写真をアップロード" : "成分表をアップロード"}</p>
            <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>タップして写真を選択</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {img && (
        <>
          <GoldButton onClick={analyze} disabled={loading} className="mb-2">
            {loading ? "🔬 分析中..." : isFaceMode ? "✨ 顔・メイクを分析する" : "🧪 成分を確認する"}
          </GoldButton>
          <button
            onClick={() => { setImg(null); setResult(null); setError(false); setLimitReached(false); }}
            className="w-full py-3 rounded-[14px] text-[13px] border-[1.5px] border-[#EDE5DC] bg-transparent cursor-pointer"
            style={{ color: "#8A7A6E" }}>
            別の画像を選ぶ
          </button>
        </>
      )}

      {/* ── LIMIT REACHED ── */}
      {limitReached && (
        <div className="mt-5 rounded-[14px] p-5 border-[1.5px] text-center"
          style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <p className="text-[18px] mb-2">👑</p>
          <p className="text-[14px] font-bold mb-1" style={{ color: "#150B00" }}>今週の無料回数（{PLAN_RULES.free.analyzeLimit}回）を使い切りました</p>
          <p className="text-[12px] mb-3" style={{ color: "#8A7A6E" }}>PROは無制限。</p>
          <GoldButton onClick={onUpgrade}>PROにアップグレード</GoldButton>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="mt-5 rounded-[14px] p-4 text-center border-[1.5px]"
          style={{ background: "#FFF5F5", borderColor: "#FFCDD2", color: "#C62828" }}>
          画像を鮮明にして再試行。
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div className="mt-5 fade-up space-y-3">
          <div className="bg-white rounded-[18px] border border-[#EDE5DC] overflow-hidden">
            <div className="grid md:grid-cols-[180px_1fr]">
              {img && (
                <div className="min-h-[210px] bg-[#F8F4EF]">
                  <img src={img} alt="診断に使った写真" className="w-full h-full object-cover max-h-[260px] md:max-h-none" />
                </div>
              )}
              <div className="p-4">
                <p className="text-[10px] tracking-[0.24em] font-semibold mb-1" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>
                  BEAUTIA REPORT
                </p>
                <h3 className="text-[22px] font-black mb-1" style={{ color: "#150B00", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
                  {isFaceMode ? "顔面診断レポート" : "美容写真診断レポート"}
                </h3>
                <p className="text-[12px] leading-[1.7] mb-3" style={{ color: "#6B5B4A" }}>{result.shareText ?? result.verdict}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] p-3" style={{ background: "#F8F4EF" }}>
                    <span className="block text-[10px]" style={{ color: "#8A7A6E" }}>総合スコア</span>
                    <strong className="text-[22px]" style={{ color: "#A8722A" }}>{result.overallScore}</strong>
                  </div>
                  <div className="rounded-[12px] p-3" style={{ background: "#F8F4EF" }}>
                    <span className="block text-[10px]" style={{ color: "#8A7A6E" }}>{isFaceMode ? "診断タイプ" : "キー"}</span>
                    <strong className="block text-[13px] mt-1 leading-[1.35]" style={{ color: "#150B00" }}>{result.memeType ?? result.keyIngredient}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* スコアカード */}
          <div className="rounded-[18px] p-5" style={{ background: "linear-gradient(145deg,#1A0E08,#3D2010)" }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(212,168,83,.7)" }}>{isFaceMode ? "分析タイプ" : "推定製品タイプ"}</p>
            <p className="text-[18px] font-bold mb-3.5" style={{ color: "#F5EEE4" }}>{result.productType}</p>
            <ScoreBar score={result.overallScore} />
            {result.keyIngredient && (
              <p className="mt-2.5 text-[12px]" style={{ color: "rgba(212,168,83,.7)" }}>
                🌟 {isFaceMode ? "推し軸" : "キー成分"}: <strong style={{ color: "#D4A853" }}>{result.keyIngredient}</strong>
              </p>
            )}
            {result.memeType && (
              <p className="mt-2 text-[12px]" style={{ color: "rgba(245,238,228,.76)" }}>
                SNS分類: <strong style={{ color: "#D4A853" }}>{result.memeType}</strong>
              </p>
            )}
          </div>

          {result.faceGoldenRatio && (
            <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
              <div className="flex justify-between items-start gap-3 mb-2">
                <p className="text-[13px] font-bold" style={{ color: "#150B00" }}>📐 黄金比バランス</p>
                <strong className="text-[22px]" style={{ color: "#A8722A" }}>{result.faceGoldenRatio.score}</strong>
              </div>
              <p className="text-[12px] leading-[1.65] mb-2" style={{ color: "#555" }}>{result.faceGoldenRatio.summary}</p>
              {result.faceGoldenRatio.points.map((point, i) => (
                <p key={i} className="text-[12px] py-1 leading-[1.55]" style={{ color: "#555" }}>• {point}</p>
              ))}
            </div>
          )}

          {/* 注目成分 */}
          <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
            <p className="text-[13px] font-bold mb-2.5" style={{ color: "#2E7D32" }}>{isFaceMode ? "✅ 活かしたいポイント" : "✅ 注目成分"}</p>
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
              <p className="text-[13px] font-bold mb-2.5" style={{ color: "#C62828" }}>{isFaceMode ? "⚠️ 写真・メイクの調整点" : "⚠️ 注意成分"}</p>
              {result.caution.map((c, i) => (
                <p key={i} className="text-[12px] py-1.5 leading-[1.55]" style={{ color: "#555" }}>• {c}</p>
              ))}
            </div>
          )}

          {result.makeupAdvice && result.makeupAdvice.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
              <p className="text-[13px] font-bold mb-2.5" style={{ color: "#A8722A" }}>💄 似合うメイク案</p>
              {result.makeupAdvice.map((advice, i) => (
                <p key={i} className="text-[12px] py-1.5 leading-[1.55]" style={{ color: "#555" }}>• {advice}</p>
              ))}
            </div>
          )}

          {/* 肌との相性 */}
          <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
            <p className="text-[13px] font-bold mb-2.5" style={{ color: "#150B00" }}>{isFaceMode ? "🎯 メイクトーン" : "🎯 肌との相性"}</p>
            <p className="text-[11px] mb-1.5" style={{ color: "#8A7A6E" }}>{isFaceMode ? "◎ 似合いやすい" : "◎ 相性が良い"}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {result.skinTypes.map((s, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#E8F5E9", color: "#2E7D32" }}>{s}</span>
              ))}
            </div>
            {result.avoid.length > 0 && (
              <>
                <p className="text-[11px] mb-1.5" style={{ color: "#8A7A6E" }}>{isFaceMode ? "△ 重く見えやすい" : "△ 注意が必要"}</p>
                <div className="flex flex-wrap gap-1">
                  {result.avoid.map((a, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#FFEBEE", color: "#C62828" }}>{a}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* まとめ */}
          <div className="rounded-[14px] p-4 border-[1.5px]"
            style={{ background: "linear-gradient(135deg,#F3EAF8,#EDE0F5)", borderColor: "#D5BAF5" }}>
            <p className="text-[12px] font-bold mb-1.5" style={{ color: "#6A1B9A" }}>💬 まとめ</p>
            <p className="text-[13px] leading-[1.7]" style={{ color: "#4A148C" }}>{result.verdict}</p>
          </div>

          {recommendedProducts.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] tracking-[0.2em] font-semibold" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>COSME PICKS</p>
                  <h3 className="text-[16px] font-black" style={{ color: "#150B00" }}>診断後のおすすめコスメ</h3>
                </div>
                <span className="text-[10px]" style={{ color: "#8A7A6E" }}>結果に近いものから表示</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendedProducts.map((product) => {
                  const meta = CAT_META[product.cat];
                  const locked = !product.free && !isPro;
                  return (
                    <div key={product.id} className="rounded-[14px] border overflow-hidden" style={{ borderColor: "#EDE5DC", background: "#FBF8F3" }}>
                      <div className="grid grid-cols-[92px_1fr] min-h-[128px]">
                        <div style={{ background: meta.color }}>
                          <ProductImage id={product.id} name={product.name} brand={product.brand} sub={product.sub} src={product.image} alt={product.name} catColor={meta.color} catIcon={meta.icon} imageSize={220} />
                        </div>
                        <div className="p-3 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[10px] font-bold" style={{ color: meta.dark }}>{product.sub}</span>
                            {product.free ? <FreeBadge /> : <ProBadge />}
                          </div>
                          <p className="text-[12px] font-black leading-[1.35] line-clamp-2" style={{ color: "#150B00" }}>{product.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#8A7A6E" }}>{product.brand} / {formatPrice(product.price)}</p>
                          <div className="mt-1"><Stars rating={product.rating} size={10} /></div>
                          {locked ? (
                            <button onClick={onUpgrade} className="mt-2 w-full rounded-[10px] border-none py-2 text-[11px] font-black cursor-pointer" style={{ background: "#1A0E08", color: "#D4A853" }}>
                              PROで詳細
                            </button>
                          ) : (
                            <a href={product.url ?? toRakutenAffiliateUrl(product.name, product.brand)} target="_blank" rel="noopener noreferrer" className="block mt-2 w-full rounded-[10px] py-2 text-[11px] font-black text-center no-underline" style={{ background: "#BF0000", color: "#fff" }}>
                              価格を見る
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={shareResult}
            className="w-full py-3 rounded-[14px] text-[13px] font-black border-none cursor-pointer"
            style={{ background: "#150B00", color: "#D4A853" }}
          >
            {shareCopied ? "コピーしました" : "SNSに共有する"}
          </button>
        </div>
      )}
    </div>
  );
}
