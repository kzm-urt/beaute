"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/plan";
import { supabase } from "@/lib/supabase";

type FeedbackResponse = {
  id: string;
  tester_name: string | null;
  contact: string | null;
  relation: string | null;
  device: string | null;
  overall_rating: number | null;
  clarity_rating: number | null;
  recommendation_rating: number | null;
  design_rating: number | null;
  paid_value_rating: number | null;
  liked_features: string[] | null;
  confusing_parts: string[] | null;
  would_pay: string | null;
  expected_price: string | null;
  most_valuable: string | null;
  missing_feature: string | null;
  mobile_issue: string | null;
  referral_idea: string | null;
  free_comment: string | null;
  permission_to_quote: boolean | null;
  created_at: string;
};

type FeedbackSummary = {
  total: number;
  average: {
    overall: number;
    clarity: number;
    recommendation: number;
    design: number;
    paidValue: number;
  };
  wouldPay: Record<string, number>;
  device: Record<string, number>;
  likedFeatures: Array<{ label: string; count: number }>;
  confusingParts: Array<{ label: string; count: number }>;
};

type FeedbackPayload = {
  days: number;
  generatedAt: string;
  storage?: "beta_feedback" | "api_usage_events";
  summary: FeedbackSummary;
  responses: FeedbackResponse[];
};

const DAY_OPTIONS = [7, 30, 90, 180];

const WOULD_PAY_LABEL: Record<string, string> = {
  yes: "使う",
  maybe: "条件次第",
  no: "払わない",
  unknown: "不明",
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: "スマホ",
  desktop: "PC",
  tablet: "タブレット",
  unknown: "不明",
};

function Notice({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #EDE5DC", borderRadius: 14, background: "#fff", padding: 18, color: "#5F4A3D", fontSize: 13 }}>
      {children}
    </div>
  );
}

function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #E7B8B0", borderRadius: 14, background: "#FDE9E5", padding: 18, color: "#B13A2E", fontSize: 13, fontWeight: 800 }}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div style={{ border: "1px solid #EDE5DC", borderRadius: 14, background: "#fff", padding: 16, boxShadow: "0 8px 24px rgba(21, 11, 0, .04)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".18em", fontFamily: "ui-monospace, monospace", color: "#8A7A6E", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, lineHeight: 1, color: "#150B00", fontWeight: 700 }}>
        {value}
      </div>
      {note && <div style={{ marginTop: 8, fontSize: 11, color: "#A8722A", fontWeight: 800 }}>{note}</div>}
    </div>
  );
}

function ChipList({ items }: { items: string[] | null }) {
  if (!items?.length) return <span style={{ color: "#AFA295" }}>なし</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => (
        <span key={item} style={{ border: "1px solid #EDE5DC", borderRadius: 999, padding: "4px 9px", background: "#FFF9EC", color: "#6B4A1D", fontSize: 11, fontWeight: 800 }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function TopList({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <section style={{ border: "1px solid #EDE5DC", borderRadius: 16, background: "#fff", padding: 18 }}>
      <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>{title}</h2>
      <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
        {items.length === 0 && <div style={{ color: "#8A7A6E", fontSize: 12 }}>まだありません</div>}
        {items.map((item) => (
          <div key={item.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 10, alignItems: "center" }}>
            <span style={{ color: "#150B00", fontSize: 13, fontWeight: 800 }}>{item.label}</span>
            <strong style={{ color: "#A8722A", textAlign: "right" }}>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function responseTitle(response: FeedbackResponse) {
  return response.tester_name || response.contact || "匿名テスター";
}

export default function AdminFeedbackPage() {
  const { user, loading } = useAuth();
  const [days, setDays] = useState(30);
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);
  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email]);

  const loadFeedback = useCallback(async () => {
    setFetching(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("ログイン後にもう一度開いてください。");
        setPayload(null);
        return;
      }

      const res = await fetch(`/api/feedback?days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "アンケート結果を取得できませんでした。");
      setPayload(data as FeedbackPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アンケート結果を取得できませんでした。");
      setPayload(null);
    } finally {
      setFetching(false);
    }
  }, [days]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadFeedback();
    }
  }, [isAdmin, loadFeedback, loading, user]);

  const summary = payload?.summary;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8F4EF",
        color: "#150B00",
        padding: "34px 20px 56px",
        fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP",-apple-system,sans-serif',
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".24em", fontFamily: "ui-monospace, monospace", color: "#A8722A", marginBottom: 8 }}>
              BETA TEST FEEDBACK
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, lineHeight: 1.1, margin: 0, color: "#150B00", fontWeight: 500 }}>
              Feedback Inbox
            </h1>
            <p style={{ margin: "8px 0 0", color: "#6B5B4A", fontSize: 13, lineHeight: 1.7 }}>
              テスト公開の回答、課金価値、迷いどころ、拡散のヒントを確認します。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #EDE5DC", borderRadius: 999, padding: 4 }}>
              {DAY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setDays(option)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "7px 11px",
                    background: days === option ? "#1A0E08" : "transparent",
                    color: days === option ? "#D4A853" : "#8A7A6E",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {option}日
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadFeedback}
              disabled={fetching || loading || !user || !isAdmin}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#1A0E08",
                color: "#FBF8F3",
                fontSize: 12,
                fontWeight: 800,
                cursor: fetching || loading || !user || !isAdmin ? "default" : "pointer",
                opacity: fetching || loading || !user || !isAdmin ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {fetching ? "再集計中..." : "再集計"}
            </button>
            <a
              href="/feedback"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#fff",
                color: "#150B00",
                border: "1px solid #EDE5DC",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              公開フォーム
            </a>
          </div>
        </header>

        {loading && <Notice>認証状態を確認しています...</Notice>}
        {!loading && !user && <Notice>先にアプリへログインしてください。</Notice>}
        {!loading && user && !isAdmin && <Notice>この画面は管理者のみ利用できます。NEXT_PUBLIC_ADMIN_EMAILS に {user.email} を追加してください。</Notice>}
        {error && <ErrorNotice>{error}</ErrorNotice>}

        {summary && (
          <>
            {payload?.storage === "api_usage_events" && (
              <div style={{ marginBottom: 14 }}>
                <Notice>
                  beta_feedback テーブルが未反映のため、回答は一時的に APIログへ保存されています。Supabase SQL Editorで supabase/schema.sql を再実行すると正式テーブル保存に切り替わります。
                </Notice>
              </div>
            )}

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
              <MetricCard label="回答数" value={summary.total} note={`${days}日間`} />
              <MetricCard label="満足度" value={summary.average.overall || "-"} note="/ 5" />
              <MetricCard label="分かりやすさ" value={summary.average.clarity || "-"} note="/ 5" />
              <MetricCard label="おすすめ納得" value={summary.average.recommendation || "-"} note="/ 5" />
              <MetricCard label="デザイン" value={summary.average.design || "-"} note="/ 5" />
              <MetricCard label="有料価値" value={summary.average.paidValue || "-"} note="/ 5" />
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
              <TopList title="刺さったところ" items={summary.likedFeatures} />
              <TopList title="迷ったところ" items={summary.confusingParts} />
            </section>

            <section style={{ display: "grid", gap: 12 }}>
              {payload?.responses.length === 0 && <Notice>まだ回答はありません。</Notice>}
              {payload?.responses.map((response) => (
                <article key={response.id} style={{ border: "1px solid #EDE5DC", borderRadius: 16, background: "#fff", padding: 18, boxShadow: "0 8px 24px rgba(21, 11, 0, .04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "start" }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20, color: "#150B00" }}>{responseTitle(response)}</h2>
                      <p style={{ margin: "5px 0 0", color: "#8A7A6E", fontSize: 12 }}>
                        {formatDate(response.created_at)} / {DEVICE_LABEL[response.device ?? "unknown"] ?? response.device} / 有料: {WOULD_PAY_LABEL[response.would_pay ?? "unknown"] ?? response.would_pay}
                        {response.permission_to_quote ? " / 匿名引用OK" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", color: "#A8722A", fontWeight: 900 }}>
                      {response.overall_rating ?? "-"} / 5
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
                    {[
                      ["分かりやすさ", response.clarity_rating],
                      ["おすすめ", response.recommendation_rating],
                      ["デザイン", response.design_rating],
                      ["有料価値", response.paid_value_rating],
                      ["想定価格", response.expected_price || "-"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ borderRadius: 12, background: "#F8F4EF", padding: 10 }}>
                        <div style={{ color: "#8A7A6E", fontSize: 10, marginBottom: 5 }}>{label}</div>
                        <strong style={{ color: "#150B00", fontSize: 13 }}>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#A8722A", fontWeight: 900, marginBottom: 6 }}>良かったところ</div>
                      <ChipList items={response.liked_features} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#A8722A", fontWeight: 900, marginBottom: 6 }}>迷ったところ</div>
                      <ChipList items={response.confusing_parts} />
                    </div>
                  </div>

                  {[
                    ["払う理由", response.most_valuable],
                    ["足りない機能", response.missing_feature],
                    ["スマホで気になる", response.mobile_issue],
                    ["広まり方", response.referral_idea],
                    ["自由記述", response.free_comment],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: "#A8722A", fontWeight: 900, marginBottom: 5 }}>{label}</div>
                      <p style={{ margin: 0, color: "#5F4A3D", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{value}</p>
                    </div>
                  ))}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
