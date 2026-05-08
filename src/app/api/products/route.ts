import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "@/lib/constants";
import { logApiUsage } from "@/lib/apiUsage";
import { isFreeRakutenProduct } from "@/lib/plan";
import { getRakutenRanking, searchRakutenItems, type RakutenSearchItem } from "@/lib/rakuten";
import type { Category, Product } from "@/types";

export const runtime = "nodejs";

const CATEGORIES: Category[] = [
  "スキンケア",
  "ヘアケア",
  "メイク",
  "ボディ",
  "UVケア",
  "フレグランス",
  "ネイル",
  "サプリ",
];

const CATEGORY_HINTS: Record<Category, string[]> = {
  スキンケア: ["スキンケア", "化粧水", "美容液", "乳液", "クリーム", "洗顔", "クレンジング", "パック", "CICA"],
  ヘアケア: ["シャンプー", "トリートメント", "ヘア", "スカルプ", "頭皮", "カラー", "スタイリング"],
  メイク: ["ファンデ", "リップ", "口紅", "アイシャドウ", "チーク", "マスカラ", "アイライナー", "コンシーラー"],
  ボディ: ["ボディ", "ハンド", "入浴", "バス", "スクラブ", "除毛", "ローション"],
  UVケア: ["日焼け止め", "UV", "SPF", "PA++++", "サンスクリーン"],
  フレグランス: ["香水", "フレグランス", "オード", "ミスト", "ディフューザー"],
  ネイル: ["ネイル", "マニキュア", "ジェル", "キューティクル"],
  サプリ: ["サプリ", "ビタミン", "コラーゲン", "プロテイン", "鉄", "酵素"],
};

const SUB_HINTS: Array<[string, string[]]> = [
  ["日焼け止め", ["日焼け止め", "UV", "SPF"]],
  ["化粧水", ["化粧水", "ローション", "トナー"]],
  ["美容液", ["美容液", "セラム", "エッセンス"]],
  ["クリーム", ["クリーム", "バーム"]],
  ["洗顔", ["洗顔", "クレンザー"]],
  ["シャンプー", ["シャンプー"]],
  ["トリートメント", ["トリートメント", "コンディショナー", "マスク"]],
  ["ヘアオイル", ["ヘアオイル", "オイル"]],
  ["ファンデーション", ["ファンデ", "クッション"]],
  ["リップ", ["リップ", "口紅", "ティント"]],
  ["アイシャドウ", ["アイシャドウ", "パレット"]],
  ["ネイルカラー", ["ネイル", "マニキュア"]],
  ["香水", ["香水", "オード", "フレグランス"]],
  ["サプリ", ["サプリ", "ビタミン", "コラーゲン", "プロテイン"]],
  ["ボディケア", ["ボディ", "ハンド", "バス"]],
];

const CATEGORY_SUB_HINTS: Record<Category, Array<[string, string[]]>> = {
  スキンケア: [
    ["化粧水", ["化粧水", "ローション", "トナー"]],
    ["美容液", ["美容液", "セラム", "エッセンス"]],
    ["クリーム", ["クリーム", "バーム"]],
    ["洗顔", ["洗顔", "クレンザー", "クレンジング"]],
    ["パック", ["パック", "マスク"]],
  ],
  ヘアケア: [
    ["シャンプー", ["シャンプー"]],
    ["トリートメント", ["トリートメント", "コンディショナー", "マスク"]],
    ["ヘアオイル", ["ヘアオイル", "オイル"]],
    ["スカルプケア", ["スカルプ", "頭皮"]],
    ["ヘアカラー", ["カラー", "白髪染め"]],
  ],
  メイク: [
    ["ファンデーション", ["ファンデ", "クッション"]],
    ["リップ", ["リップ", "口紅", "ティント"]],
    ["アイシャドウ", ["アイシャドウ", "パレット"]],
    ["アイライナー", ["アイライナー", "ライナー"]],
    ["マスカラ", ["マスカラ"]],
  ],
  ボディ: [
    ["ボディクリーム", ["ボディ", "クリーム", "ローション"]],
    ["ハンドクリーム", ["ハンド"]],
    ["入浴剤", ["入浴", "バス"]],
    ["スクラブ", ["スクラブ"]],
  ],
  UVケア: [
    ["日焼け止め", ["日焼け止め", "UV", "SPF"]],
    ["UV下地", ["下地", "プライマー"]],
  ],
  フレグランス: [
    ["香水", ["香水", "オード", "パルファム"]],
    ["ボディミスト", ["ミスト"]],
    ["ルームフレグランス", ["ルーム", "ディフューザー"]],
  ],
  ネイル: [
    ["ネイルカラー", ["ネイル", "マニキュア", "カラー", "ジェル"]],
    ["ネイルケア", ["キューティクル", "リムーバー", "ケア"]],
  ],
  サプリ: [
    ["ビタミン", ["ビタミン"]],
    ["コラーゲン", ["コラーゲン"]],
    ["プロテイン", ["プロテイン"]],
    ["鉄分", ["鉄", "ヘム"]],
    ["美容サプリ", ["サプリ"]],
  ],
};

const CATEGORY_DEFAULT_SUB: Record<Category, string> = {
  スキンケア: "スキンケア",
  ヘアケア: "ヘアケア",
  メイク: "メイク",
  ボディ: "ボディケア",
  UVケア: "日焼け止め",
  フレグランス: "香水",
  ネイル: "ネイルカラー",
  サプリ: "美容サプリ",
};

function mapRow(r: Record<string, unknown>): Product {
  return {
    id: r.id as number,
    cat: r.cat as Product["cat"],
    sub: r.sub as string,
    name: r.name as string,
    brand: r.brand as string,
    price: r.price as number,
    rating: r.rating as number,
    rev: r.rev as number,
    free: r.free as boolean,
    desc: r.description as string,
    tags: r.tags as string[],
    image: r.image as string,
    url: r.url as string | undefined,
    source: "supabase",
    rank: r.rank as number | undefined,
    note: r.note as string | undefined,
    video: {
      title: r.video_title as string,
      views: r.video_views as string,
      url: r.video_url as string,
    },
  };
}

function hashToId(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function inferCategory(item: RakutenSearchItem, requested?: string): Category {
  if (requested && CATEGORIES.includes(requested as Category)) {
    return requested as Category;
  }

  const text = `${item.name} ${item.caption}`;
  return CATEGORIES.find((cat) => includesAny(text, CATEGORY_HINTS[cat])) ?? "スキンケア";
}

function inferSub(item: RakutenSearchItem, cat: Category) {
  const text = `${item.name} ${item.caption}`;
  return (
    CATEGORY_SUB_HINTS[cat].find(([, hints]) => includesAny(text, hints))?.[0] ??
    SUB_HINTS.find(([, hints]) => includesAny(text, hints))?.[0] ??
    CATEGORY_DEFAULT_SUB[cat]
  );
}

function buildTags(item: RakutenSearchItem, cat: Category, sub: string, selectedTags: string[]) {
  const tags = [sub, cat, ...selectedTags];
  if (item.reviewCount > 100) tags.push("レビュー多数");
  if (item.reviewAverage >= 4.5) tags.push("高評価");
  if (/送料無料/.test(item.name + item.caption)) tags.push("送料無料");
  return [...new Set(tags)].slice(0, 4);
}

function buildBuyingNote(item: RakutenSearchItem, cat: Category, sub: string) {
  const parts: string[] = [];

  if (item.rank) {
    parts.push(`楽天ランキング${item.rank}位の注目商品`);
  }

  if (item.reviewCount >= 1000 && item.reviewAverage >= 4.5) {
    parts.push(`レビュー${item.reviewCount.toLocaleString()}件・評価${item.reviewAverage.toFixed(2)}で、購入前の安心材料が多い`);
  } else if (item.reviewCount >= 100) {
    parts.push(`レビュー${item.reviewCount.toLocaleString()}件が集まっていて、使用感を比較しやすい`);
  } else if (item.reviewAverage >= 4.5) {
    parts.push(`評価${item.reviewAverage.toFixed(2)}と高めで、少数レビューでも満足度は良好`);
  }

  if (item.price > 0) {
    if (item.price <= 1500) {
      parts.push("まず試しやすい価格帯");
    } else if (item.price >= 5000) {
      parts.push("失敗したくない価格帯なのでレビュー確認向き");
    } else {
      parts.push("デイリー使いと特別感のバランスを取りやすい価格帯");
    }
  }

  const tagHint =
    cat === "スキンケア"
      ? `${sub}として、肌悩みに合うかを成分・使用感レビューで見たい一品`
      : cat === "メイク"
        ? `${sub}として、色味や崩れ方のレビューを見てから選びたい一品`
        : cat === "ヘアケア"
          ? `${sub}として、髪質との相性レビューを確認したい一品`
          : `${cat}カテゴリで候補に入れておきたい一品`;

  return [...parts, tagHint].slice(0, 3).join("。") + "。";
}

function toYoutubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function toProduct(
  item: RakutenSearchItem,
  index: number,
  options: { cat?: string; tags: string[] }
): Product {
  const cat = inferCategory(item, options.cat);
  const sub = inferSub(item, cat);
  const desc = stripHtml(item.caption).slice(0, 82) || item.name.slice(0, 82);
  const tags = buildTags(item, cat, sub, options.tags);

  return {
    id: hashToId(`${item.code}-${index}`),
    cat,
    sub,
    name: item.name,
    brand: item.brand || "楽天市場",
    price: item.price,
    rating: item.reviewAverage || 0,
    rev: item.reviewCount || 0,
    free: isFreeRakutenProduct(index, item.rank),
    desc,
    tags,
    image: item.image,
    url: item.url,
    source: "rakuten",
    rank: item.rank,
    note: buildBuyingNote(item, cat, sub),
    video: {
      title: `${item.name} レビュー`,
      views: item.reviewCount ? item.reviewCount.toLocaleString() : "0",
      url: toYoutubeSearchUrl(`${item.name} レビュー`),
    },
  };
}

function buildRakutenKeyword({
  cat,
  q,
  tags,
  free,
}: {
  cat: string;
  q: string;
  tags: string[];
  free: string | null;
}) {
  if (q) return q;
  if (tags.length > 0) return tags.join(" ");
  if (free === "true") return "美容 コスメ 人気";
  if (!cat) return "美容 コスメ スキンケア メイク";
  return "";
}

async function getRakutenProducts({
  cat,
  q,
  tags,
  free,
  limit,
  page,
}: {
  cat: string;
  q: string;
  tags: string[];
  free: string | null;
  limit: number;
  page: number;
}) {
  const keyword = buildRakutenKeyword({ cat, q, tags, free });
  const items = await searchRakutenItems({
    keyword,
    category: cat,
    hits: Math.min(Math.max(limit, 1), 30),
    page,
    sort: q || tags.length > 0 ? "standard" : "-reviewCount",
  });

  const products = items.map((item, index) => toProduct(item, index, { cat, tags }));
  return free === "true" ? products.filter((product) => product.free).slice(0, limit) : products;
}

async function getRakutenRankingProducts({
  cat,
  limit,
  page,
}: {
  cat: string;
  limit: number;
  page: number;
}) {
  const items = await getRakutenRanking({ category: cat, page });
  return items
    .map((item, index) => toProduct(item, index, { cat, tags: ["ランキング"] }))
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))
    .slice(0, limit);
}

function getLocalProducts({
  cat,
  q,
  tags,
  free,
  limit,
}: {
  cat: string;
  q: string;
  tags: string[];
  free: string | null;
  limit: number;
}) {
  let results = PRODUCTS.slice();
  if (cat) results = results.filter((p) => p.cat === cat);
  if (free === "true") results = results.filter((p) => p.free);
  if (q) {
    results = results.filter((p) =>
      p.name.includes(q) || p.brand.includes(q) || p.tags.some((t) => t.includes(q))
    );
  }
  if (tags.length > 0) {
    results = results.filter((p) => tags.some((t) => p.tags.includes(t)));
  }

  return results
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((p) => ({ ...p, source: "local" as const }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cat = searchParams.get("cat") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const free = searchParams.get("free");
  const mode = searchParams.get("mode") ?? "search";
  const limit = parseInt(searchParams.get("limit") ?? "30", 10);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const normalizedLimit = Number.isFinite(limit) ? limit : 30;
  const normalizedPage = Number.isFinite(page) ? page : 1;

  try {
    const products =
      mode === "ranking"
        ? await getRakutenRankingProducts({ cat, limit: normalizedLimit, page: normalizedPage })
        : await getRakutenProducts({
            cat,
            q,
            tags,
            free,
            limit: normalizedLimit,
            page: normalizedPage,
          });

    if (products.length > 0) {
      await logApiUsage({
        provider: "rakuten",
        endpoint: "/api/products",
        operation: mode === "ranking" ? "ichiba_ranking" : "ichiba_search",
        requestCount: 1,
        costUsd: 0,
        costJpy: 0,
        metadata: {
          mode,
          page: normalizedPage,
          category: cat || null,
          query: q ? "present" : "empty",
          tagCount: tags.length,
          returnedProducts: products.length,
        },
      });
      return NextResponse.json(
        { products, source: "rakuten", mode, page: normalizedPage, hasMore: products.length >= Math.min(Math.max(normalizedLimit, 1), 30) },
        { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } }
      );
    }

    return NextResponse.json({ products: [], source: "rakuten", mode, page: normalizedPage, hasMore: false });
  } catch {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        let query = supabase.from("products").select("*");

        if (cat) query = query.eq("cat", cat);
        if (free === "true") query = query.eq("free", true);
        if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
        if (tags.length > 0) query = query.overlaps("tags", tags);

        query = query.order("rating", { ascending: false }).limit(normalizedLimit);

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          return NextResponse.json(
            { products: data.map(mapRow), source: "supabase", mode, page: normalizedPage, hasMore: false },
            { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
          );
        }
      } catch {
        // Supabase接続失敗時はローカルデータへフォールバック
      }
    }

    return NextResponse.json({
      products: getLocalProducts({ cat, q, tags, free, limit: normalizedLimit }),
      source: "local",
      mode,
      page: normalizedPage,
      hasMore: false,
    });
  }
}
