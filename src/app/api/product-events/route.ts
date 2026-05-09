import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getProductKey } from "@/lib/utils";
import { isAdminEmail, resolveIsPro } from "@/lib/plan";
import {
  estimateRakutenReward,
  getAnthropicPricing,
  getProductPrice,
  getRakutenCommissionConfig,
  getUsdJpyRate,
} from "@/lib/businessMetrics";
import type { Category, Product, ProductEventType } from "@/types";

export const dynamic = "force-dynamic";

const EVENT_TYPES: ProductEventType[] = [
  "product_view",
  "locked_product_click",
  "purchase_click",
  "upgrade_click",
];

interface ProductEventRow {
  id: string;
  user_id: string;
  event_type: ProductEventType;
  source_area: string | null;
  product_key: string | null;
  product: Product | null;
  category: Category | null;
  brand: string | null;
  product_name: string | null;
  is_pro: boolean | null;
  locked: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ApiUsageRow {
  id: string;
  user_id: string | null;
  provider: string | null;
  endpoint: string | null;
  operation: string | null;
  model: string | null;
  request_count: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | string | null;
  cost_jpy: number | string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ApiUsageBucket {
  key: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costJpy: number;
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

function getAccessToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

async function getAuthedUser(accessToken: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

function isProductEventType(value: unknown): value is ProductEventType {
  return typeof value === "string" && EVENT_TYPES.includes(value as ProductEventType);
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 4000) return { truncated: json.slice(0, 4000) };
  return JSON.parse(json) as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, eventType, sourceArea, product, productKey, isPro, metadata } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    if (!isProductEventType(eventType)) {
      return NextResponse.json({ error: "イベント種別が不正です" }, { status: 400 });
    }

    const { supabase, user } = await getAuthedUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const productSnapshot = product?.name ? (product as Product) : null;
    const resolvedProductKey = productSnapshot
      ? productKey || getProductKey(productSnapshot)
      : productKey || null;
    const locked = Boolean(productSnapshot && !productSnapshot.free && !isPro);

    const { error } = await supabase.from("product_events").insert({
      user_id: user.id,
      event_type: eventType,
      source_area: String(sourceArea || "unknown").slice(0, 80),
      product_key: resolvedProductKey,
      product: productSnapshot,
      category: productSnapshot?.cat ?? null,
      brand: productSnapshot?.brand?.slice(0, 120) ?? null,
      product_name: productSnapshot?.name?.slice(0, 180) ?? null,
      is_pro: Boolean(isPro),
      locked,
      metadata: sanitizeMetadata(metadata),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (isMissingProductEventsTable(error)) {
      return NextResponse.json(
        {
          error: "product_events テーブルがまだSupabaseに反映されていません。supabase/schema.sql の商品イベント計測セクションを実行してください。",
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "イベントを保存できませんでした" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { supabase, user } = await getAuthedUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });
    }

    const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("days") ?? "14", 10), 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("product_events")
      .select("id,user_id,event_type,source_area,product_key,product,category,brand,product_name,is_pro,locked,metadata,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw error;

    const rows = (data ?? []) as ProductEventRow[];
    const profileByUser = await buildProfileSummary(supabase, rows);
    const apiUsage = await getApiUsageRows(supabase, since);

    return NextResponse.json(buildAnalytics(rows, days, profileByUser, apiUsage.rows, apiUsage.warning));
  } catch (error) {
    console.error(error);
    if (isMissingProductEventsTable(error)) {
      return NextResponse.json(
        {
          error: "product_events テーブルがまだSupabaseに反映されていません。supabase/schema.sql の商品イベント計測セクションを実行してください。",
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "商品イベントを集計できませんでした" }, { status: 500 });
  }
}

async function getApiUsageRows(
  supabase: ReturnType<typeof createAdminClient>,
  since: string
) {
  const { data, error } = await supabase
    .from("api_usage_events")
    .select("id,user_id,provider,endpoint,operation,model,request_count,input_tokens,output_tokens,cost_usd,cost_jpy,metadata,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    if (isMissingApiUsageEventsTable(error)) {
      return {
        rows: [] as ApiUsageRow[],
        warning: "api_usage_events テーブルが未適用です。supabase/schema.sql を再実行するとAPI費用が保存されます。",
      };
    }
    throw error;
  }

  return { rows: (data ?? []) as ApiUsageRow[], warning: null };
}

async function buildProfileSummary(
  supabase: ReturnType<typeof createAdminClient>,
  rows: ProductEventRow[]
) {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  if (userIds.length === 0) return {};

  const { data } = await supabase
    .from("profiles")
    .select("id,is_pro")
    .in("id", userIds);

  return ((data ?? []) as Array<{ id: string; is_pro: boolean | null }>).reduce(
    (acc, row) => {
      acc[row.id] = { isPro: resolveIsPro(row.is_pro) };
      return acc;
    },
    {} as Record<string, { isPro: boolean }>
  );
}

function buildAnalytics(
  rows: ProductEventRow[],
  days: number,
  profileByUser: Record<string, { isPro: boolean }>,
  apiRows: ApiUsageRow[],
  apiUsageWarning: string | null
) {
  const counts = {
    totalEvents: rows.length,
    productViews: 0,
    lockedClicks: 0,
    purchaseClicks: 0,
    upgradeClicks: 0,
    freeUsers: 0,
    proUsers: 0,
  };
  const userIds = new Set<string>();
  const proUserIds = new Set<string>();
  const categoryMap = new Map<string, Record<ProductEventType, number>>();
  const productMap = new Map<string, {
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
  }>();
  const sourceMap = new Map<string, Record<ProductEventType, number>>();
  const dayMap = new Map<string, Record<ProductEventType, number>>();

  for (const row of rows) {
    if (row.user_id) {
      userIds.add(row.user_id);
      if (row.is_pro || profileByUser[row.user_id]?.isPro) proUserIds.add(row.user_id);
    }

    if (row.event_type === "product_view") counts.productViews++;
    if (row.event_type === "locked_product_click") counts.lockedClicks++;
    if (row.event_type === "purchase_click") counts.purchaseClicks++;
    if (row.event_type === "upgrade_click") counts.upgradeClicks++;

    incrementEventMap(categoryMap, row.category ?? "未分類", row.event_type);
    incrementEventMap(sourceMap, row.source_area ?? "unknown", row.event_type);
    incrementEventMap(dayMap, row.created_at.slice(0, 10), row.event_type);

    if (row.product_key || row.product_name) {
      const key = row.product_key ?? `${row.brand}:${row.product_name}`;
      const productPrice = getProductPrice(row.product);
      const current =
        productMap.get(key) ??
        {
          productKey: key,
          name: row.product_name ?? "商品名なし",
          brand: row.brand ?? "不明",
          category: row.category ?? "未分類",
          price: productPrice,
          views: 0,
          lockedClicks: 0,
          purchases: 0,
          upgradeClicks: 0,
          purchaseValueJpy: 0,
          estimatedRewardJpy: 0,
        };

      if (!current.price && productPrice > 0) current.price = productPrice;
      if (row.event_type === "product_view") current.views++;
      if (row.event_type === "locked_product_click") current.lockedClicks++;
      if (row.event_type === "purchase_click") {
        current.purchases++;
        current.purchaseValueJpy += productPrice;
        current.estimatedRewardJpy += estimateRakutenReward(productPrice);
      }
      if (row.event_type === "upgrade_click") current.upgradeClicks++;
      productMap.set(key, current);
    }
  }

  counts.proUsers = proUserIds.size;
  counts.freeUsers = userIds.size - proUserIds.size;

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.purchases * 10 + b.lockedClicks * 4 + b.views - (a.purchases * 10 + a.lockedClicks * 4 + a.views))
    .slice(0, 10)
    .map((item) => ({
      ...item,
      purchaseRate: rate(item.purchases, item.views),
      lockedInterestRate: rate(item.lockedClicks, item.views),
    }));
  const commerce = buildCommerceSummary(rows);
  const apiCost = buildApiCostSummary(apiRows, apiUsageWarning);
  const dailyFinance = buildDailyFinance(rows, apiRows, days);
  const insights = buildInsights({
    counts,
    rates: {
      purchaseRate: rate(counts.purchaseClicks, counts.productViews),
      lockedInterestRate: rate(counts.lockedClicks, counts.productViews),
      upgradeIntentRate: rate(counts.upgradeClicks, counts.lockedClicks + counts.productViews),
    },
    commerce,
    apiCost,
    topProducts,
  });

  return {
    days,
    generatedAt: new Date().toISOString(),
    counts,
    rates: {
      purchaseRate: rate(counts.purchaseClicks, counts.productViews),
      lockedInterestRate: rate(counts.lockedClicks, counts.productViews),
      upgradeIntentRate: rate(counts.upgradeClicks, counts.lockedClicks + counts.productViews),
    },
    byCategory: toEventArray(categoryMap).sort((a, b) => b.product_view + b.purchase_click - (a.product_view + a.purchase_click)),
    bySource: toEventArray(sourceMap).sort((a, b) => b.upgrade_click + b.locked_product_click - (a.upgrade_click + a.locked_product_click)),
    daily: toEventArray(dayMap).sort((a, b) => a.key.localeCompare(b.key)),
    topProducts,
    commerce,
    apiCost,
    dailyFinance,
    insights,
    profit: {
      estimatedGrossProfitJpy: commerce.estimatedRewardJpy - apiCost.totalCostJpy,
      rewardToCostRatio:
        apiCost.totalCostJpy > 0
          ? Math.round((commerce.estimatedRewardJpy / apiCost.totalCostJpy) * 10) / 10
          : null,
    },
  };
}

function buildDailyFinance(rows: ProductEventRow[], apiRows: ApiUsageRow[], days: number) {
  const map = new Map<string, DailyFinance>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    map.set(date, emptyDailyFinance(date));
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    const current = map.get(key) ?? emptyDailyFinance(key);
    if (row.event_type === "product_view") current.productViews++;
    if (row.event_type === "locked_product_click") current.lockedClicks++;
    if (row.event_type === "upgrade_click") current.upgradeClicks++;
    if (row.event_type === "purchase_click") {
      const price = getProductPrice(row.product);
      current.purchaseClicks++;
      current.purchaseValueJpy += price;
      current.estimatedRewardJpy += estimateRakutenReward(price);
    }
    current.grossProfitJpy = current.estimatedRewardJpy - current.apiCostJpy;
    map.set(key, current);
  }

  for (const row of apiRows) {
    const key = row.created_at.slice(0, 10);
    const current = map.get(key) ?? emptyDailyFinance(key);
    current.apiCostJpy += Math.round(toNumber(row.cost_jpy));
    current.grossProfitJpy = current.estimatedRewardJpy - current.apiCostJpy;
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function emptyDailyFinance(key: string): DailyFinance {
  return {
    key,
    productViews: 0,
    lockedClicks: 0,
    purchaseClicks: 0,
    upgradeClicks: 0,
    purchaseValueJpy: 0,
    estimatedRewardJpy: 0,
    apiCostJpy: 0,
    grossProfitJpy: 0,
  };
}

function buildInsights({
  counts,
  rates,
  commerce,
  apiCost,
  topProducts,
}: {
  counts: {
    productViews: number;
    lockedClicks: number;
    purchaseClicks: number;
    upgradeClicks: number;
  };
  rates: {
    purchaseRate: number;
    lockedInterestRate: number;
    upgradeIntentRate: number;
  };
  commerce: ReturnType<typeof buildCommerceSummary>;
  apiCost: ReturnType<typeof buildApiCostSummary>;
  topProducts: Array<{
    name: string;
    purchases: number;
    lockedClicks: number;
    views: number;
    estimatedRewardJpy: number;
  }>;
}) {
  const insights: AnalyticsInsight[] = [];

  if (counts.productViews === 0) {
    insights.push({
      tone: "warn",
      title: "まず計測イベントを増やす",
      body: "商品詳細、ロック商品、楽天購入、PRO導線を一通り触ると、この画面が改善判断に使える状態になります。",
      metric: "イベント待ち",
    });
    return insights;
  }

  if (rates.purchaseRate < 3) {
    insights.push({
      tone: "danger",
      title: "購入CTAの押下率を上げる",
      body: "詳細閲覧に対して楽天購入クリックが低めです。購入ボタン周辺に価格・レビュー件数・ランキングを近づける余地があります。",
      metric: `購入率 ${rates.purchaseRate}%`,
    });
  } else {
    insights.push({
      tone: "good",
      title: "購入導線は反応あり",
      body: "商品詳細から楽天購入へ進む動きが出ています。上位商品の露出を増やすと報酬見込みを伸ばしやすいです。",
      metric: `購入率 ${rates.purchaseRate}%`,
    });
  }

  if (rates.lockedInterestRate >= 12 && counts.upgradeClicks === 0) {
    insights.push({
      tone: "warn",
      title: "ロック反応をPRO CTAへつなぐ",
      body: "ロック商品への興味はありますが、PRO意向がまだ弱いです。ロック時の文言を「見たい理由」と「解除後の価値」に寄せるとよさそうです。",
      metric: `ロック ${rates.lockedInterestRate}%`,
    });
  }

  if (apiCost.totalCostJpy > commerce.estimatedRewardJpy && apiCost.totalCostJpy > 0) {
    insights.push({
      tone: "danger",
      title: "AI解析コストの回収設計を見る",
      body: "API費用が楽天報酬見込みを上回っています。無料解析の残数表示、PRO誘導、解析後の商品推薦を強めたい状態です。",
      metric: `費用 ${apiCost.totalCostJpy.toLocaleString("ja-JP")}円`,
    });
  }

  const winner = topProducts.find((product) => product.purchases > 0 || product.lockedClicks > 0);
  if (winner) {
    insights.push({
      tone: "good",
      title: "反応商品の露出を増やす",
      body: `${winner.name} に反応があります。検索上部、ランキング、パーソナル推薦に寄せると次のクリックを取りやすいです。`,
      metric: `${winner.purchases}購入 / ${winner.lockedClicks}ロック`,
    });
  }

  if (insights.length < 4) {
    insights.push({
      tone: "warn",
      title: "次は母数を増やす",
      body: "7日/14日で比較できるよう、検索・ランキング・商品詳細・購入クリックのテストデータをもう少し積むと判断しやすくなります。",
      metric: `${counts.productViews}詳細`,
    });
  }

  return insights.slice(0, 4);
}

function buildCommerceSummary(rows: ProductEventRow[]) {
  const config = getRakutenCommissionConfig();
  let purchaseValueJpy = 0;
  let estimatedRewardJpy = 0;
  let pricedPurchaseClicks = 0;
  const categoryMap = new Map<string, { purchaseClicks: number; purchaseValueJpy: number; estimatedRewardJpy: number }>();

  for (const row of rows) {
    if (row.event_type !== "purchase_click") continue;
    const price = getProductPrice(row.product);
    const reward = estimateRakutenReward(price);
    const key = row.category ?? "未分類";
    const current =
      categoryMap.get(key) ?? { purchaseClicks: 0, purchaseValueJpy: 0, estimatedRewardJpy: 0 };

    current.purchaseClicks++;
    current.purchaseValueJpy += price;
    current.estimatedRewardJpy += reward;
    categoryMap.set(key, current);

    if (price > 0) pricedPurchaseClicks++;
    purchaseValueJpy += price;
    estimatedRewardJpy += reward;
  }

  const purchaseClicks = rows.filter((row) => row.event_type === "purchase_click").length;

  return {
    purchaseClicks,
    pricedPurchaseClicks,
    purchaseValueJpy,
    estimatedRewardJpy,
    averageOrderValueJpy: purchaseClicks > 0 ? Math.round(purchaseValueJpy / purchaseClicks) : 0,
    estimatedRewardPerClickJpy: purchaseClicks > 0 ? Math.round(estimatedRewardJpy / purchaseClicks) : 0,
    commissionRatePercent: Math.round(config.rate * 1000) / 10,
    rewardCapJpy: config.capJpy,
    byCategory: [...categoryMap.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.estimatedRewardJpy - a.estimatedRewardJpy),
  };
}

function buildApiCostSummary(rows: ApiUsageRow[], warning: string | null) {
  const providerMap = new Map<string, ApiUsageBucket>();
  const operationMap = new Map<string, ApiUsageBucket>();
  const pricing = getAnthropicPricing();
  const summary = {
    totalRequests: 0,
    totalCostUsd: 0,
    totalCostJpy: 0,
    inputTokens: 0,
    outputTokens: 0,
    byProvider: [] as ApiUsageBucket[],
    byOperation: [] as ApiUsageBucket[],
    pricing: {
      usdJpyRate: getUsdJpyRate(),
      anthropicInputUsdPerMTok: pricing.inputUsdPerMTok,
      anthropicOutputUsdPerMTok: pricing.outputUsdPerMTok,
    },
    warning,
  };

  for (const row of rows) {
    const requests = Math.max(1, toNumber(row.request_count));
    const inputTokens = toNumber(row.input_tokens);
    const outputTokens = toNumber(row.output_tokens);
    const costUsd = toNumber(row.cost_usd);
    const costJpy = Math.round(toNumber(row.cost_jpy));

    summary.totalRequests += requests;
    summary.inputTokens += inputTokens;
    summary.outputTokens += outputTokens;
    summary.totalCostUsd += costUsd;
    summary.totalCostJpy += costJpy;

    incrementApiBucket(providerMap, row.provider ?? "unknown", requests, inputTokens, outputTokens, costUsd, costJpy);
    incrementApiBucket(
      operationMap,
      [row.provider ?? "unknown", row.operation ?? row.endpoint ?? "unknown"].join(" / "),
      requests,
      inputTokens,
      outputTokens,
      costUsd,
      costJpy
    );
  }

  summary.totalCostUsd = Math.round(summary.totalCostUsd * 1_000_000) / 1_000_000;
  summary.byProvider = toApiBucketArray(providerMap);
  summary.byOperation = toApiBucketArray(operationMap);

  return summary;
}

function incrementApiBucket(
  map: Map<string, ApiUsageBucket>,
  key: string,
  requests: number,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  costJpy: number
) {
  const current =
    map.get(key) ?? { key, requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, costJpy: 0 };

  current.requests += requests;
  current.inputTokens += inputTokens;
  current.outputTokens += outputTokens;
  current.costUsd += costUsd;
  current.costJpy += costJpy;
  map.set(key, current);
}

function toApiBucketArray(map: Map<string, ApiUsageBucket>) {
  return [...map.values()]
    .map((item) => ({ ...item, costUsd: Math.round(item.costUsd * 1_000_000) / 1_000_000 }))
    .sort((a, b) => b.costJpy + b.requests - (a.costJpy + a.requests));
}

function emptyCounts(): Record<ProductEventType, number> {
  return {
    product_view: 0,
    locked_product_click: 0,
    purchase_click: 0,
    upgrade_click: 0,
  };
}

function incrementEventMap(
  map: Map<string, Record<ProductEventType, number>>,
  key: string,
  eventType: ProductEventType
) {
  const current = map.get(key) ?? emptyCounts();
  current[eventType]++;
  map.set(key, current);
}

function toEventArray(map: Map<string, Record<ProductEventType, number>>) {
  return [...map.entries()].map(([key, value]) => ({ key, ...value }));
}

function rate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function isMissingProductEventsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST205" ||
    Boolean(maybeError.message?.includes("product_events"))
  );
}

function isMissingApiUsageEventsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST205" ||
    Boolean(maybeError.message?.includes("api_usage_events"))
  );
}
