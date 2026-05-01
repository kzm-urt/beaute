import { NextRequest, NextResponse } from "next/server";
import { searchRakutenItems, type RakutenSearchItem } from "@/lib/rakuten";

export interface RakutenProduct extends RakutenSearchItem {}

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const productName = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10);

  try {
    const items = await searchRakutenItems({
      keyword: productName,
      category,
      hits: Number.isFinite(limit) ? limit : 8,
    });

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rakuten API request failed.";
    return NextResponse.json({ items: [], error: message }, { status: 502 });
  }
}
