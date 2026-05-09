"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { GoldButton } from "@/components/ui";
import { PLAN_FEATURE_MATRIX, PLAN_RULES } from "@/lib/plan";
import { trackProductEvent } from "@/lib/productEvents";
import { supabase } from "@/lib/supabase";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
  user: User | null;
}

const FAQ = [
  { q: "いつでもキャンセルできますか？", a: "いつでも解約OK。期間終了までPROを使えます。" },
  { q: "支払い方法は？", a: "カード決済です。変更は契約管理から。" },
  { q: "無料トライアルはありますか？", a: `${PLAN_RULES.pro.trialDays}日間あります。` },
];

const GROWTH_VALUE_CARDS = [
  { value: "相談", label: "カルテ相談室", body: "保存・ログを見ながらそのまま質問OK" },
  { value: "30日", label: "変化の見通し", body: "続けた時の目安を確認" },
  { value: "記録", label: "美容ログ", body: "使った感想を次の候補に反映" },
  { value: "比較", label: "商品詳細", body: "価格・レビュー・注意点を並べる" },
  { value: "差分", label: "前回比較", body: "合った理由を見返す" },
];

interface SubscriptionStatus {
  isPro: boolean;
  hasStripeCustomer: boolean;
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function PremiumTab({ isPro, onUpgrade, user }: Props) {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isGuest = !user;

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const fetchStatus = async () => {
      setStatusLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatusLoading(false);
        return;
      }

      const res = await fetch("/api/stripe/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      const data = await res.json();
      if (!ignore && res.ok) setSubscriptionStatus(data);
      if (!ignore) setStatusLoading(false);
    };

    fetchStatus();
    const refetchStatus = () => { void fetchStatus(); };
    const refetchWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchStatus();
    };
    window.addEventListener("focus", refetchStatus);
    document.addEventListener("visibilitychange", refetchWhenVisible);
    return () => {
      ignore = true;
      window.removeEventListener("focus", refetchStatus);
      document.removeEventListener("visibilitychange", refetchWhenVisible);
    };
  }, [user, isPro]);

  const handleCheckout = async () => {
    if (isGuest) {
      onUpgrade();
      return;
    }
    setLoading(true);
    try {
      void trackProductEvent({
        eventType: "upgrade_click",
        sourceArea: "premium_checkout",
        isPro,
      });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("ログインが必要です");

      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      const { url, error } = await res.json();
      if (!res.ok || error) throw new Error(error ?? "決済セッションの作成に失敗");
      if (url) window.location.href = url;
    } catch {
      alert("エラーが発生しました。もう一度お試しください。");
    }
    setLoading(false);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("ログインが必要です");

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      const { url, error } = await res.json();
      if (!res.ok || error) throw new Error(error ?? "契約管理ページを開けませんでした");
      if (url) window.location.href = url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "契約管理ページを開けませんでした。");
    }
    setPortalLoading(false);
  };

  const statusLabel = subscriptionStatus?.status
    ? ({
        trialing: "無料トライアル中",
        active: "有効",
        past_due: "支払い確認中",
        canceled: "キャンセル済み",
        unpaid: "未払い",
        incomplete: "登録未完了",
        incomplete_expired: "登録期限切れ",
        paused: "停止中",
        deleted: "解約済み",
      } as Record<string, string>)[subscriptionStatus.status] ?? subscriptionStatus.status
    : null;

  const periodEndLabel = subscriptionStatus?.currentPeriodEnd
    ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const isCancelScheduled = Boolean(subscriptionStatus?.cancelAtPeriodEnd && periodEndLabel);
  const proStatusTitle = isCancelScheduled ? "\u89e3\u7d04\u4e88\u7d04\u6e08\u307f" : "PRO\u30d7\u30e9\u30f3\u52a0\u5165\u4e2d";
  const proStatusBody = statusLoading
    ? "\u5951\u7d04\u72b6\u614b\u3092\u78ba\u8a8d\u4e2d..."
    : isCancelScheduled
      ? `PRO\u306f${periodEndLabel}\u307e\u3067\u5229\u7528\u3067\u304d\u307e\u3059`
      : statusLabel
        ? `${statusLabel}${periodEndLabel ? ` \u30fb \u6b21\u56de\u66f4\u65b0 ${periodEndLabel}` : ""}`
        : "\u3059\u3079\u3066\u306ePRO\u6a5f\u80fd\u3092\u3054\u5229\u7528\u3044\u305f\u3060\u3051\u307e\u3059";
  return (
    <div className="px-4 py-5 pb-10 mobile-tight motion-fade-scale" style={{ maxWidth: 1180, margin: "0 auto" }}>
      {/* HEADER */}
      <div className="rounded-[22px] overflow-hidden mb-5 relative motion-premium-hero"
        style={{ background: "linear-gradient(145deg,#1A0E08 0%,#2A1208 50%,#4A1E0A 100%)", padding: "32px 24px 28px" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "repeating-linear-gradient(90deg,rgba(212,168,83,.08) 0 1px,transparent 1px 90px),linear-gradient(90deg,transparent,rgba(212,168,83,.14),transparent)" }}/>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg,transparent,#D4A853,transparent)" }}/>
        <div className="relative">
          <p className="text-[9px] font-semibold tracking-[3px] mb-3"
            style={{ color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace, monospace" }}>
            PROプラン
          </p>
          <h2 className="mb-2"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.2, color: "#F5EEE4", fontWeight: 500 }}>
            候補選びを、<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>もっと迷わず。</span>
          </h2>
          <p className="text-[12px]" style={{ color: "rgba(245,238,228,.55)" }}>
            {PLAN_RULES.pro.trialDays}日無料トライアル、その後月額{PLAN_RULES.pro.priceLabel}（税込）
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#EDE5DC] p-4 mb-5 motion-reveal">
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.24em] font-semibold mb-1" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>
            {"続けるための道具"}
          </p>
          <h3 className="text-[18px] font-bold" style={{ color: "#150B00" }}>
            {"選ぶ、使う、見返すをつなげる"}
          </h3>
          <p className="text-[12px] mt-1 leading-[1.7]" style={{ color: "#8A7A6E" }}>
            {"PROは保存、ログ、商品比較をまとめて、次に見るべき候補を絞ります。"}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-4 motion-stagger">
          {GROWTH_VALUE_CARDS.map((item) => (
            <div key={item.label} className="rounded-[14px] border p-3 motion-card" style={{ borderColor: "#EDE5DC", background: "#F8F4EF" }}>
              <div className="text-[22px] font-black" style={{ color: "#A8722A", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{item.value}</div>
              <div className="text-[12px] font-black mt-1" style={{ color: "#150B00" }}>{item.label}</div>
              <p className="text-[11px] leading-[1.65] mt-1" style={{ color: "#6B5B4A" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#EDE5DC] p-4 mb-5 motion-reveal">
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.24em] font-semibold mb-1" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>
            {"できること"}
          </p>
          <h3 className="text-[18px] font-bold" style={{ color: "#150B00" }}>
            {"\u30b2\u30b9\u30c8\u3001\u7121\u6599\u4f1a\u54e1\u3001PRO\u306e\u9055\u3044"}
          </h3>
          <p className="text-[12px] mt-1 leading-[1.7]" style={{ color: "#8A7A6E" }}>
            {"\u898b\u308b\u3001\u6b8b\u3059\u3001\u6df1\u304f\u9078\u3076\u3002"}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-3 motion-stagger">
          {[
            {
              label: "\u30b2\u30b9\u30c8",
              price: "\u767b\u9332\u306a\u3057",
              body: "\u691c\u7d22\u30fb\u30e9\u30f3\u30ad\u30f3\u30b0",
            },
            {
              label: "\u7121\u6599\u4f1a\u54e1",
              price: "\u00a50",
              body: "\u4fdd\u5b58\u30fb\u6bd4\u8f03\u30fb\u30ed\u30b0",
            },
            {
              label: "PRO",
              price: `${PLAN_RULES.pro.priceLabel}/\u6708`,
              body: "\u7121\u5236\u9650\u89e3\u6790\u30fb\u8cfc\u5165\u30ea\u30f3\u30af",
            },
          ].map((plan) => (
            <div key={plan.label} className="rounded-[14px] border p-3 motion-card" style={{ borderColor: plan.label === "PRO" ? "#D4A85388" : "#EDE5DC", background: plan.label === "PRO" ? "#FEF9F0" : "#F8F4EF" }}>
              <div className="text-[12px] font-black" style={{ color: "#150B00" }}>{plan.label}</div>
              <div className="text-[18px] font-bold mt-1" style={{ color: plan.label === "PRO" ? "#A8722A" : "#150B00" }}>{plan.price}</div>
              <p className="text-[11px] leading-[1.65] mt-2" style={{ color: "#6B5B4A" }}>{plan.body}</p>
            </div>
          ))}
        </div>
        {isGuest && (
          <button
            onClick={onUpgrade}
            className="mt-4 w-full rounded-[12px] border-none py-3 text-[13px] font-black cursor-pointer motion-cta"
            style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08" }}
          >
            {"\u7121\u6599\u767b\u9332\u3057\u3066\u4fdd\u5b58\u30fb\u30ed\u30b0\u3092\u4f7f\u3046"}
          </button>
        )}
      </div>

      {/* ALREADY PRO */}
      {isPro && (
        <div className="rounded-[16px] p-4 mb-5 text-center border motion-reveal motion-status-pulse"
          style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <p className="text-[22px] mb-1">👑</p>
          <p className="text-[15px] font-bold" style={{ color: "#150B00" }}>{proStatusTitle}</p>
          <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>
            {proStatusBody}
          </p>
          {isCancelScheduled && (
            <div className="mt-3 mx-auto max-w-[520px] rounded-[12px] px-4 py-3 text-left"
              style={{ background: "#fff", border: "1px solid rgba(212,168,83,.38)", color: "#6B4A1E" }}>
              <p className="text-[12px] font-bold">{"\u6b21\u56de\u8acb\u6c42\u306f\u767a\u751f\u3057\u307e\u305b\u3093"}</p>
              <p className="text-[11px] mt-1 leading-[1.7]">
                {"\u89e3\u7d04\u4e88\u7d04\u6e08\u307f\u3067\u3059\u3002"}{periodEndLabel}{"\u307e\u3067\u306f\u691c\u7d22\u30fb\u4fdd\u5b58\u30fb\u5206\u6790\u306a\u3069\u306ePRO\u6a5f\u80fd\u3092\u305d\u306e\u307e\u307e\u4f7f\u3048\u307e\u3059\u3002"}
              </p>
            </div>
          )}
        </div>
      )}

      {isPro && (
        <div className="rounded-[16px] p-4 mb-5 border bg-white motion-reveal"
          style={{ borderColor: "#EDE5DC" }}>
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <p className="text-[12px] font-bold" style={{ color: "#150B00" }}>契約管理</p>
              <p className="text-[11px] mt-1 leading-[1.6]" style={{ color: "#8A7A6E" }}>
                {isCancelScheduled ? "\u671f\u9593\u7d42\u4e86\u307e\u3067PRO\u5229\u7528OK\u3002" : "\u652f\u6255\u3044\u30fb\u89e3\u7d04\u306fStripe\u3067\u7ba1\u7406\u3002"}
              </p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "#F8F4EF", color: "#8A7A6E" }}>
              {subscriptionStatus?.hasStripeCustomer ? "Stripe" : "手動"}
            </span>
          </div>
          {subscriptionStatus?.hasStripeCustomer ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="w-full py-3 rounded-[12px] text-[13px] font-bold border-none cursor-pointer motion-cta"
              style={{ background: "#150B00", color: "#FBF8F3", opacity: portalLoading ? 0.7 : 1 }}>
              {portalLoading ? "開いています..." : "契約・支払いを管理する →"}
            </button>
          ) : (
            <p className="text-[11px] leading-[1.6]" style={{ color: "#8A7A6E" }}>
              管理者/手動PROのためStripe契約ページはありません。
            </p>
          )}
        </div>
      )}

      {/* PLAN CARDS */}
      <div className="space-y-3 mb-5 motion-stagger">
        {/* FREE */}
        <div className="bg-white rounded-[16px] border border-[#EDE5DC] p-4 motion-card">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide mb-0.5" style={{ color: "#8A7A6E" }}>無料</p>
              <p className="text-[20px] font-bold" style={{ color: "#150B00" }}>{PLAN_RULES.free.priceLabel}<span className="text-[12px] font-normal ml-1" style={{ color: "#8A7A6E" }}>/ 月</span></p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold border"
              style={{ background: "#F8F4EF", color: "#8A7A6E", borderColor: "#EDE5DC" }}>
              {isPro ? "旧プラン" : "現在のプラン"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {PLAN_FEATURE_MATRIX.map((f) => (
              <li key={f.label} className="flex items-center justify-between gap-3 text-[12px]" style={{ color: "#555" }}>
                <span className="flex items-center gap-2"><span style={{ color: "#A8722A" }}>✓</span>{f.label}</span>
                <span style={{ color: "#8A7A6E" }}>{f.free}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PRO */}
        <div className="rounded-[16px] p-4 relative overflow-hidden border motion-card motion-premium-hero"
          style={{ background: "linear-gradient(145deg,#1A0E08,#2A1208)", borderColor: "#D4A85355" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg,transparent,#D4A853,transparent)" }}/>
          <div className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08" }}>
            おすすめ
          </div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide mb-0.5" style={{ color: "rgba(212,168,83,.7)" }}>PRO</p>
              <p className="text-[20px] font-bold" style={{ color: "#F5EEE4" }}>{PLAN_RULES.pro.priceLabel}<span className="text-[12px] font-normal ml-1" style={{ color: "rgba(245,238,228,.5)" }}>/ 月</span></p>
            </div>
            {isPro && (
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(212,168,83,.15)", color: "#D4A853", border: "1px solid #D4A85344" }}>
                加入中 👑
              </span>
            )}
          </div>
          <ul className="space-y-1.5 mb-4">
            {PLAN_FEATURE_MATRIX.map((f) => (
              <li key={f.label} className="flex items-center justify-between gap-3 text-[12px]" style={{ color: "rgba(245,238,228,.85)" }}>
                <span className="flex items-center gap-2"><span style={{ color: "#D4A853" }}>★</span>{f.label}</span>
                <span style={{ color: "#D4A853", fontWeight: 700 }}>{f.pro}</span>
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3.5 rounded-[12px] text-[13px] font-bold border-none cursor-pointer motion-cta"
              style={{ background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08",
                boxShadow: "0 6px 20px rgba(212,168,83,.35)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "処理中..." : isGuest ? "\u7121\u6599\u767b\u9332\u3057\u3066PRO\u3092\u59cb\u3081\u308b \u2192" : `${PLAN_RULES.pro.trialDays}日無料でPROを試す →`}
            </button>
          )}
        </div>
      </div>

      {!isPro && (
        <div className="rounded-[16px] p-4 mb-5 border motion-reveal"
          style={{ background: "#fff", borderColor: "#D4A85366" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: "#150B00" }}>PROで変わること</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "∞", label: "解析" },
              { value: "50", label: "履歴" },
              { value: "全て", label: "楽天詳細" },
            ].map((item) => (
              <div key={item.label} className="rounded-[12px] py-3 text-center motion-card" style={{ background: "#F8F4EF" }}>
                <p className="text-[19px] font-bold" style={{ color: "#A8722A" }}>{item.value}</p>
                <p className="text-[10px]" style={{ color: "#8A7A6E" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div>
        <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: "#150B00" }}>よくある質問</p>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-[#EDE5DC] overflow-hidden motion-card">
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
            {loading ? "処理中..." : isGuest ? "\u7121\u6599\u767b\u9332\u3057\u3066PRO\u3092\u59cb\u3081\u308b" : `${PLAN_RULES.pro.trialDays}日無料でPROを始める`}
          </GoldButton>
          <p className="text-center text-[11px] mt-2" style={{ color: "#8A7A6E" }}>
            いつでもキャンセル可能 · Stripe安全決済
          </p>
        </div>
      )}
    </div>
  );
}
