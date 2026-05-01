import { NextRequest, NextResponse } from "next/server";
import { findRakutenProductImage } from "@/lib/rakuten";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim() ?? "";
  const brand = searchParams.get("brand")?.trim() ?? "";
  const sub = searchParams.get("sub")?.trim() ?? "";
  const id = parseInt(searchParams.get("id") ?? "0", 10);

  if (!name && !brand && !sub) {
    return NextResponse.json({ image: null });
  }

  try {
    const item = await findRakutenProductImage({
      id: Number.isFinite(id) ? id : 0,
      name,
      brand,
      sub,
    });

    return NextResponse.json(
      {
        image: item?.image ?? null,
        itemUrl: item?.url ?? null,
        source: item ? "rakuten" : null,
      },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rakuten image lookup failed.";
    return NextResponse.json({ image: null, error: message }, { status: 502 });
  }
}
