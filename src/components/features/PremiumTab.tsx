"use client";
import { useState } from "react";
import { GoldButton } from "@/components/ui";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
}

const FREE_FEATURES = ["月3回の成分解析", "基本的な製品レコメンド", "使用ログ記録（無制限）", "カテゴリ検索"];
const PRO_FEATURES  = ["成分解析 無制限", "全製品フルアクセス", "AIパーソナル診断", "優先サポート", "新機能の先行アクセス"];

const FAQ = [
  { q: "いつでもキャンセルできますか？", a: "はい。設定画面からいつでも解約できます。解約後も期間終了まではPRO機能をご利用いただけます。" },
  { q: "支払い方法は？", a: "クレジットカード・デビットカードに対応しています（Stripe決済）。" },
  { q: "無料トライアルはありますか？", a: "現在は月額¥680からのご利用となります。まずは無料プランでお試しください。" },
];

export default function PremiumTab({ isPro, onUpgrade }: Props) {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("エラーが発生しました。もう一度お試しください。");
    }
    setLoading(false);
  };

  return (
    <div className="px-4 py-5 pb-10">
      {/* HEADER */}
      <div className="rounded-[22px] overflow-hidden mb-5 relative"
        style={{ background: "linear-gradient(145deg,#1A0E08 0%,#2A1208 50%,#4A1E0A 100%)", padding: "32px 24px 28px" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 85% 15%,rgba(212,168,83,.25) 0%,transparent 55%)" }}/>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg,transparent,#D4A853,transparent)" }}/>
        <div className="relative">
          <p className="text-[9px] font-semibold tracking-[3px] mb-3"
            style={{ color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace, monospace" }}>
            ★ PRO PLAN
          </p>
          <h2 className="mb-2"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.2, color: "#F5EEE4", fontWeight: 500 }}>
            あなたの美容を、<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>もっと賢く。</span>
          </h2>
          <p className="text-[12px]" style={{ color: "rgba(245,238,228,.55)" }}>
            月額¥680で全機能アンロック
          </p>
        </div>
      </div>

      {/* ALREADY PRO */}
      {isPro && (
        <div className="rounded-[16px] p-4 mb-5 text-center border"
          style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <p className="text-[22px] mb-1">👑</p>
          <p className="text-[15px] font-bold" style={{ color: "#150B00" }}>PROプラン加入中</p>
          <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>すべての機能をご利用いただけます</p>
        </div>
      )}

      {/* PLAN CARDS */}
      <div className="space-y-3 mb-5">
        {/* FREE */}
        <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide mb-0.5" style={{ color: "#8A7A6E" }}>FREE</p>
              <p className="text-[20px] font-bold" style={{ color: "#150B00" }}>¥0<span className="text-[12px] font-normal ml-1" style={{ color: "#8A7A6E" }}>/ 月</span></p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold border"
              style={{ background: "#F8F4EF", color: "#8A7A6E", borderColor: "#EDE5DC" }}>
              {isPro ? "旧プラン" : "現在のプラン"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[12px]" style={{ color: "#555" }}>
                <span style={{ color: "#A8722A" }}>✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* PRO */}
        <div className="rounded-[16px] p-4 relative overflow-hidden border"
          style={{ background: "linear-gradient(145deg,#1A0E08,#2A1208)", borderColor: "#D4A85355" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg,transparent,#D4A853,transparent)" }}/>
          <div className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08" }}>
            RECOMMENDED
          </div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide mb-0.5" style={{ color: "rgba(212,168,83,.7)" }}>PRO</p>
              <p className="text-[20px] font-bold" style={{ color: "#F5EEE4" }}>¥680<span className="text-[12px] font-normal ml-1" style={{ color: "rgba(245,238,228,.5)" }}>/ 月</span></p>
            </div>
            {isPro && (
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(212,168,83,.15)", color: "#D4A853", border: "1px solid #D4A85344" }}>
                加入中 👑
              </span>
            )}
          </div>
          <ul className="space-y-1.5 mb-4">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(245,238,228,.85)" }}>
                <span style={{ color: "#D4A853" }}>★</span>{f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-[12px] text-[13px] font-bold border-none cursor-pointer"
              style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08",
                boxShadow: "0 6px 20px rgba(212,168,83,.35)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "処理中..." : "PROにアップグレード →"}
            </button>
          )}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="mb-5">
        <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: "#150B00" }}>💬 ユーザーの声</p>
        <div className="space-y-2.5">
          {[
            { text: "成分解析が無制限になって、新製品を買う前に必ずチェックするようになった！", user: "田中 A." },
            { text: "全製品のレビューが見られて、比較がめちゃくちゃ楽になりました。", user: "中島 M." },
            { text: "月680円でこのクオリティは普通に安い。美容費が逆に減った気がする。", user: "近藤 Y." },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-[#EDE5DC] p-3.5">
              <p className="text-[12px] leading-[1.6] italic mb-2" style={{ color: "#444" }}>"{t.text}"</p>
              <p className="text-[10px] font-semibold" style={{ color: "#A8722A" }}>— {t.user}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: "#150B00" }}>よくある質問</p>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-[#EDE5DC] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center px-4 py-3 text-left bg-transparent border-none cursor-pointer">
                <span className="text-[13px] font-semibold" style={{ color: "#150B00" }}>{f.q}</span>
                <span className="text-[16px] ml-2 shrink-0" style={{ color: "#A8722A" }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-[12px] leading-[1.65]" style={{ color: "#6B5B4A" }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      {!isPro && (
        <div className="mt-6">
          <GoldButton onClick={handleCheckout} disabled={loading}>
            {loading ? "処理中..." : "今すぐPROにアップグレード"}
          </GoldButton>
          <p className="text-center text-[11px] mt-2" style={{ color: "#8A7A6E" }}>
            いつでもキャンセル可能 · Stripe安全決済
          </p>
        </div>
      )}
    </div>
  );
}
