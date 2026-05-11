import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_RULES, resolveIsPro } from "@/lib/plan";
import { logApiUsage } from "@/lib/apiUsage";
import { estimateAnthropicCost } from "@/lib/businessMetrics";

const client = new Anthropic();
const ANALYZE_MODEL = "claude-opus-4-5";
type AnalyzeMode = "ingredient" | "face";

function getUsagePeriodKey() {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - startOfYear.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + startOfYear.getUTCDay()) / 7);
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getAnalyzePrompt(mode: AnalyzeMode) {
  if (mode === "face") {
    return {
      operation: "face_makeup_analysis",
      system: `あなたは美容メイクの写真分析アドバイザーです。顔写真から、顔立ちの見え方、黄金比に近いバランス、似合うメイク方向、SNSで共有しやすい軽いネタ分類を整理してください。
注意: 医療診断、本人識別、年齢・人種・民族などセンシティブ属性の推測はしないでください。断定ではなく、写真の角度・光・表情による見え方として表現してください。
以下のJSONのみ返してください（前後テキスト・コードブロック不要）:
{"mode":"face","productType":"顔・メイク写真分析","highlight":["顔立ちの魅力や活かし方"],"caution":["写真の角度やメイクで調整すると良い点"],"skinTypes":["似合いやすいメイクトーン"],"avoid":["避けるとよいメイク"],"overallScore":80,"verdict":"総評2文","keyIngredient":"推しメイク軸","faceGoldenRatio":{"score":78,"summary":"黄金比バランスの見え方を1文","points":["目元と眉の距離","中顔面の見え方"]},"makeupAdvice":["具体的なメイク提案"],"shareTitle":"SNSカード用タイトル","shareText":"SNSで共有しやすい短文","memeType":"建国顔 / 主人公顔 / 透明感顔 など軽いネタ分類"}`,
      userText: "この顔写真を美容・メイク観点で分析してください。",
    };
  }

  return {
    operation: "ingredient_analysis",
    system: `あなたはプロの美容成分アナリストです。画像から成分表を読み取り、以下のJSONのみ返してください（前後テキスト・コードブロック不要）:
{"mode":"ingredient","productType":"推定製品種類","highlight":["注目成分（効果の説明）"],"caution":["注意成分（理由）"],"skinTypes":["相性の良い肌質"],"avoid":["注意が必要な肌質"],"overallScore":80,"verdict":"総評2文","keyIngredient":"最重要成分名","shareTitle":"SNSカード用タイトル","shareText":"SNSで共有しやすい短文"}`,
    userText: "この製品の成分表を解析してください。",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, accessToken, mode: requestedMode } = await req.json();
    const mode: AnalyzeMode = requestedMode === "face" ? "face" : "ingredient";
    const prompt = getAnalyzePrompt(mode);
    let userId: string | null = null;
    if (!imageBase64) {
      return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
    }

    // JWTトークンが提供された場合、使用回数制限をチェック
    if (accessToken) {
      const supabase = createAdminClient();

      // トークンからユーザー情報を取得
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return NextResponse.json({ error: "認証エラー" }, { status: 401 });
      }
      userId = user.id;

      // PROユーザーかどうか確認
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      const isPro = resolveIsPro(profileData?.is_pro, user.email);

      if (!isPro) {
        // フリープランの場合、今月の使用回数を確認
        const yearMonth = getUsagePeriodKey();

        const { data: usageData } = await supabase
          .from("analyze_usage")
          .select("count")
          .eq("user_id", user.id)
          .eq("year_month", yearMonth)
          .single();

        const currentCount = usageData?.count ?? 0;

        if (currentCount >= PLAN_RULES.free.analyzeLimit) {
          return NextResponse.json(
            { error: `無料プランの利用制限（${PLAN_RULES.free.analyzeUsageLabel}）に達しました。PROにアップグレードしてください。`, limitReached: true },
            { status: 429 }
          );
        }

        // 使用回数をインクリメント（upsert）
        await supabase.from("analyze_usage").upsert(
          { user_id: user.id, year_month: yearMonth, count: currentCount + 1 },
          { onConflict: "user_id,year_month" }
        );
      }
    }

    const message = await client.messages.create({
      model: ANALYZE_MODEL,
      max_tokens: 1024,
      system: prompt.system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt.userText },
          ],
        },
      ],
    });

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    const cost = estimateAnthropicCost({ inputTokens, outputTokens });
    await logApiUsage({
      userId,
      provider: "anthropic",
      endpoint: "/api/analyze",
      operation: prompt.operation,
      model: ANALYZE_MODEL,
      inputTokens,
      outputTokens,
      costUsd: cost.costUsd,
      costJpy: cost.costJpy,
      metadata: {
        inputUsdPerMTok: cost.inputUsdPerMTok,
        outputUsdPerMTok: cost.outputUsdPerMTok,
        usdJpyRate: cost.usdJpyRate,
        imageBytes: Math.round((imageBase64.length * 3) / 4),
      },
    });

    const raw = message.content.find((b) => b.type === "text")?.text ?? "{}";
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
