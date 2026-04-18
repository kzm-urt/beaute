"use client";
import { GoldButton } from "@/components/ui";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
}

const FREE_FEATURES = [
  [true,  "基本おすすめ（一部製品）"],
  [true,  "バズ動画リンク付き"],
  [true,  "成分解析 月3回"],
  [true,  "使用ログ 最大5件"],
  [false, "全製品データベース（30件以上）"],
  [false, "成分解析 無制限"],
  [false, "AIパーソナルアドバイス"],
  [false, "新着製品の優先通知"],
] as [boolean, string][];

const PRO_FEATURES = [
  "✅ 全製品データベース（随時更新）",
  "✅ 成分解析 無制限",
  "✅ 詳細成分比較レポート",
  "✅ 使用ログ 無制限",
  "✅ AIパーソナルアドバイス",
  "✅ 新着製品の優先通知",
  "✅ 広告なし",
];

const FAQ = [
  ["いつでも解約できますか？", "はい。次回更新日まで利用可能で、設定からいつでも解約できます。"],
  ["成分解析はどの製品でも使えますか？", "成分表が写真に写っていれば、国内外ほぼ全製品に対応しています。"],
  ["新製品の追加頻度は？", "週1回ペースで話題の新製品・季節アイテムを追加しています。"],
] as [string, string][];

export default function PremiumTab({ isPro, onUpgrade }: Props) {
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "guest", email: "" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("決済ページへの遷移に失敗しました。");
    }
  };

  return (
    <div className="px-4 py-5">
      <h2 className="text-[28px] italic mb-1" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", color: "#150B00" }}>
        プランを選ぶ
      </h2>
      <p className="text-[13px] mb-5" style={{ color: "#8A7A6E" }}>あなたの美容をさらに深く</p>

      {/* ── FREE PLAN ── */}
      <div className="bg-white border-[1.5px] border-[#EDE5DC] rounded-[20px] p-5 mb-3.5">
        <div className="flex justify-between items-center mb-3.5">
          <p className="text-[18px] font-bold" style={{ color: "#150B00" }}>FREE</p>
          <p className="text-[24px] font-bold" style={{ color: "#150B00" }}>¥0</p>
        </div>
        {FREE_FEATURES.map(([ok, text], i) => (
          <p key={i} className="text-[13px] py-1" style={{ color: ok ? "#150B00" : "#C4B4A8" }}>
            {ok ? "✅" : "——"} {text}
          </p>
        ))}
      </div>

      {/* ── PRO PLAN ── */}
      <div className="rounded-[20px] p-5 mb-4" style={{ background: "linear-gradient(145deg,#1A0E08,#3D2010)" }}>
        <div className="flex justify-between items-start mb-1">
          <p className="text-[18px] font-bold" style={{ color: "#D4A853" }}>👑 PRO</p>
          <div>
            <span className="text-[28px] font-bold" style={{ color: "#F5EEE4" }}>¥680</span>
            <span className="text-[12px] ml-0.5" style={{ color: "rgba(245,238,228,.45)" }}>/月</span>
          </div>
        </div>
        <p className="text-[11px] mb-3.5" style={{ color: "rgba(212,168,83,.6)" }}>
          7日間無料トライアル · いつでもキャンセル可能
        </p>
        {PRO_FEATURES.map((f, i) => (
          <p key={i} className="text-[13px] py-1" style={{ color: "#F5EEE4" }}>{f}</p>
        ))}
        <button
          onClick={isPro ? undefined : handleCheckout}
          className="w-full mt-4 rounded-[14px] py-3.5 text-[14px] font-bold border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,#D4A853,#F0C870)", color: "#1A0E08" }}>
          {isPro ? "✅ PRO加入済み" : "PROプランを始める（7日間無料）"}
        </button>
      </div>

      {/* ── FAQ ── */}
      <p className="text-[14px] font-bold mb-3" style={{ color: "#150B00" }}>よくある質問</p>
      {FAQ.map(([q, a]) => (
        <details key={q} className="mb-3 pb-3 border-b border-[#EDE5DC]">
          <summary className="text-[13px] font-semibold cursor-pointer" style={{ color: "#150B00", listStyle: "none" }}>
            Q. {q}
          </summary>
          <p className="text-[12px] mt-2 leading-[1.7]" style={{ color: "#8A7A6E" }}>{a}</p>
        </details>
      ))}
    </div>
  );
}
