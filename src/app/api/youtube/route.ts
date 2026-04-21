import { NextRequest, NextResponse } from "next/server";

export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  url: string;
  category: string;
}

const CATEGORY_QUERIES: Record<string, string> = {
  スキンケア: "スキンケア おすすめ 化粧水 美容液",
  ヘアケア: "ヘアケア おすすめ ヘアオイル シャンプー",
  メイク: "メイク おすすめ コスメ ベースメイク",
  ボディ: "ボディケア おすすめ 保湿 ボディクリーム",
  UVケア: "日焼け止め おすすめ UVケア SPF",
  フレグランス: "香水 フレグランス おすすめ レディース",
  ネイル: "ネイル おすすめ ジェルネイル セルフ",
  サプリ: "美容サプリ おすすめ コラーゲン ビタミン",
  全体: "美容 スキンケア おすすめ バズり コスメ",
};

function formatViews(count: string): string {
  const n = parseInt(count, 10);
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000) return `${Math.floor(n / 10_000)}万`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}千`;
  return count;
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "全体";
  const maxResults = req.nextUrl.searchParams.get("max") ?? "8";
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not set" }, { status: 500 });
  }

  const query = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES["全体"];

  // Step1: 動画IDを取得（再生数順）
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=${maxResults}&regionCode=JP&relevanceLanguage=ja&key=${apiKey}`
  );

  if (!searchRes.ok) {
    const err = await searchRes.text();
    return NextResponse.json({ error: err }, { status: searchRes.status });
  }

  const searchData = await searchRes.json();
  const items = searchData.items ?? [];
  if (items.length === 0) return NextResponse.json({ videos: [] });

  const videoIds = items.map((i: { id: { videoId: string } }) => i.id.videoId).join(",");

  // Step2: 実際の再生数を取得
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
  );
  const statsData = statsRes.ok ? await statsRes.json() : { items: [] };
  const statsMap: Record<string, string> = {};
  for (const v of statsData.items ?? []) {
    statsMap[v.id] = v.statistics?.viewCount ?? "0";
  }

  const videos: YoutubeVideo[] = items.map((item: {
    id: { videoId: string };
    snippet: { title: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
  }) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    views: formatViews(statsMap[item.id.videoId] ?? "0"),
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    category,
  }));

  return NextResponse.json({ videos }, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
