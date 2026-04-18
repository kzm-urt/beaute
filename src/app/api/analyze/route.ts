import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-opus-4-5",
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

    const raw = message.content.find((b) => b.type === "text")?.text ?? "{}";
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
