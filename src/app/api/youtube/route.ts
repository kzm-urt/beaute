import { NextRequest, NextResponse } from "next/server";
import { logApiUsage } from "@/lib/apiUsage";

export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  url: string;
  category: string;
  channelTitle: string;
}

const CATEGORY_QUERIES: Record<string, string> = {
  スキンケア: "スキンケア おすすめ 化粧水 美容液 美容系YouTuber レビュー 使い方",
  ヘアケア: "ヘアケア おすすめ ヘアオイル シャンプー 美容師 レビュー 使い方",
  メイク: "メイク おすすめ コスメ ベースメイク 美容系YouTuber レビュー",
  ボディ: "ボディケア おすすめ 保湿 ボディクリーム レビュー 使い方",
  UVケア: "日焼け止め おすすめ UVケア SPF 比較 レビュー",
  フレグランス: "香水 フレグランス おすすめ レビュー 付け方",
  ネイル: "ネイル おすすめ ジェルネイル セルフ やり方",
  サプリ: "美容サプリ おすすめ コラーゲン ビタミン 管理栄養士 解説",
  全体: "美容 スキンケア おすすめ バズり コスメ 美容系YouTuber",
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
  const customQuery = req.nextUrl.searchParams.get("query")?.trim();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not set" }, { status: 500 });
  }

  const query = customQuery
    ? `${customQuery.slice(0, 120)} 美容系YouTuber レビュー 使い方`
    : CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES["全体"];

  // Step1: 動画IDを取得（再生数順）
  const fetchSearch = (searchQuery: string) =>
    fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&order=viewCount&maxResults=${maxResults}&regionCode=JP&relevanceLanguage=ja&key=${apiKey}`
    );

  let requestCount = 1;
  let searchRes = await fetchSearch(query);

  if (!searchRes.ok) {
    const err = await searchRes.text();
    return NextResponse.json({ error: err }, { status: searchRes.status });
  }

  let searchData = await searchRes.json();
  let items = searchData.items ?? [];
  if (items.length === 0 && customQuery) {
    requestCount += 1;
    searchRes = await fetchSearch(CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES["全体"]);
    if (searchRes.ok) {
      searchData = await searchRes.json();
      items = searchData.items ?? [];
    }
  }
  if (items.length === 0) return NextResponse.json({ videos: [] });

  const videoIds = items.map((i: { id: { videoId: string } }) => i.id.videoId).join(",");

  // Step2: 実際の再生数を取得
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
  );
  requestCount += 1;
  const statsData = statsRes.ok ? await statsRes.json() : { items: [] };
  const statsMap: Record<string, string> = {};
  for (const v of statsData.items ?? []) {
    statsMap[v.id] = v.statistics?.viewCount ?? "0";
  }

  const videos: YoutubeVideo[] = items.map((item: {
    id: { videoId: string };
    snippet: { title: string; channelTitle?: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
  }) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    views: formatViews(statsMap[item.id.videoId] ?? "0"),
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    category,
    channelTitle: item.snippet.channelTitle ?? "YouTube",
  }));

  await logApiUsage({
    provider: "youtube",
    endpoint: "/api/youtube",
    operation: "video_search_with_statistics",
    requestCount,
    costUsd: 0,
    costJpy: 0,
    metadata: {
      category,
      customQuery: Boolean(customQuery),
      maxResults,
      returnedVideos: videos.length,
      quotaUnitsEstimate: 101,
    },
  });

  return NextResponse.json({ videos }, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
