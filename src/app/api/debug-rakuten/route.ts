import { NextRequest, NextResponse } from "next/server";
import { searchRakutenItems } from "@/lib/rakuten";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "CICAクリーム";
  const brand = searchParams.get("brand") ?? "Dr.Jart+";
  const sub = searchParams.get("sub") ?? "クリーム";

  try {
    const items = await searchRakutenItems({ name, brand, sub, hits: 3 });

    return NextResponse.json({
      status: 200,
      keyword: [brand, name, sub].filter(Boolean).join(" "),
      count: items.length,
      first: items[0] ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rakuten API request failed.";
    return NextResponse.json({ status: 502, error: message }, { status: 502 });
  }
}
