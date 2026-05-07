"use client";
import { useState, useEffect } from "react";
import { Stars, ScoreBar } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { CAT_META } from "@/lib/constants";
import { PLAN_RULES } from "@/lib/plan";
import { supabase } from "@/lib/supabase";
import { getPersonalMatch } from "@/lib/personalization";
import type { UserProfile, Product, AnalyzeResult, AnalysisEntry, PersonalPreferences } from "@/types";
import type { YoutubeVideo } from "@/app/api/youtube/route";

interface SavedAnalysis {
  id: string;
  date: string;
  result: AnalyzeResult;
}

interface Props {
  profile: UserProfile;
  isPro: boolean;
  preferences?: PersonalPreferences | null;
  onOpenProduct: (p: Product) => void;
  onEditProfile: () => void;
  onGoAnalyze: () => void;
  onGoSearch: () => void;
  onGoLog: () => void;
  onUpgrade: () => void;
}

const HABITS: Record<string, { icon: string; tips: string[] }> = {
  乾燥肌: { icon: "💧", tips: ["洗顔後3分以内に化粧水をつける", "シートマスクを週2回習慣に", "室内加湿器で湿度50〜60%を保つ", "ぬるま湯（35℃前後）で洗顔する"] },
  脂性肌: { icon: "🌿", tips: ["洗顔は朝晩2回まで（過洗顔に注意）", "ノンコメドジェニック製品を選ぶ", "皮脂コントロール成分（ナイアシンアミド）を活用", "枕カバーを週2回交換する"] },
  混合肌: { icon: "☯️", tips: ["Tゾーンと頬で保湿量を変える", "クレイパックはTゾーンのみに使用", "軽いテクスチャーの化粧水を選ぶ", "皮脂吸着パウダーでTゾーンをケア"] },
  敏感肌: { icon: "🌸", tips: ["新製品は必ずパッチテストをする", "成分表の最初の5つをチェックする習慣を", "摩擦を避け、優しくプレスするように塗る", "刺激の少いノンアルコール製品を選ぶ"] },
  普通肌: { icon: "✨", tips: ["今の肌状態を守るUVケアを毎日欠かさず", "季節ごとにスキンケアを見直す", "バランスの良い食事と睡眠が一番のスキンケア", "週1回のスペシャルケアで肌をリセット"] },
};

export default function KarteTab({ profile, isPro, preferences, onOpenProduct, onEditProfile, onGoAnalyze, onGoSearch, onGoLog, onUpgrade }: Props) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [hiddenAnalysisCount, setHiddenAnalysisCount] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [openAnalysis, setOpenAnalysis] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const visibleLimit = isPro ? PLAN_RULES.pro.savedAnalysisLimit : PLAN_RULES.free.savedAnalysisLimit;

    const loadLocalFallback = () => {
      const saved = JSON.parse(localStorage.getItem("beaute_analyses") ?? "[]") as SavedAnalysis[];
      setAnalyses(saved.slice(0, visibleLimit));
      setAnalysisTotal(saved.length);
      setHiddenAnalysisCount(Math.max(0, saved.length - visibleLimit));
    };

    const fetchAnalyses = async () => {
      setAnalysisLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        loadLocalFallback();
        setAnalysisLoading(false);
        return;
      }

      const res = await fetch("/api/analysis-entries", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        loadLocalFallback();
        setAnalysisLoading(false);
        return;
      }

      const data = await res.json();
      if (ignore) return;
      const entries = ((data.entries ?? []) as AnalysisEntry[]).map((entry) => ({
        id: entry.id,
        date: entry.created_at,
        result: entry.result,
      }));
      setAnalyses(entries);
      setAnalysisTotal(data.total ?? entries.length);
      setHiddenAnalysisCount(data.hiddenCount ?? 0);
      setAnalysisLoading(false);
    };

    fetchAnalyses();
    return () => { ignore = true; };
  }, [isPro]);

  useEffect(() => {
    const tags = [profile.skinType, profile.hairType, ...profile.concerns.slice(0, 6)].filter(Boolean);
    const params = new URLSearchParams({ limit: "6" });
    if (tags.length > 0) params.set("tags", tags.join(","));
    else params.set("free", "true");
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []));
  }, [profile.skinType, profile.hairType, profile.concerns]);

  useEffect(() => {
    const cat = profile.skinType ? "スキンケア" : "全体";
    fetch(`/api/youtube?category=${encodeURIComponent(cat)}&max=4`)
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []));
  }, [profile.skinType]);

  const habits = HABITS[profile.skinType] ?? HABITS["普通肌"];
  const visibleAnalyses = analyses;
  const latestAnalysis = visibleAnalyses[0] ?? null;
  const signalCount = [profile.age, profile.skinType, profile.hairType].filter(Boolean).length + profile.concerns.length;
  const precisionScore = Math.min(96, 32 + signalCount * 4 + Math.min(analysisTotal, 5) * 4 + (preferences?.confidence ?? 0));
  const topProduct = products[0] ?? null;
  const topMatch = topProduct ? getPersonalMatch(topProduct, profile, isPro ? preferences : null) : null;
  const nextActions = [
    {
      label: signalCount < 8 ? "カルテを細かくする" : "カルテを見直す",
      body: signalCount < 8 ? "予算・避けたいもの・仕上がりを足すと候補の精度が上がります。" : "季節や肌状態が変わったら、条件を更新します。",
      action: "編集",
      onClick: onEditProfile,
      tone: "profile",
    },
    {
      label: latestAnalysis ? "次の商品も成分チェック" : "まず1つ成分分析",
      body: latestAnalysis ? "気になる商品を解析して、合う理由と注意点を比較します。" : "成分分析を1回入れると、Karteの判断材料が増えます。",
      action: "分析する",
      onClick: onGoAnalyze,
      tone: "analyze",
    },
    {
      label: topProduct ? "候補を見て購入判断" : "楽天商品を探す",
      body: topProduct ? `${topProduct.brand} の候補があります。価格・レビュー・相性を見て判断できます。` : "楽天の商品を検索して、保存と比較リストに候補を集めます。",
      action: topProduct ? "商品を見る" : "検索へ",
      onClick: topProduct ? () => onOpenProduct(topProduct) : onGoSearch,
      tone: "buy",
    },
    {
      label: "使ったらログに残す",
      body: "合った/合わなかったを残すほど、PROのおすすめが売れる商品選びに近づきます。",
      action: "ログ",
      onClick: onGoLog,
      tone: "log",
    },
  ];

  return (
    <div className="mobile-tight motion-fade-scale" style={{ padding: "28px 24px 64px", maxWidth: 1120, margin: "0 auto" }}>

      {/* ── ヘッダー ── */}
      <div style={{ marginBottom: 26, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(260px,360px)", gap: 18, alignItems: "end" }} className="grid-cols-1-mobile motion-reveal">
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ MY BEAUTY CHART</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 36, fontWeight: 400, color: "#150B00", margin: 0 }}>
            あなた専用の美容OS
          </h1>
          <p style={{ fontSize: 13, color: "#8A7A6E", marginTop: 6, lineHeight: 1.8 }}>カルテはプロフィールではなく、検索・成分分析・保存・ログをつなぐ判断エンジンです。</p>
        </div>
        <div className="soft-card motion-card motion-status-pulse" style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span className="micro-label">ENGINE STATUS</span>
            <strong style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: "#A8722A", lineHeight: 1 }}>{precisionScore}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              ["SIGNAL", signalCount],
              ["ANALYZE", analysisTotal],
              ["PICKS", products.length],
            ].map(([label, value]) => (
              <div key={label} style={{ borderRadius: 12, background: "#F8F4EF", padding: "9px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#150B00" }}>{value}</div>
                <div style={{ fontSize: 9, color: "#8A7A6E", letterSpacing: ".12em", fontFamily: "ui-monospace,monospace" }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "#6B5B4A" }}>
            入力と行動ログが増えるほど、買う理由・避ける理由が具体化します。
          </p>
        </div>
      </div>

      <section className="lift-card motion-card motion-reveal" style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 20, overflow: "hidden", marginBottom: 24, boxShadow: "0 10px 34px rgba(21,11,0,.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,.86fr) minmax(0,1.14fr)", gap: 0 }} className="grid-cols-1-mobile">
          <div style={{ padding: "22px 22px 20px", background: "linear-gradient(145deg,#1A0E08,#3A1D0D)", color: "#FBF8F3" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>PERSONAL ENGINE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <div style={{ width: 86, height: 86, borderRadius: "50%", border: "1px solid rgba(212,168,83,.38)", display: "grid", placeItems: "center", background: "rgba(212,168,83,.08)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, color: "#D4A853", lineHeight: 1 }}>{precisionScore}</div>
                  <div style={{ fontSize: 9, color: "rgba(251,248,243,.5)", letterSpacing: ".12em" }}>FIT</div>
                </div>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.35, color: "#FBF8F3" }}>
                  {signalCount >= 10 ? "かなり細かく見れています" : "あと少しで精度が上がります"}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.7, color: "rgba(251,248,243,.68)" }}>
                  回答{signalCount}個・分析{analysisTotal}件・{isPro ? "PRO学習あり" : "FREE学習中"}。次にやることを下に並べています。
                </p>
              </div>
            </div>
            {!isPro && (
              <div style={{ border: "1px solid rgba(212,168,83,.28)", borderRadius: 14, padding: 12, background: "rgba(212,168,83,.08)" }}>
                <div style={{ fontSize: 10, color: "#D4A853", letterSpacing: ".16em", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>PRO REVENUE HOOK</div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "rgba(251,248,243,.72)" }}>
                  PROでは保存・ログ・成分分析をまとめて、商品ごとに「買う理由」「避ける理由」「購入リンク」を出します。
                </p>
                <button className="motion-cta" onClick={onUpgrade} style={{ marginTop: 10, border: "none", borderRadius: 999, padding: "9px 13px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
                  購入判断をPRO化
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }} className="grid-cols-1-mobile motion-stagger">
            {nextActions.map((item, index) => (
              <button
                key={item.label}
                className="lift-card motion-card"
                onClick={item.onClick}
                style={{
                  border: index === 2 ? "1px solid #D4A85377" : "1px solid #EDE5DC",
                  borderRadius: 14,
                  padding: 14,
                  background: index === 2 ? "#FFF9EC" : "#FBF8F3",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minHeight: 132,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, letterSpacing: ".18em", fontFamily: "ui-monospace,monospace", color: "#A8722A" }}>NEXT 0{index + 1}</span>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", background: index === 2 ? "#1A0E08" : "#EFE6DA", color: index === 2 ? "#D4A853" : "#8A7A6E", fontSize: 12 }}>→</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#150B00", lineHeight: 1.35 }}>{item.label}</div>
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "#6B5B4A", flex: 1 }}>{item.body}</p>
                <span style={{ fontSize: 11, color: "#A8722A", fontWeight: 900 }}>{item.action}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── プロフィールカード ── */}
      <section className="motion-reveal" style={{ background: "linear-gradient(135deg,#1A0E08,#2C1A0E)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, border: "1px solid rgba(212,168,83,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>PROFILE</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: "#FBF8F3", fontWeight: 500 }}>
              {profile.skinType || "未設定"} {profile.age ? `· ${profile.age}` : ""}
            </div>
          </div>
          <button onClick={onEditProfile} style={{ fontSize: 11, padding: "7px 14px", background: "rgba(212,168,83,.15)", color: "#D4A853", border: "1px solid rgba(212,168,83,.3)", borderRadius: 20, cursor: "pointer", fontWeight: 600 }}>
            編集
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(251,248,243,.4)", letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>SKIN</div>
            <div style={{ fontSize: 13, color: "#FBF8F3" }}>{profile.skinType || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(251,248,243,.4)", letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>HAIR</div>
            <div style={{ fontSize: 13, color: "#FBF8F3" }}>{profile.hairType || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(251,248,243,.4)", letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>CONCERNS</div>
            <div style={{ fontSize: 13, color: "#FBF8F3" }}>
              {profile.concerns.length > 0 ? profile.concerns.join("・") : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(251,248,243,.4)", letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>PLAN</div>
            <div style={{ fontSize: 13, color: isPro ? "#D4A853" : "rgba(251,248,243,.6)", fontWeight: isPro ? 700 : 400 }}>
              {isPro ? "PRO MEMBER" : "FREE"}
            </div>
          </div>
        </div>
      </section>

      {isPro && preferences && preferences.confidence > 0 && (
        <section className="motion-reveal" style={{ background: "#fff", border: "1px solid #D4A85366", borderRadius: 16, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.24em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>PERSONAL MEMORY</div>
              <div style={{ fontSize: 14, color: "#150B00", fontWeight: 800 }}>{preferences.summary}</div>
              <div style={{ fontSize: 11, color: "#8A7A6E", marginTop: 4 }}>
                ログ{preferences.logCount}件・保存{preferences.savedCount}件から学習中
              </div>
            </div>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#1A0E08", color: "#D4A853", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 700 }}>
              {preferences.confidence}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {preferences.positiveSignals.slice(0, 6).map((signal) => (
              <span key={signal} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "#F8F4EF", color: "#A8722A", border: "1px solid #EDE5DC", fontWeight: 700 }}>
                {signal}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 直近の解析結果 ── */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader
          label="01"
          title="成分解析の記録"
          sub={analysisLoading ? "読み込み中" : isPro ? `${analysisTotal}件の解析` : `${visibleAnalyses.length}/${PLAN_RULES.free.savedAnalysisLimit}件表示`}
        />

        {analysisLoading ? (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 16, padding: "24px", textAlign: "center", color: "#8A7A6E", fontSize: 13 }}>
            解析履歴を読み込み中...
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 16, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
            <p style={{ fontSize: 14, color: "#8A7A6E", marginBottom: 16 }}>まだ成分解析をしていません</p>
            <button onClick={onGoAnalyze} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", border: "none", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              成分解析をする →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* 最新の詳細カード */}
            {latestAnalysis && (
              <div style={{ background: "linear-gradient(145deg,#1A0E08,#3D2010)", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(212,168,83,.6)", letterSpacing: "0.2em", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>最新の解析</div>
                    <div style={{ fontSize: 16, color: "#FBF8F3", fontWeight: 600 }}>{latestAnalysis.result.productType}</div>
                    <div style={{ fontSize: 10, color: "rgba(251,248,243,.4)", marginTop: 2 }}>
                      {new Date(latestAnalysis.date).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#D4A853", fontWeight: 500 }}>
                      {latestAnalysis.result.overallScore}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(212,168,83,.6)", letterSpacing: "0.1em" }}>SCORE</div>
                  </div>
                </div>
                <ScoreBar score={latestAnalysis.result.overallScore} />
                <p style={{ fontSize: 12, color: "rgba(251,248,243,.7)", marginTop: 12, lineHeight: 1.7 }}>
                  {latestAnalysis.result.verdict}
                </p>
                {latestAnalysis.result.keyIngredient && (
                  <div style={{ marginTop: 10, display: "inline-block", padding: "4px 12px", background: "rgba(212,168,83,.15)", border: "1px solid rgba(212,168,83,.3)", borderRadius: 20 }}>
                    <span style={{ fontSize: 11, color: "#D4A853" }}>🌟 {latestAnalysis.result.keyIngredient}</span>
                  </div>
                )}
              </div>
            )}

            {/* 履歴リスト */}
            {visibleAnalyses.length > 1 && (
              <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, overflow: "hidden" }}>
                {visibleAnalyses.slice(1).map((a, i) => (
                  <div key={a.id}>
                    <button
                      onClick={() => setOpenAnalysis(openAnalysis === a.id ? null : a.id)}
                      style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#150B00" }}>{a.result.productType}</div>
                        <div style={{ fontSize: 11, color: "#8A7A6E", marginTop: 2 }}>{new Date(a.date).toLocaleDateString("ja-JP")}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 15, fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#A8722A", fontWeight: 500 }}>{a.result.overallScore}点</span>
                        <span style={{ fontSize: 10, color: "#8A7A6E" }}>{openAnalysis === a.id ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {openAnalysis === a.id && (
                      <div style={{ padding: "0 16px 14px", borderTop: "1px solid #EDE5DC" }}>
                        <p style={{ fontSize: 12, color: "#6B5B4A", lineHeight: 1.7, marginTop: 10 }}>{a.result.verdict}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          {a.result.skinTypes.map(s => (
                            <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#E8F5E9", color: "#2E7D32" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {i < visibleAnalyses.length - 2 && <div style={{ height: 1, background: "#EDE5DC" }}/>}
                  </div>
                ))}
              </div>
            )}
            {!isPro && hiddenAnalysisCount > 0 && (
              <div style={{ background: "#fff", border: "1px solid #D4A85366", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#150B00" }}>過去{hiddenAnalysisCount}件の解析履歴を保存中</div>
                  <div style={{ fontSize: 11, color: "#8A7A6E", marginTop: 2 }}>PROで履歴50件まで見返せます。</div>
                </div>
                <button className="motion-cta" onClick={onUpgrade} style={{ border: "none", borderRadius: 999, padding: "8px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  解放
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── おすすめ製品 ── */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader label="02" title="あなたへのおすすめ" sub="プロフィールに合わせて選定" />
        {products.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 16, padding: "24px", textAlign: "center", color: "#8A7A6E", fontSize: 13 }}>
            プロフィールを設定するとおすすめが表示されます
          </div>
        ) : (
          <>
            {topProduct && (
              <div style={{ background: "linear-gradient(135deg,#FFF9EC,#fff)", border: "1px solid #D4A85366", borderRadius: 16, padding: 16, marginBottom: 12, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "center" }} className="grid-cols-1-mobile motion-reveal">
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".2em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>BUYER RECOMMENDATION</div>
                  <div style={{ fontSize: 16, lineHeight: 1.45, color: "#150B00", fontWeight: 900 }}>{topProduct.name}</div>
                  <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.7, color: "#6B5B4A" }}>
                    {topProduct.brand} / {formatPrice(topProduct.price)} / レビュー{topProduct.rev.toLocaleString()}件
                    {topMatch ? ` / 相性${topMatch.score}%` : ""}。まずこの候補を購入前チェックに進めます。
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button className="motion-cta" onClick={() => onOpenProduct(topProduct)} style={{ border: "none", borderRadius: 999, padding: "10px 14px", background: "#1A0E08", color: "#D4A853", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                    商品を開く
                  </button>
                  {!isPro && (
                    <button className="motion-nav-button" onClick={onUpgrade} style={{ border: "1px solid #D4A853", borderRadius: 999, padding: "10px 14px", background: "#fff", color: "#A8722A", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                      PROで購入判断
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="motion-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
              {products.map(p => {
                const m = CAT_META[p.cat];
                const locked = !p.free && !isPro;
                const match = getPersonalMatch(p, profile, isPro ? preferences : null);
                return (
                  <div key={p.id} className="motion-card tap-card" role="button" tabIndex={0} onClick={() => locked ? onUpgrade() : onOpenProduct(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); locked ? onUpgrade() : onOpenProduct(p); } }} style={{ background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s", boxShadow: "0 2px 10px rgba(21,11,0,.05)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
                    <div style={{ background: m.color, padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: m.dark, fontWeight: 700 }}>{m.icon} {p.cat}</span>
                      <span style={{ fontSize: 9, color: m.accent }}>{p.brand}</span>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, color: "#150B00", marginBottom: 4 }}>{p.name}</div>
                      <Stars rating={p.rating} size={10} />
                      <span style={{ fontSize: 10, color: "#8A7A6E", marginLeft: 4 }}>{p.rev.toLocaleString()}件</span>
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, color: "#A8722A" }}>{formatPrice(p.price)}</span>
                        {isPro && match ? (
                          <span className="tap-card-hint" style={{ fontSize: 10, color: "#A8722A", fontWeight: 800 }}>{match.score}% MATCH</span>
                        ) : locked ? (
                          <span className="tap-card-hint" style={{ fontSize: 10, color: "#8A7A6E" }}>🔒 PRO</span>
                        ) : <span className="tap-card-hint" style={{ fontSize: 10, color: "#A8722A", fontWeight: 800 }}>詳細 →</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── おすすめ動画 ── */}
      {videos.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader label="03" title="あなたにおすすめの動画" sub={`${profile.skinType || "美容"}系コンテンツ`} />
          <div className="motion-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {videos.map(v => (
              <a key={v.id} className="motion-card" href={v.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "flex", gap: 12, background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: "12px 14px", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(21,11,0,.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}>
                {v.thumbnail && (
                  <img src={v.thumbnail} alt={v.title} style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#150B00", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</div>
                  <div style={{ fontSize: 10, color: "#D4A853", marginTop: 4 }}>🔥 {v.views}回再生</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── 美容習慣アドバイス ── */}
      <section>
        <SectionHeader label="04" title={`${profile.skinType || "あなた"}のおすすめ習慣`} sub="毎日のルーティンに取り入れよう" />
        <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg,#1A0E08,#2C1A0E)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{habits.icon}</span>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace,monospace" }}>DAILY ROUTINE</div>
              <div style={{ fontSize: 15, color: "#FBF8F3", fontWeight: 600, marginTop: 2 }}>{profile.skinType || "普通肌"}向けルーティン</div>
            </div>
          </div>
          {habits.tips.map((tip, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < habits.tips.length - 1 ? "1px solid #EDE5DC" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#D4A853,#A8722A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#1A0E08", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 13, color: "#4A3728", lineHeight: 1.7, margin: 0 }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>━━ {label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, fontWeight: 400, color: "#150B00", margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace" }}>{sub}</span>
      </div>
    </div>
  );
}
