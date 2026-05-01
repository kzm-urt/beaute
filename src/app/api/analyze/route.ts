import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_RULES, resolveIsPro } from "@/lib/plan";
import { logApiUsage } from "@/lib/apiUsage";
import { estimateAnthropicCost } from "@/lib/businessMetrics";

const client = new Anthropic();
const ANALYZE_MODEL = "claude-opus-4-5";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, accessToken } = await req.json();
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
        const yearMonth = new Date().toISOString().slice(0, 7); // "2025-04"

        const { data: usageData } = await supabase
          .from("analyze_usage")
          .select("count")
          .eq("user_id", user.id)
          .eq("year_month", yearMonth)
          .single();

        const currentCount = usageData?.count ?? 0;

        if (currentCount >= PLAN_RULES.free.monthlyAnalyzeLimit) {
          return NextResponse.json(
            { error: `無料プランの月間制限（${PLAN_RULES.free.monthlyAnalyzeLimit}回）に達しました。PROにアップグレードしてください。`, limitReached: true },
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
      system: `あなたはプロの美容成分アナリストです。画像から成分表を読み取り、以下のJSONのみ返してください（前後テキスト・コードブロック不要）:
{"productType":"推定製品種類","highlight":["注目成分（効果の説明）"],"caution":["注意成分（理由）"],"skinTypes":["相性の良い肌質"],"avoid":["注意が必要な肌質"],"overallScore":80,"verdict":"総評2文","keyIngredient":"最重要成分名"}`,
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
            { type: "text", text: "この製品の成分表を解析してください。" },
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
      operation: "ingredient_analysis",
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
