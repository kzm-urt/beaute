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

interface SubscriptionStatus {
  isPro: boolean;
  hasStripeCustomer: boolean;
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const FAQ = [
  { q: "いつでもキャンセルできますか？", a: "いつでも解約できます。解約後も、支払い済み期間の終了まではPRO機能を利用できます。" },
  { q: "支払い方法は？", a: "Stripeを通じたクレジットカード決済です。カード情報はbeautia側では保持しません。" },
  { q: "無料トライアルはありますか？", a: `${PLAN_RULES.pro.trialDays}日間の無料トライアルがあります。` },
  { q: "商品はbeautiaから届きますか？", a: "いいえ。beautiaは美容商品の検索・比較補助サービスです。楽天市場など外部サイトでの商品購入、配送、返品は遷移先サイトの条件に従います。" },
];

const VALUE_CARDS = [
  { title: "パーソナル相談", body: "肌・髪・注意メモを見ながら、1日20回まで相談できます。" },
  { title: "写真分析", body: "顔・メイク診断、成分表示、おすすめコスメまで一気に整理できます。" },
  { title: "保存・比較", body: "気になる商品をあとで比べやすく、候補を整理できます。" },
  { title: "美容ログ", body: "使った感想を残して、次の商品選びに活かせます。" },
];

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

    void fetchStatus();
    const refetchStatus = () => {
      void fetchStatus();
    };
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("ログインが必要です");

      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      const { url, error } = await res.json();
      if (!res.ok || error) throw new Error(error ?? "決済セッションを作成できませんでした");
      if (url) window.location.href = url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      alert(error instanceof Error ? error.message : "契約管理ページを開けませんでした");
    } finally {
      setPortalLoading(false);
    }
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
  const proStatusTitle = isCancelScheduled ? "解約予約済み" : "PROプラン加入中";
  const proStatusBody = statusLoading
    ? "契約状態を確認中..."
    : isCancelScheduled
      ? `PROは${periodEndLabel}まで利用できます`
      : statusLabel
        ? `${statusLabel}${periodEndLabel ? ` ・ 次回更新 ${periodEndLabel}` : ""}`
        : "すべてのPRO機能をご利用いただけます";

  return (
    <div className="px-4 py-5 pb-10 mobile-tight motion-fade-scale" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <section
        className="rounded-[22px] overflow-hidden mb-5 relative motion-premium-hero"
        style={{ background: "linear-gradient(145deg,#1A0E08 0%,#2A1208 50%,#4A1E0A 100%)", padding: "32px 24px 28px" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "repeating-linear-gradient(90deg,rgba(212,168,83,.08) 0 1px,transparent 1px 90px),linear-gradient(90deg,transparent,rgba(212,168,83,.14),transparent)" }}
        />
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#D4A853,transparent)" }} />
        <div className="relative">
          <p className="text-[9px] font-semibold tracking-[3px] mb-3" style={{ color: "rgba(212,168,83,.6)", fontFamily: "ui-monospace, monospace" }}>
            BEAUTIA PRO
          </p>
          <h2
            className="mb-2"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.2, color: "#F5EEE4", fontWeight: 500 }}
          >
            選ぶ、残す、相談する。
            <br />
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>美容の判断を少しラクに。</span>
          </h2>
          <p className="text-[12px]" style={{ color: "rgba(245,238,228,.68)" }}>
            {PLAN_RULES.pro.trialDays}日間無料トライアル、その後月額{PLAN_RULES.pro.priceLabel}（税込）。
          </p>
        </div>
      </section>

      {isPro && (
        <section className="rounded-[16px] p-4 mb-5 text-center border motion-reveal" style={{ background: "linear-gradient(135deg,#FEF9F0,#FDF3E3)", borderColor: "#D4A853" }}>
          <p className="text-[15px] font-bold" style={{ color: "#150B00" }}>{proStatusTitle}</p>
          <p className="text-[12px] mt-1" style={{ color: "#8A7A6E" }}>{proStatusBody}</p>
          {subscriptionStatus?.hasStripeCustomer && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="mt-4 px-5 py-3 rounded-[12px] text-[13px] font-bold border-none cursor-pointer motion-cta"
              style={{ background: "#150B00", color: "#FBF8F3", opacity: portalLoading ? 0.7 : 1 }}
            >
              {portalLoading ? "開いています..." : "契約・支払いを管理する →"}
            </button>
          )}
        </section>
      )}

      <section className="bg-white rounded-[18px] border border-[#EDE5DC] p-4 mb-5 motion-reveal">
        <div className="mb-3">
          <p className="text-[10px] tracking-[0.24em] font-semibold mb-1" style={{ color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>
            WHAT PRO INCLUDES
          </p>
          <h3 className="text-[18px] font-bold" style={{ color: "#150B00" }}>
            PROで使えること
          </h3>
          <p className="text-[12px] mt-1 leading-[1.7]" style={{ color: "#8A7A6E" }}>
            商品選び、顔・メイク診断、成分チェック、記録、相談をひとつの流れで使えます。
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-4 motion-stagger">
          {VALUE_CARDS.map((item) => (
            <div key={item.title} className="rounded-[14px] border p-3 motion-card" style={{ borderColor: "#EDE5DC", background: "#F8F4EF" }}>
              <div className="text-[12px] font-black" style={{ color: "#150B00" }}>{item.title}</div>
              <p className="text-[11px] leading-[1.65] mt-1" style={{ color: "#6B5B4A" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 mb-5 motion-stagger">
        <PlanCard title="無料" price={`${PLAN_RULES.free.priceLabel}/月`} active={!isPro} tone="light" />
        <PlanCard title="PRO" price={`${PLAN_RULES.pro.priceLabel}/月`} active={isPro} tone="dark" />
      </section>

      {!isPro && (
        <section className="rounded-[16px] p-4 mb-5 border motion-reveal" style={{ background: "#fff", borderColor: "#D4A85366" }}>
          <GoldButton onClick={handleCheckout} disabled={loading}>
            {loading ? "処理中..." : isGuest ? "無料登録してPROを始める" : `${PLAN_RULES.pro.trialDays}日間無料でPROを試す`}
          </GoldButton>
          <p className="text-center text-[11px] mt-2" style={{ color: "#8A7A6E" }}>
            いつでもキャンセル可能 / Stripe安全決済
          </p>
        </section>
      )}

      <section className="bg-white rounded-[18px] border border-[#EDE5DC] p-4 mb-5 motion-reveal">
        <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: "#150B00" }}>機能比較</p>
        <div className="space-y-2">
          {PLAN_FEATURE_MATRIX.map((feature) => (
            <div key={feature.label} className="grid grid-cols-[1fr_92px_92px] gap-2 items-center text-[12px] border-t border-[#EDE5DC] pt-2">
              <span style={{ color: "#150B00", fontWeight: 800 }}>{feature.label}</span>
              <span style={{ color: "#8A7A6E", textAlign: "right" }}>{feature.free}</span>
              <span style={{ color: "#A8722A", fontWeight: 900, textAlign: "right" }}>{feature.pro}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: "#150B00" }}>よくある質問</p>
        <div className="space-y-2">
          {FAQ.map((item, index) => (
            <div key={item.q} className="bg-white rounded-[14px] border border-[#EDE5DC] overflow-hidden motion-card">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex justify-between items-center px-4 py-3 text-left bg-transparent border-none cursor-pointer"
              >
                <span className="text-[13px] font-semibold" style={{ color: "#150B00" }}>{item.q}</span>
                <span className="text-[16px] ml-2 shrink-0" style={{ color: "#A8722A" }}>{openFaq === index ? "-" : "+"}</span>
              </button>
              {openFaq === index && (
                <div className="px-4 pb-3">
                  <p className="text-[12px] leading-[1.65]" style={{ color: "#6B5B4A" }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-[11px] leading-[1.8]" style={{ color: "#8A7A6E" }}>
        取引条件は <a href="/commercial" style={{ color: "#A8722A", fontWeight: 900 }}>特商法表記</a>、
        個人情報の扱いは <a href="/privacy" style={{ color: "#A8722A", fontWeight: 900 }}>プライバシーポリシー</a> をご確認ください。
      </p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  active,
  tone,
}: {
  title: string;
  price: string;
  active: boolean;
  tone: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className="rounded-[16px] p-4 border motion-card"
      style={{
        background: dark ? "linear-gradient(145deg,#1A0E08,#2A1208)" : "#fff",
        borderColor: dark ? "#D4A85355" : "#EDE5DC",
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide mb-0.5" style={{ color: dark ? "rgba(212,168,83,.7)" : "#8A7A6E" }}>{title}</p>
          <p className="text-[20px] font-bold" style={{ color: dark ? "#F5EEE4" : "#150B00" }}>{price}</p>
        </div>
        {active && (
          <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold border" style={{ background: dark ? "rgba(212,168,83,.15)" : "#F8F4EF", color: dark ? "#D4A853" : "#8A7A6E", borderColor: dark ? "#D4A85344" : "#EDE5DC" }}>
            現在のプラン
          </span>
        )}
      </div>
      <p className="text-[12px] leading-[1.7]" style={{ color: dark ? "rgba(245,238,228,.72)" : "#6B5B4A" }}>
        {dark ? PLAN_RULES.pro.headline : PLAN_RULES.free.headline}
      </p>
    </div>
  );
}
