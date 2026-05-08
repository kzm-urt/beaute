import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type FeedbackRow = {
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
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type FeedbackRecord = Omit<FeedbackRow, "id" | "created_at">;

const feedbackRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

function getAccessToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

function getClientKey(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function checkRateLimit(req: NextRequest) {
  const key = getClientKey(req);
  const now = Date.now();
  const current = feedbackRateLimit.get(key);

  if (!current || current.resetAt <= now) {
    feedbackRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  feedbackRateLimit.set(key, { ...current, count: current.count + 1 });
  return true;
}

function text(value: unknown, max = 1000) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function option(value: unknown, allowed: string[], fallback: string | null = null) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function rating(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function textArray(value: unknown, maxItems = 8, maxLength = 60) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => text(item, maxLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function bool(value: unknown) {
  return value === true;
}

function isMissingFeedbackSchema(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  return (
    maybe.code === "42P01" ||
    maybe.code === "42703" ||
    Boolean(maybe.message?.includes("beta_feedback"))
  );
}

async function getAdmin(req: NextRequest) {
  const accessToken = getAccessToken(req);
  if (!accessToken) return { supabase: null, user: null, error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }) };

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const user = data.user;
  if (error || !user) return { supabase, user: null, error: NextResponse.json({ error: "認証エラー" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { supabase, user, error: NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 }) };
  return { supabase, user, error: null };
}

async function insertFeedbackFallback(
  supabase: ReturnType<typeof createAdminClient>,
  feedback: FeedbackRecord
) {
  const { data, error } = await supabase
    .from("api_usage_events")
    .insert({
      provider: "beautia",
      endpoint: "/api/feedback",
      operation: "beta_feedback",
      request_count: 1,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      cost_jpy: 0,
      metadata: { feedback },
    })
    .select("id,created_at")
    .single();

  if (error) throw error;
  return data;
}

async function getFallbackFeedbackRows(
  supabase: ReturnType<typeof createAdminClient>,
  since: string
): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from("api_usage_events")
    .select("id,metadata,created_at")
    .eq("operation", "beta_feedback")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const feedback = (metadata.feedback ?? {}) as Partial<FeedbackRecord>;
    return {
      id: row.id,
      tester_name: text(feedback.tester_name, 80),
      contact: text(feedback.contact, 140),
      relation: text(feedback.relation, 80),
      device: text(feedback.device, 80),
      overall_rating: rating(feedback.overall_rating),
      clarity_rating: rating(feedback.clarity_rating),
      recommendation_rating: rating(feedback.recommendation_rating),
      design_rating: rating(feedback.design_rating),
      paid_value_rating: rating(feedback.paid_value_rating),
      liked_features: textArray(feedback.liked_features),
      confusing_parts: textArray(feedback.confusing_parts),
      would_pay: text(feedback.would_pay, 80),
      expected_price: text(feedback.expected_price, 80),
      most_valuable: text(feedback.most_valuable, 1000),
      missing_feature: text(feedback.missing_feature, 1000),
      mobile_issue: text(feedback.mobile_issue, 1000),
      referral_idea: text(feedback.referral_idea, 1000),
      free_comment: text(feedback.free_comment, 1600),
      permission_to_quote: feedback.permission_to_quote === true,
      metadata: feedback.metadata ?? null,
      created_at: row.created_at,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(req)) {
      return NextResponse.json({ error: "短時間の送信が多すぎます。少し時間を置いてください。" }, { status: 429 });
    }

    const payload = await req.json();
    const overallRating = rating(payload.overallRating);
    const clarityRating = rating(payload.clarityRating);
    const recommendationRating = rating(payload.recommendationRating);
    const designRating = rating(payload.designRating);
    const paidValueRating = rating(payload.paidValueRating);

    if (!overallRating || !clarityRating || !recommendationRating || !designRating || !paidValueRating) {
      return NextResponse.json({ error: "5段階評価をすべて入力してください。" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const metadata = {
      referrer: text(payload.referrer, 400),
      path: text(payload.path, 200),
      userAgent: text(req.headers.get("user-agent"), 500),
      submittedAt: new Date().toISOString(),
    };

    const feedbackRecord: FeedbackRecord = {
      tester_name: text(payload.testerName, 80),
      contact: text(payload.contact, 140),
      relation: option(payload.relation, ["friend", "beauty", "creator", "business", "other"], "other"),
      device: option(payload.device, ["mobile", "desktop", "tablet", "unknown"], "unknown"),
      overall_rating: overallRating,
      clarity_rating: clarityRating,
      recommendation_rating: recommendationRating,
      design_rating: designRating,
      paid_value_rating: paidValueRating,
      liked_features: textArray(payload.likedFeatures),
      confusing_parts: textArray(payload.confusingParts),
      would_pay: option(payload.wouldPay, ["yes", "maybe", "no", "unknown"], "unknown"),
      expected_price: text(payload.expectedPrice, 80),
      most_valuable: text(payload.mostValuable, 1000),
      missing_feature: text(payload.missingFeature, 1000),
      mobile_issue: text(payload.mobileIssue, 1000),
      referral_idea: text(payload.referralIdea, 1000),
      free_comment: text(payload.freeComment, 1600),
      permission_to_quote: bool(payload.permissionToQuote),
      metadata,
    };

    const { data, error } = await supabase
      .from("beta_feedback")
      .insert(feedbackRecord)
      .select("id,created_at")
      .single();

    if (error) {
      if (isMissingFeedbackSchema(error)) {
        const fallback = await insertFeedbackFallback(supabase, feedbackRecord);
        return NextResponse.json({ ok: true, feedback: fallback, fallback: true });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, feedback: data });
  } catch (error) {
    console.error(error);
    if (isMissingFeedbackSchema(error)) {
      return NextResponse.json(
        {
          error: "アンケート保存テーブルが未設定です。Supabase SQL Editorで supabase/schema.sql を再実行してください。",
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "アンケートを保存できませんでした。" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdmin(req);
    if (admin.error) return admin.error;

    const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10), 1), 180);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin.supabase!
      .from("beta_feedback")
      .select(
        "id,tester_name,contact,relation,device,overall_rating,clarity_rating,recommendation_rating,design_rating,paid_value_rating,liked_features,confusing_parts,would_pay,expected_price,most_valuable,missing_feature,mobile_issue,referral_idea,free_comment,permission_to_quote,metadata,created_at"
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    const storage = error && isMissingFeedbackSchema(error) ? "api_usage_events" : "beta_feedback";
    if (error && !isMissingFeedbackSchema(error)) throw error;

    const rows = storage === "api_usage_events"
      ? await getFallbackFeedbackRows(admin.supabase!, since)
      : (data ?? []) as FeedbackRow[];
    return NextResponse.json({
      days,
      generatedAt: new Date().toISOString(),
      storage,
      summary: buildSummary(rows),
      responses: rows,
    });
  } catch (error) {
    console.error(error);
    if (isMissingFeedbackSchema(error)) {
      return NextResponse.json(
        {
          error: "beta_feedback テーブル/カラムが未設定です。Supabase SQL Editorで supabase/schema.sql を再実行してください。",
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "アンケート結果を取得できませんでした。" }, { status: 500 });
  }
}

function average(rows: FeedbackRow[], key: keyof Pick<FeedbackRow, "overall_rating" | "clarity_rating" | "recommendation_rating" | "design_rating" | "paid_value_rating">) {
  const values = rows.map((row) => row[key]).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function countBy(values: Array<string | null>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function topList(rows: FeedbackRow[], key: "liked_features" | "confusing_parts") {
  const counts = rows
    .flatMap((row) => row[key] ?? [])
    .reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
}

function buildSummary(rows: FeedbackRow[]) {
  return {
    total: rows.length,
    average: {
      overall: average(rows, "overall_rating"),
      clarity: average(rows, "clarity_rating"),
      recommendation: average(rows, "recommendation_rating"),
      design: average(rows, "design_rating"),
      paidValue: average(rows, "paid_value_rating"),
    },
    wouldPay: countBy(rows.map((row) => row.would_pay)),
    device: countBy(rows.map((row) => row.device)),
    likedFeatures: topList(rows, "liked_features"),
    confusingParts: topList(rows, "confusing_parts"),
  };
}
