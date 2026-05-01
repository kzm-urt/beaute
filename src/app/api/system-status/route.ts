import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getRakutenRanking, searchRakutenItems } from "@/lib/rakuten";
import { isAdminEmail } from "@/lib/plan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "pass" | "warn" | "fail";

interface StatusCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  action?: string;
}

interface StatusGroup {
  key: string;
  title: string;
  checks: StatusCheck[];
}

const TABLE_CHECKS = [
  {
    table: "profiles",
    label: "profiles / 課金カラム",
    select:
      "id,is_pro,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_current_period_end,stripe_cancel_at_period_end",
  },
  {
    table: "log_entries",
    label: "美容ログ",
    select: "id,user_id,product_name,category,rating,memo,started_at,created_at",
  },
  {
    table: "analyze_usage",
    label: "解析回数",
    select: "id,user_id,year_month,count",
  },
  {
    table: "analysis_entries",
    label: "解析履歴",
    select: "id,user_id,result,created_at",
  },
  {
    table: "product_saves",
    label: "お気に入り / 比較リスト",
    select: "id,user_id,product_key,product,favorite,compare,created_at,updated_at",
  },
  {
    table: "product_events",
    label: "商品イベント計測",
    select: "id,user_id,event_type,source_area,product_key,category,brand,product_name,is_pro,locked,metadata,created_at",
  },
  {
    table: "api_usage_events",
    label: "API費用ログ",
    select: "id,user_id,provider,endpoint,operation,model,request_count,input_tokens,output_tokens,cost_usd,cost_jpy,metadata,created_at",
  },
] as const;

function getAccessToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

function isPlaceholder(value: string) {
  return (
    value.startsWith("your_") ||
    value.startsWith("sk-ant-xxxxxxxx") ||
    value === "price_xxxxxxxxxxxxxxxxxxxxxxxx" ||
    value === "whsec_xxxxxxxxxxxxxxxxxxxxxxxx" ||
    value === "https://xxxxxxxx.supabase.co" ||
    value === "eyJxxxxxxxxxxxxxxxxxxxxxxxx"
  );
}

function hasConfiguredEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && value.trim() && !isPlaceholder(value.trim()));
}

function envCheck(name: string, label: string, action?: string): StatusCheck {
  return {
    key: `env:${name}`,
    label,
    status: hasConfiguredEnv(name) ? "pass" : "fail",
    detail: hasConfiguredEnv(name) ? "設定済み" : `${name} が未設定です`,
    action,
  };
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function statusWeight(status: CheckStatus) {
  if (status === "fail") return 2;
  if (status === "warn") return 1;
  return 0;
}

function overallStatus(groups: StatusGroup[]): CheckStatus {
  const worst = Math.max(
    0,
    ...groups.flatMap((group) => group.checks.map((check) => statusWeight(check.status)))
  );
  return worst === 2 ? "fail" : worst === 1 ? "warn" : "pass";
}

function summarize(groups: StatusGroup[]) {
  return groups.flatMap((group) => group.checks).reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>
  );
}

async function getAuthedAdmin(req: NextRequest) {
  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return {
      error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }),
      email: null,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return {
      error: NextResponse.json({ error: "Supabase認証設定が不足しています" }, { status: 503 }),
      email: null,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.getUser(accessToken);
  const user = data.user;
  if (error || !user) {
    return {
      error: NextResponse.json({ error: "認証エラー" }, { status: 401 }),
      email: null,
    };
  }

  if (!isAdminEmail(user.email)) {
    return {
      error: NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 }),
      email: user.email ?? null,
    };
  }

  return { error: null, email: user.email ?? null };
}

function buildEnvironmentGroup(req: NextRequest, adminEmail: string | null): StatusGroup {
  const checks: StatusCheck[] = [
    envCheck("ANTHROPIC_API_KEY", "成分解析 AI", "Anthropic APIキーを設定してください。"),
    envCheck("NEXT_PUBLIC_SUPABASE_URL", "Supabase URL"),
    envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key"),
    envCheck("SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key"),
    envCheck("STRIPE_SECRET_KEY", "Stripe secret key"),
    envCheck("STRIPE_PRO_PRICE_ID", "Stripe PRO Price ID"),
    envCheck("STRIPE_WEBHOOK_SECRET", "Stripe webhook secret"),
    envCheck("RAKUTEN_APPLICATION_ID", "楽天 application ID"),
    envCheck("RAKUTEN_ACCESS_KEY", "楽天 access key"),
    envCheck("NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID", "楽天 affiliate ID"),
  ];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    checks.push({
      key: "env:NEXT_PUBLIC_APP_URL",
      label: "アプリURL",
      status: "fail",
      detail: "NEXT_PUBLIC_APP_URL が未設定です",
      action: "Stripeの戻り先URLと実際の起動URLを合わせてください。",
    });
  } else {
    let appOrigin = appUrl;
    try {
      appOrigin = new URL(appUrl).origin;
    } catch {
      // Keep raw value for the detail below.
    }

    checks.push({
      key: "env:NEXT_PUBLIC_APP_URL",
      label: "アプリURL",
      status: appOrigin === req.nextUrl.origin ? "pass" : "warn",
      detail:
        appOrigin === req.nextUrl.origin
          ? `${appOrigin} で一致`
          : `設定: ${appOrigin} / 現在: ${req.nextUrl.origin}`,
      action:
        appOrigin === req.nextUrl.origin
          ? undefined
          : "Checkout後の戻り先がずれる可能性があります。ローカルは起動ポートと合わせてください。",
    });
  }

  checks.push({
    key: "env:NEXT_PUBLIC_ADMIN_EMAILS",
    label: "管理者メール",
    status: hasConfiguredEnv("NEXT_PUBLIC_ADMIN_EMAILS") && Boolean(adminEmail) ? "pass" : "warn",
    detail: adminEmail ? `${adminEmail} を管理者として認識` : "管理者メールが未確認です",
    action: "NEXT_PUBLIC_ADMIN_EMAILS に管理者メールをカンマ区切りで設定してください。",
  });

  checks.push({
    key: "env:RAKUTEN_REQUEST_ORIGIN",
    label: "楽天リクエストOrigin",
    status: hasConfiguredEnv("RAKUTEN_REQUEST_ORIGIN") ? "pass" : "warn",
    detail: hasConfiguredEnv("RAKUTEN_REQUEST_ORIGIN")
      ? "設定済み"
      : "未設定時は https://beaute.vercel.app を使用",
    action: "楽天アプリに登録した本番URLを RAKUTEN_REQUEST_ORIGIN に設定してください。",
  });

  return { key: "environment", title: "環境変数", checks };
}

async function checkSupabaseTables(): Promise<StatusGroup> {
  const checks: StatusCheck[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      key: "database",
      title: "Supabase",
      checks: [
        {
          key: "supabase:tables",
          label: "テーブル確認",
          status: "fail",
          detail: "Supabase URL または service role key が未設定です",
          action: "supabase/schema.sql を適用したうえで、環境変数を設定してください。",
        },
      ],
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  for (const tableCheck of TABLE_CHECKS) {
    checks.push(await checkTable(supabase, tableCheck.table, tableCheck.label, tableCheck.select));
  }

  return { key: "database", title: "Supabase", checks };
}

async function checkTable(
  supabase: SupabaseClient,
  table: string,
  label: string,
  select: string
): Promise<StatusCheck> {
  const { error } = await supabase.from(table).select(select, { count: "exact", head: true }).limit(1);

  if (error) {
    return {
      key: `supabase:${table}`,
      label,
      status: "fail",
      detail: error.message,
      action: "Supabase SQL Editorで supabase/schema.sql を再実行してください。",
    };
  }

  return {
    key: `supabase:${table}`,
    label,
    status: "pass",
    detail: "テーブル/カラム確認OK",
  };
}

async function checkStripe(): Promise<StatusGroup> {
  const checks: StatusCheck[] = [];
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!secretKey || !priceId || isPlaceholder(secretKey) || isPlaceholder(priceId)) {
    return {
      key: "stripe",
      title: "Stripe",
      checks: [
        {
          key: "stripe:price",
          label: "PRO価格",
          status: "fail",
          detail: "StripeのキーまたはPrice IDが未設定です",
          action: "Stripeで月額¥500のPriceを作り、STRIPE_PRO_PRICE_IDに設定してください。",
        },
      ],
    };
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" });
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount != null ? `¥${price.unit_amount.toLocaleString("ja-JP")}` : "金額未設定";
    const interval = price.recurring?.interval === "month" ? "月" : price.recurring?.interval ?? "単発";

    checks.push({
      key: "stripe:price",
      label: "PRO価格",
      status: price.active && price.recurring?.interval === "month" ? "pass" : "warn",
      detail: `${amount} / ${interval}・${price.active ? "有効" : "無効"}`,
      action:
        price.active && price.recurring?.interval === "month"
          ? undefined
          : "月額サブスクの有効なPrice IDを設定してください。",
    });
  } catch (error) {
    checks.push({
      key: "stripe:price",
      label: "PRO価格",
      status: "fail",
      detail: formatError(error),
      action: "STRIPE_SECRET_KEY と STRIPE_PRO_PRICE_ID の組み合わせを確認してください。",
    });
  }

  checks.push({
    key: "stripe:webhook",
    label: "Webhook secret",
    status: hasConfiguredEnv("STRIPE_WEBHOOK_SECRET") ? "pass" : "fail",
    detail: hasConfiguredEnv("STRIPE_WEBHOOK_SECRET") ? "設定済み" : "Webhook secretが未設定です",
    action: "Stripe Webhookの署名シークレットを STRIPE_WEBHOOK_SECRET に設定してください。",
  });

  return { key: "stripe", title: "Stripe", checks };
}

async function checkRakuten(): Promise<StatusGroup> {
  const checks: StatusCheck[] = [];

  if (!hasConfiguredEnv("RAKUTEN_APPLICATION_ID") || !hasConfiguredEnv("RAKUTEN_ACCESS_KEY")) {
    return {
      key: "rakuten",
      title: "Rakuten",
      checks: [
        {
          key: "rakuten:credentials",
          label: "楽天API認証",
          status: "fail",
          detail: "楽天APIキーが未設定です",
          action: "RAKUTEN_APPLICATION_ID と RAKUTEN_ACCESS_KEY を設定してください。",
        },
      ],
    };
  }

  try {
    const items = await searchRakutenItems({ keyword: "美容 コスメ", hits: 1 });
    checks.push({
      key: "rakuten:search",
      label: "商品検索",
      status: items.length > 0 ? "pass" : "warn",
      detail: `${items.length}件取得`,
      action: items.length > 0 ? undefined : "楽天検索APIのジャンル/キーワード/Origin設定を確認してください。",
    });
  } catch (error) {
    checks.push({
      key: "rakuten:search",
      label: "商品検索",
      status: "fail",
      detail: formatError(error),
      action: "楽天アプリ設定の許可URL、application ID、access keyを確認してください。",
    });
  }

  try {
    const rankingItems = await getRakutenRanking({ page: 1 });
    checks.push({
      key: "rakuten:ranking",
      label: "ランキング",
      status: rankingItems.length > 0 ? "pass" : "warn",
      detail: `${rankingItems.length}件取得`,
      action: rankingItems.length > 0 ? undefined : "ランキングAPIの利用権限またはジャンル設定を確認してください。",
    });
  } catch (error) {
    checks.push({
      key: "rakuten:ranking",
      label: "ランキング",
      status: "fail",
      detail: formatError(error),
      action: "楽天ランキングAPIのレスポンスとOrigin設定を確認してください。",
    });
  }

  return { key: "rakuten", title: "Rakuten", checks };
}

export async function GET(req: NextRequest) {
  const admin = await getAuthedAdmin(req);
  if (admin.error) return admin.error;

  const groups = [
    buildEnvironmentGroup(req, admin.email),
    await checkSupabaseTables(),
    await checkStripe(),
    await checkRakuten(),
  ];

  const nextActions = groups
    .flatMap((group) => group.checks)
    .filter((check) => check.status !== "pass" && check.action)
    .map((check) => ({
      label: check.label,
      status: check.status,
      action: check.action,
    }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    overallStatus: overallStatus(groups),
    summary: summarize(groups),
    groups,
    nextActions,
  });
}
