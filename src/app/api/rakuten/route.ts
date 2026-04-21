import { NextRequest, NextResponse } from "next/server";

export interface RakutenProduct {
  name: string;
  brand: string;
  price: number;
  image: string;
  url: string;
  reviewCount: number;
  reviewAverage: number;
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  スキンケア: "スキンケア 化粧水 美容液",
  ヘアケア: "ヘアケア シャンプー ヘアオイル",
  メイク: "コスメ ファンデーション リップ",
  ボディ: "ボディクリーム ボディケア 保湿",
  UVケア: "日焼け止め UVケア SPF50",
  フレグランス: "香水 フレグランス レディース",
  ネイル: "ネイル マニキュア ジェルネイル",
  サプリ: "美容サプリ コラーゲン ビタミン",
};

export async function GET(req: NextRequest) {
  const productName = req.nextUrl.searchParams.get("name");
  const category = req.nextUrl.searchParams.get("category");
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!appId) return NextResponse.json({ error: "RAKUTEN_APP_ID not set" }, { status: 500 });

  const keyword = productName ?? (category ? CATEGORY_KEYWORDS[category] : "スキンケア おすすめ");
  // ブラウザのRefererを転送、なければVercelのURLを使用
  const referer = req.headers.get("referer") ?? "https://beaute-xi.vercel.app/";

  const url = new URL("https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401");
  url.searchParams.set("applicationId", appId);
  url.searchParams.set("accessKey", accessKey ?? "");
  url.searchParams.set("keyword", keyword ?? "スキンケア");
  url.searchParams.set("hits", "6");
  url.searchParams.set("sort", "-reviewCount");
  url.searchParams.set("imageFlag", "1");
  url.searchParams.set("formatVersion", "2");

  const res = await fetch(url.toString(), {
    headers: { "Referer": referer },
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  const items: RakutenProduct[] = (data.Items ?? []).map((item: {
    itemName: string;
    shopName: string;
    itemPrice: number;
    mediumImageUrls: { imageUrl: string }[];
    itemUrl: string;
    reviewCount: number;
    reviewAverage: number;
  }) => ({
    name: item.itemName.slice(0, 40),
    brand: item.shopName,
    price: item.itemPrice,
    image: item.mediumImageUrls?.[0]?.imageUrl ?? "",
    url: item.itemUrl,
    reviewCount: item.reviewCount,
    reviewAverage: item.reviewAverage,
  }));

  return NextResponse.json({ items }, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
