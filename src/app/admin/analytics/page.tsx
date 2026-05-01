"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/plan";

interface EventBucket {
  key: string;
  product_view: number;
  locked_product_click: number;
  purchase_click: number;
  upgrade_click: number;
}

interface TopProduct {
  productKey: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  views: number;
  lockedClicks: number;
  purchases: number;
  upgradeClicks: number;
  purchaseValueJpy: number;
  estimatedRewardJpy: number;
  purchaseRate: number;
  lockedInterestRate: number;
}

interface RewardCategory {
  key: string;
  purchaseClicks: number;
  purchaseValueJpy: number;
  estimatedRewardJpy: number;
}

interface CommerceSummary {
  purchaseClicks: number;
  pricedPurchaseClicks: number;
  purchaseValueJpy: number;
  estimatedRewardJpy: number;
  averageOrderValueJpy: number;
  estimatedRewardPerClickJpy: number;
  commissionRatePercent: number;
  rewardCapJpy: number;
  byCategory: RewardCategory[];
}

interface ApiUsageBucket {
  key: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costJpy: number;
}

interface ApiCostSummary {
  totalRequests: number;
  totalCostUsd: number;
  totalCostJpy: number;
  inputTokens: number;
  outputTokens: number;
  byProvider: ApiUsageBucket[];
  byOperation: ApiUsageBucket[];
  pricing: {
    usdJpyRate: number;
    anthropicInputUsdPerMTok: number;
    anthropicOutputUsdPerMTok: number;
  };
  warning: string | null;
}

interface DailyFinance {
  key: string;
  productViews: number;
  lockedClicks: number;
  purchaseClicks: number;
  upgradeClicks: number;
  purchaseValueJpy: number;
  estimatedRewardJpy: number;
  apiCostJpy: number;
  grossProfitJpy: number;
}

interface AnalyticsInsight {
  tone: "good" | "warn" | "danger";
  title: string;
  body: string;
  metric: string;
}

interface AnalyticsResponse {
  days: number;
  generatedAt: string;
  counts: {
    totalEvents: number;
    productViews: number;
    lockedClicks: number;
    purchaseClicks: number;
    upgradeClicks: number;
    freeUsers: number;
    proUsers: number;
  };
  rates: {
    purchaseRate: number;
    lockedInterestRate: number;
    upgradeIntentRate: number;
  };
  byCategory: EventBucket[];
  bySource: EventBucket[];
  daily: EventBucket[];
  topProducts: TopProduct[];
  commerce: CommerceSummary;
  apiCost: ApiCostSummary;
  dailyFinance: DailyFinance[];
  insights: AnalyticsInsight[];
  profit: {
    estimatedGrossProfitJpy: number;
    rewardToCostRatio: number | null;
  };
}

const DAY_OPTIONS = [7, 14, 30, 90];

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const [days, setDays] = useState(14);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email]);

  const loadAnalytics = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("ログイン後にもう一度開いてください。");
        setAnalytics(null);
        return;
      }

      const res = await fetch(`/api/product-events?days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "集計を取得できませんでした。");
      setAnalytics(data as AnalyticsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "集計を取得できませんでした。");
      setAnalytics(null);
    } finally {
      setChecking(false);
    }
  }, [days]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, loadAnalytics, loading, user]);

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
              BEAUTE CONVERSION ANALYTICS
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, lineHeight: 1.1, margin: 0, color: "#150B00", fontWeight: 500 }}>
              Product Analytics
            </h1>
            <p style={{ margin: "8px 0 0", color: "#6B5B4A", fontSize: 13, lineHeight: 1.7 }}>
              商品詳細、ロック商品、楽天購入、PRO導線、API費用、楽天報酬見込みを見ます。
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
              onClick={loadAnalytics}
              disabled={checking || loading || !user || !isAdmin}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                background: "#1A0E08",
                color: "#FBF8F3",
                fontSize: 12,
                fontWeight: 800,
                cursor: checking || loading || !user || !isAdmin ? "default" : "pointer",
                opacity: checking || loading || !user || !isAdmin ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {checking ? "集計中..." : "再集計"}
            </button>
            <a
              href="/admin/status"
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
              状態確認
            </a>
          </div>
        </header>

        {loading && <Notice>認証状態を確認しています...</Notice>}
        {!loading && !user && <Notice>先にアプリへログインしてください。</Notice>}
        {!loading && user && !isAdmin && (
          <Notice>この画面は管理者のみ利用できます。`NEXT_PUBLIC_ADMIN_EMAILS` に {user.email} を追加してください。</Notice>
        )}
        {error && <ErrorNotice>{error}</ErrorNotice>}

        {analytics && (
          <>
            <section className="analytics-metric-grid" style={{ marginBottom: 18 }}>
              <MetricCard label="商品詳細" value={analytics.counts.productViews} sub={`${analytics.days}日間`} />
              <MetricCard label="ロック反応" value={analytics.counts.lockedClicks} sub={`${analytics.rates.lockedInterestRate}%`} />
              <MetricCard label="楽天購入" value={analytics.counts.purchaseClicks} sub={`${analytics.rates.purchaseRate}%`} />
              <MetricCard label="PRO意向" value={analytics.counts.upgradeClicks} sub={`${analytics.rates.upgradeIntentRate}%`} />
              <MetricCard label="FREEユーザー" value={analytics.counts.freeUsers} sub="計測対象" />
              <MetricCard label="PROユーザー" value={analytics.counts.proUsers} sub="計測対象" />
            </section>

            <FinanceOverview analytics={analytics} />

            <section className="analytics-two-col" style={{ marginBottom: 18 }}>
              <Panel title="日別の収支" subtitle="報酬見込み、API費用、クリックの流れ">
                <DailyFinanceChart rows={analytics.dailyFinance.slice(-14)} />
              </Panel>
              <Panel title="次の改善アクション" subtitle="今の数字から優先度を出しています">
                <InsightList items={analytics.insights} />
              </Panel>
            </section>

            <section className="analytics-two-col" style={{ marginBottom: 18 }}>
              <Panel
                title="API費用"
                subtitle={`Anthropic ${formatUsd(analytics.apiCost.pricing.anthropicInputUsdPerMTok)}/${formatUsd(analytics.apiCost.pricing.anthropicOutputUsdPerMTok)} per 1M tokens・$1=${analytics.apiCost.pricing.usdJpyRate}円`}
              >
                {analytics.apiCost.warning && <WarningLine>{analytics.apiCost.warning}</WarningLine>}
                <ApiCostTable rows={analytics.apiCost.byProvider.slice(0, 8)} />
              </Panel>
              <Panel
                title="楽天報酬見込み"
                subtitle={`購入クリックの商品価格 × ${analytics.commerce.commissionRatePercent}%、1商品上限 ${formatYen(analytics.commerce.rewardCapJpy)}`}
              >
                <RewardTable rows={analytics.commerce.byCategory.slice(0, 8)} />
              </Panel>
            </section>

            <section className="analytics-two-col" style={{ marginBottom: 18 }}>
              <Panel title="カテゴリ別の反応" subtitle="購入とロック反応を優先して見る">
                <BucketTable rows={analytics.byCategory.slice(0, 10)} />
              </Panel>
              <Panel title="導線別のPRO意向" subtitle="どのCTAが押されているか">
                <BucketTable rows={analytics.bySource.slice(0, 10)} />
              </Panel>
            </section>

            <Panel title="商品別ランキング" subtitle="購入・ロック反応・閲覧を総合して並べています">
              {analytics.topProducts.length === 0 ? (
                <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだイベントがありません。</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {analytics.topProducts.map((product, index) => (
                    <div
                      key={product.productKey}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "34px minmax(180px, 1fr) repeat(5, minmax(64px, 86px))",
                        gap: 10,
                        alignItems: "center",
                        borderTop: index === 0 ? "none" : "1px solid #EDE5DC",
                        padding: "12px 0",
                      }}
                      className="analytics-product-row"
                    >
                      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, color: "#A8722A" }}>
                        {index + 1}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#150B00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#8A7A6E", marginTop: 3 }}>
                          {product.brand} / {product.category}
                        </div>
                      </div>
                      <MiniStat label="詳細" value={product.views} />
                      <MiniStat label="ロック" value={product.lockedClicks} />
                      <MiniStat label="購入" value={product.purchases} />
                      <MiniStat label="報酬" value={formatYen(product.estimatedRewardJpy)} />
                      <MiniStat label="購入率" value={`${product.purchaseRate}%`} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </main>
  );
}

function FinanceOverview({ analytics }: { analytics: AnalyticsResponse }) {
  const profitColor = analytics.profit.estimatedGrossProfitJpy >= 0 ? "#BFE5D0" : "#F2A69D";

  return (
    <section className="analytics-finance-grid" style={{ marginBottom: 18 }}>
      <FinanceCard
        label="楽天報酬見込み"
        value={formatYen(analytics.commerce.estimatedRewardJpy)}
        sub={`${analytics.commerce.purchaseClicks}クリック / 平均 ${formatYen(analytics.commerce.estimatedRewardPerClickJpy)}`}
      />
      <FinanceCard
        label="API費用"
        value={formatYen(analytics.apiCost.totalCostJpy)}
        sub={`${analytics.apiCost.totalRequests}リクエスト / ${formatUsd(analytics.apiCost.totalCostUsd)}`}
      />
      <FinanceCard
        label="収支見込み"
        value={formatYen(analytics.profit.estimatedGrossProfitJpy)}
        sub={analytics.profit.rewardToCostRatio ? `報酬 / 費用 ${analytics.profit.rewardToCostRatio}x` : "費用ゼロまたは未計測"}
        valueColor={profitColor}
      />
      <FinanceCard
        label="クリック売上"
        value={formatYen(analytics.commerce.purchaseValueJpy)}
        sub={`平均注文 ${formatYen(analytics.commerce.averageOrderValueJpy)}`}
      />
    </section>
  );
}

function FinanceCard({
  label,
  value,
  sub,
  valueColor = "#150B00",
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div style={{ background: "#1A0E08", border: "1px solid rgba(212,168,83,.35)", borderRadius: 14, padding: 18, boxShadow: "0 10px 28px rgba(21, 11, 0, .08)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", fontFamily: "ui-monospace, monospace", color: "#D4A853", marginBottom: 9 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, lineHeight: 1, color: valueColor === "#150B00" ? "#FBF8F3" : valueColor, fontWeight: 600 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "rgba(251,248,243,.62)", marginTop: 9, fontWeight: 800 }}>{sub}</div>
    </div>
  );
}

function DailyFinanceChart({ rows }: { rows: DailyFinance[] }) {
  const activeRows = rows.filter(
    (row) =>
      row.productViews > 0 ||
      row.purchaseClicks > 0 ||
      row.estimatedRewardJpy > 0 ||
      row.apiCostJpy > 0
  );
  const displayRows = activeRows.length > 0 ? activeRows : rows.slice(-7);
  const maxValue = Math.max(
    1,
    ...displayRows.map((row) =>
      Math.max(row.estimatedRewardJpy, row.apiCostJpy, Math.abs(row.grossProfitJpy), row.productViews)
    )
  );

  if (displayRows.length === 0) {
    return <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだ日別データがありません。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {displayRows.map((row) => {
        const rewardWidth = Math.max(4, Math.round((row.estimatedRewardJpy / maxValue) * 100));
        const costWidth = Math.max(4, Math.round((row.apiCostJpy / maxValue) * 100));
        const date = new Date(`${row.key}T00:00:00`);
        const dateLabel = date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

        return (
          <div key={row.key} className="analytics-trend-row" style={{ display: "grid", gridTemplateColumns: "54px minmax(0, 1fr) 116px", gap: 10, alignItems: "center" }}>
            <div style={{ color: "#8A7A6E", fontSize: 11, fontWeight: 800 }}>{dateLabel}</div>
            <div style={{ display: "grid", gap: 5 }}>
              <div style={{ height: 8, borderRadius: 999, background: "#F3EAE0", overflow: "hidden" }}>
                <div style={{ width: `${rewardWidth}%`, height: "100%", background: "#247A55", borderRadius: 999 }} />
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "#F3EAE0", overflow: "hidden" }}>
                <div style={{ width: `${costWidth}%`, height: "100%", background: "#B13A2E", borderRadius: 999 }} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: row.grossProfitJpy >= 0 ? "#247A55" : "#B13A2E" }}>
                {formatYen(row.grossProfitJpy)}
              </div>
              <div style={{ fontSize: 9, color: "#8A7A6E", marginTop: 2 }}>
                {row.productViews}詳細 / {row.purchaseClicks}購入
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 12, color: "#8A7A6E", fontSize: 10, fontWeight: 800, paddingTop: 4 }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "#247A55", marginRight: 5 }} />報酬</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "#B13A2E", marginRight: 5 }} />費用</span>
      </div>
    </div>
  );
}

function InsightList({ items }: { items: AnalyticsInsight[] }) {
  if (items.length === 0) {
    return <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだ改善提案を出せるデータがありません。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item) => {
        const tone = INSIGHT_TONES[item.tone];
        return (
          <div key={`${item.title}:${item.metric}`} style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
              <div style={{ color: tone.color, fontSize: 12, fontWeight: 900 }}>{item.title}</div>
              <div style={{ color: tone.color, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" }}>{item.metric}</div>
            </div>
            <div style={{ color: "#5E5146", fontSize: 12, lineHeight: 1.65 }}>{item.body}</div>
          </div>
        );
      })}
    </div>
  );
}

const INSIGHT_TONES: Record<AnalyticsInsight["tone"], { color: string; bg: string; border: string }> = {
  good: { color: "#247A55", bg: "#EAF7F0", border: "#BFE5D0" },
  warn: { color: "#986A13", bg: "#FFF5D8", border: "#E8CD83" },
  danger: { color: "#B13A2E", bg: "#FDE9E5", border: "#E7B8B0" },
};

function Notice({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 20, color: "#6B5B4A", fontSize: 13 }}>
      {children}
    </div>
  );
}

function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#FDE9E5", border: "1px solid #E7B8B0", borderRadius: 14, color: "#B13A2E", padding: 16, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
      {children}
    </div>
  );
}

function WarningLine({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#FFF5D8", border: "1px solid #E8CD83", borderRadius: 12, color: "#986A13", padding: 12, marginBottom: 10, fontSize: 12, lineHeight: 1.6, fontWeight: 700 }}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: 16, boxShadow: "0 8px 24px rgba(21, 11, 0, .04)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", fontFamily: "ui-monospace, monospace", color: "#8A7A6E", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, lineHeight: 1, color: "#150B00", fontWeight: 600 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#A8722A", marginTop: 8, fontWeight: 800 }}>{sub}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #EDE5DC", borderRadius: 14, padding: "18px 20px", boxShadow: "0 8px 24px rgba(21, 11, 0, .04)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, color: "#150B00", lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ marginTop: 5, color: "#8A7A6E", fontSize: 11 }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </section>
  );
}

function BucketTable({ rows }: { rows: EventBucket[] }) {
  if (rows.length === 0) {
    return <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだイベントがありません。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {rows.map((row) => (
        <div key={row.key} style={{ display: "grid", gridTemplateColumns: "minmax(110px,1fr) repeat(4,56px)", gap: 8, alignItems: "center", borderTop: "1px solid #EDE5DC", padding: "10px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#150B00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.key}</div>
          <MiniStat label="詳細" value={row.product_view} />
          <MiniStat label="ロック" value={row.locked_product_click} />
          <MiniStat label="購入" value={row.purchase_click} />
          <MiniStat label="PRO" value={row.upgrade_click} />
        </div>
      ))}
    </div>
  );
}

function ApiCostTable({ rows }: { rows: ApiUsageBucket[] }) {
  if (rows.length === 0) {
    return <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだAPI費用ログがありません。次回の成分解析や商品取得から記録されます。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {rows.map((row) => (
        <div key={row.key} className="analytics-money-row analytics-api-row" style={{ display: "grid", gridTemplateColumns: "minmax(110px,1fr) repeat(4,72px)", gap: 8, alignItems: "center", borderTop: "1px solid #EDE5DC", padding: "10px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#150B00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.key}</div>
          <MiniStat label="req" value={row.requests} />
          <MiniStat label="in" value={formatTokens(row.inputTokens)} />
          <MiniStat label="out" value={formatTokens(row.outputTokens)} />
          <MiniStat label="費用" value={formatYen(row.costJpy)} />
        </div>
      ))}
    </div>
  );
}

function RewardTable({ rows }: { rows: RewardCategory[] }) {
  if (rows.length === 0) {
    return <div style={{ color: "#8A7A6E", fontSize: 13, padding: "12px 0" }}>まだ購入クリックがありません。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>
      {rows.map((row) => (
        <div key={row.key} className="analytics-money-row analytics-reward-row" style={{ display: "grid", gridTemplateColumns: "minmax(110px,1fr) repeat(3,82px)", gap: 8, alignItems: "center", borderTop: "1px solid #EDE5DC", padding: "10px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#150B00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.key}</div>
          <MiniStat label="購入" value={row.purchaseClicks} />
          <MiniStat label="売上" value={formatYen(row.purchaseValueJpy)} />
          <MiniStat label="報酬" value={formatYen(row.estimatedRewardJpy)} />
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 13, color: "#150B00", fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 9, color: "#8A7A6E", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function formatYen(value: number) {
  const amount = Math.round(value);
  const sign = amount < 0 ? "-" : "";
  return `${sign}¥${Math.abs(amount).toLocaleString("ja-JP")}`;
}

function formatUsd(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return value.toLocaleString("ja-JP");
}
