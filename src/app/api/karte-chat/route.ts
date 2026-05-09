import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_RULES, resolveIsPro } from "@/lib/plan";
import { logApiUsage } from "@/lib/apiUsage";
import { estimateAnthropicCost } from "@/lib/businessMetrics";
import type { AnalyzeResult, Product } from "@/types";

export const dynamic = "force-dynamic";

const client = new Anthropic();
const KARTE_CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-opus-4-5";

type ChatRole = "user" | "assistant";

interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

interface ProfileRow {
  nickname?: string | null;
  age?: string | null;
  gender?: string | null;
  skin_type?: string | null;
  hair_type?: string | null;
  concerns?: string[] | null;
  current_products?: string[] | null;
  current_state?: string[] | null;
  desired_ingredients?: string[] | null;
  beauty_habits?: string[] | null;
  beauty_goals?: string[] | null;
  skin_concerns?: string[] | null;
  hair_concerns?: string[] | null;
  other_concerns?: string[] | null;
  avoid_ingredients?: string[] | null;
  allergies?: string[] | null;
  skin_notes?: string[] | null;
  hair_notes?: string[] | null;
  other_notes?: string[] | null;
  is_pro?: boolean | null;
}

interface LogRow {
  product_name?: string | null;
  category?: string | null;
  rating?: number | null;
  memo?: string | null;
  started_at?: string | null;
  created_at?: string | null;
}

interface SaveRow {
  product?: Product | null;
  favorite?: boolean | null;
  compare?: boolean | null;
  updated_at?: string | null;
}

interface AnalysisRow {
  result?: AnalyzeResult | null;
  created_at?: string | null;
}

function getAccessToken(req: NextRequest, body: { accessToken?: unknown }) {
  const fromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return fromHeader || (typeof body.accessToken === "string" ? body.accessToken : "");
}

function compactList(items: string[] | null | undefined, fallback = "未設定") {
  const safeItems = (items ?? []).filter(Boolean).slice(0, 8);
  return safeItems.length > 0 ? safeItems.join("、") : fallback;
}

function trimText(value: unknown, max = 900) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: unknown }).role;
      const content = trimText((item as { content?: unknown }).content, 500);
      if ((role !== "user" && role !== "assistant") || !content) return null;
      return { role, content };
    })
    .filter((item): item is ChatHistoryItem => Boolean(item))
    .slice(-8);
}

function getJstDayStartIso() {
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const jstNow = new Date(Date.now() + jstOffsetMs);
  const jstDayStartUtc = Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate()
  ) - jstOffsetMs;
  return new Date(jstDayStartUtc).toISOString();
}

function buildKarteContext({
  userEmail,
  profile,
  logs,
  saves,
  analyses,
}: {
  userEmail?: string | null;
  profile: ProfileRow | null;
  logs: LogRow[];
  saves: SaveRow[];
  analyses: AnalysisRow[];
}) {
  const displayName = profile?.nickname || userEmail?.split("@")[0] || "ゲスト";
  const savedProducts = saves.slice(0, 8).map((save) => {
    const product = save.product;
    return {
      name: product?.name,
      brand: product?.brand,
      category: product?.cat,
      price: product?.price,
      tags: product?.tags?.slice(0, 6),
      favorite: Boolean(save.favorite),
      compare: Boolean(save.compare),
    };
  });

  return {
    date: new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" }),
    displayName,
    profile: {
      age: profile?.age || "未設定",
      gender: profile?.gender || "未設定",
      skinType: profile?.skin_type || "未設定",
      hairType: profile?.hair_type || "未設定",
      concerns: compactList(profile?.concerns),
      currentState: compactList(profile?.current_state),
      currentProducts: compactList(profile?.current_products),
      desiredIngredients: compactList(profile?.desired_ingredients),
      habits: compactList(profile?.beauty_habits),
      goals: compactList(profile?.beauty_goals),
      skinConcerns: compactList(profile?.skin_concerns),
      hairConcerns: compactList(profile?.hair_concerns),
      otherConcerns: compactList(profile?.other_concerns),
      avoidIngredients: compactList(profile?.avoid_ingredients),
      allergies: compactList(profile?.allergies),
      skinNotes: compactList(profile?.skin_notes),
      hairNotes: compactList(profile?.hair_notes),
      otherNotes: compactList(profile?.other_notes),
    },
    recentLogs: logs.slice(0, 8).map((log) => ({
      productName: log.product_name,
      category: log.category,
      rating: log.rating,
      memo: trimText(log.memo, 180),
      startedAt: log.started_at,
    })),
    savedProducts,
    recentAnalyses: analyses.slice(0, 5).map((entry) => ({
      date: entry.created_at,
      productType: entry.result?.productType,
      overallScore: entry.result?.overallScore,
      keyIngredient: entry.result?.keyIngredient,
      verdict: trimText(entry.result?.verdict, 220),
      caution: entry.result?.caution?.slice(0, 3),
      avoid: entry.result?.avoid?.slice(0, 3),
    })),
  };
}

function buildPrompt(context: ReturnType<typeof buildKarteContext>, history: ChatHistoryItem[], question: string) {
  return [
    "以下はユーザーのbeautiaパーソナルです。肌・髪・その他・注意メモを見ながら、今の相談に答えてください。",
    "",
    "パーソナル:",
    JSON.stringify(context, null, 2),
    "",
    history.length > 0
      ? `直近の会話:\n${history.map((item) => `${item.role === "user" ? "ユーザー" : "beautia"}: ${item.content}`).join("\n")}`
      : "直近の会話: なし",
    "",
    `今回の相談: ${question}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = trimText(body.question, 800);
    const history = normalizeHistory(body.history);
    const accessToken = getAccessToken(req, body);

    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }
    if (!question) {
      return NextResponse.json({ error: "相談内容を入れてください。" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "認証に失敗しました。" }, { status: 401 });
    }

    let profile: ProfileRow | null = null;
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("nickname, age, gender, skin_type, hair_type, concerns, current_products, current_state, desired_ingredients, beauty_habits, beauty_goals, skin_concerns, hair_concerns, other_concerns, avoid_ingredients, allergies, skin_notes, hair_notes, other_notes, is_pro")
      .eq("id", user.id)
      .maybeSingle();
    profile = (profileData ?? null) as ProfileRow | null;
    if (profileError || !profile) {
      const { data: fallbackProfileData } = await supabase
        .from("profiles")
        .select("nickname, age, gender, skin_type, hair_type, concerns, current_products, current_state, desired_ingredients, beauty_habits, beauty_goals, is_pro")
        .eq("id", user.id)
        .maybeSingle();
      profile = (fallbackProfileData ?? null) as ProfileRow | null;
    }
    const isPro = resolveIsPro(profile?.is_pro, user.email);
    const dailyLimit = isPro ? PLAN_RULES.pro.personalChatDailyLimit : PLAN_RULES.free.personalChatDailyLimit;

    const { count: usedToday, error: usageError } = await supabase
      .from("api_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("operation", "personal_chat")
      .gte("created_at", getJstDayStartIso());

    if (!usageError && (usedToday ?? 0) >= dailyLimit) {
      return NextResponse.json(
        {
          error: isPro
            ? "今日は20回使いました。また明日聞きましょう。"
            : "無料の相談は今日は3回までです。続きはPROで聞けます。",
          dailyLimit,
          remaining: 0,
          isPro,
          upgradeRecommended: !isPro,
        },
        { status: 429 }
      );
    }

    const [{ data: logData }, { data: saveData }, { data: analysisData }] = await Promise.all([
      supabase
        .from("log_entries")
        .select("product_name, category, rating, memo, started_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("product_saves")
        .select("product, favorite, compare, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(24),
      supabase
        .from("analysis_entries")
        .select("result, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const context = buildKarteContext({
      userEmail: user.email,
      profile,
      logs: (logData ?? []) as LogRow[],
      saves: (saveData ?? []) as SaveRow[],
      analyses: (analysisData ?? []) as AnalysisRow[],
    });

    const message = await client.messages.create({
      model: KARTE_CHAT_MODEL,
      max_tokens: 850,
      temperature: 0.75,
      system: [
        "あなたはbeautiaのパーソナルアドバイザーです。",
        "美容好きの相棒として、少しくだけた丁寧語で話してください。",
        "回答は短めに。長くても4段落まで。必要な時だけ箇条書きにしてください。",
        "パーソナル、保存商品、ログ、成分解析履歴に基づいて、今日の選び方、使い方、比較の見方を一緒に整理してください。",
        isPro ? "ユーザーはPROです。少し深めに、でも長すぎず答えてください。" : "ユーザーは無料プランです。短く役立つ範囲で答え、必要なときだけPROならさらに深く見られると自然に伝えてください。",
        "医療診断、治療、疾患の断定はしないでください。強い赤み、痛み、腫れ、長引く肌荒れがある場合は皮膚科相談をすすめてください。",
        "避ける表現: 最適化、反映、提案、判断軸、今日の一手、AI。",
        "使ってよい表現: 今日はこれでよさそう、まずこれだけでOK、ちょっと乾きそう、あとで比べやすくなります。",
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: buildPrompt(context, history, question),
        },
      ],
    });

    const reply = message.content.find((block) => block.type === "text")?.text?.trim();
    if (!reply) {
      return NextResponse.json({ error: "うまく返事を作れませんでした。" }, { status: 502 });
    }

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    const cost = estimateAnthropicCost({ inputTokens, outputTokens });
    await logApiUsage({
      userId: user.id,
      provider: "anthropic",
      endpoint: "/api/karte-chat",
      operation: "personal_chat",
      model: KARTE_CHAT_MODEL,
      inputTokens,
      outputTokens,
      costUsd: cost.costUsd,
      costJpy: cost.costJpy,
      metadata: {
        historyCount: history.length,
        savedProductCount: context.savedProducts.length,
        recentLogCount: context.recentLogs.length,
        recentAnalysisCount: context.recentAnalyses.length,
        inputUsdPerMTok: cost.inputUsdPerMTok,
        outputUsdPerMTok: cost.outputUsdPerMTok,
        usdJpyRate: cost.usdJpyRate,
      },
    });

    const remaining = Math.max(0, dailyLimit - (usedToday ?? 0) - 1);
    return NextResponse.json({ reply, dailyLimit, remaining, isPro });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "パーソナル相談の返事を作れませんでした。" }, { status: 500 });
  }
}
