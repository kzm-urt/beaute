export interface RakutenSearchItem {
  code: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  url: string;
  reviewCount: number;
  reviewAverage: number;
  shopName: string;
  caption: string;
  rank?: number;
}

interface RakutenApiItem {
  Item?: RakutenApiItem;
  itemName?: string;
  itemCode?: string;
  catchcopy?: string;
  itemPrice?: number | string;
  itemCaption?: string;
  itemUrl?: string;
  affiliateUrl?: string;
  mediumImageUrls?: Array<string | { imageUrl?: string }>;
  reviewCount?: number;
  reviewAverage?: number | string;
  shopName?: string;
  rank?: number | string;
}

interface RakutenApiResponse {
  Items?: RakutenApiItem[];
  items?: RakutenApiItem[];
  errors?: {
    errorCode?: number;
    errorMessage?: string;
  };
  error?: string;
  error_description?: string;
}

const RAKUTEN_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
const RAKUTEN_RANKING_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601";
const BEAUTY_GENRE_ID = "100939";
const DEFAULT_ORIGIN = "https://beaute.vercel.app";

export const RAKUTEN_BEAUTY_GENRES: Record<string, string> = {
  すべて: BEAUTY_GENRE_ID,
  スキンケア: "100944",
  ヘアケア: "100940",
  メイク: "204233",
  ボディ: "100960",
  UVケア: "216492",
  フレグランス: "111120",
  ネイル: "201454",
  サプリ: "100987",
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  スキンケア: "スキンケア",
  ヘアケア: "ヘアケア",
  メイク: "メイク コスメ",
  ボディ: "ボディケア",
  UVケア: "日焼け止め UV",
  フレグランス: "香水 フレグランス",
  ネイル: "ネイル",
  サプリ: "美容 サプリ",
};

let rakutenQueue = Promise.resolve();
let lastRakutenRequestAt = 0;

function getOrigin() {
  const configured =
    process.env.RAKUTEN_REQUEST_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    DEFAULT_ORIGIN;

  if (/localhost|127\.0\.0\.1/i.test(configured)) {
    return DEFAULT_ORIGIN;
  }

  try {
    const url = new URL(configured);
    return url.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

function requireCredentials() {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!applicationId || !accessKey) {
    throw new Error("Rakuten credentials are not configured.");
  }

  return { applicationId, accessKey };
}

function normalizeKeyword(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 128);
}

function buildKeyword({
  name,
  brand,
  sub,
  category,
  keyword,
}: {
  name?: string;
  brand?: string;
  sub?: string;
  category?: string;
  keyword?: string;
}) {
  const categoryKeyword = category ? CATEGORY_KEYWORDS[category] ?? category : "";
  return normalizeKeyword(
    [brand, name, keyword, sub, categoryKeyword, "コスメ"].filter(Boolean).join(" ")
  );
}

function getImageUrl(item: RakutenApiItem) {
  const raw = item.mediumImageUrls?.[0];
  const image = typeof raw === "string" ? raw : raw?.imageUrl;
  if (!image) return "";

  try {
    const url = new URL(image);
    const ex = url.searchParams.get("_ex");
    if (!ex || ex === "128x128") {
      url.searchParams.set("_ex", "512x512");
    }
    return url.toString();
  } catch {
    return image;
  }
}

function normalizeItem(raw: RakutenApiItem): RakutenSearchItem {
  const item = raw.Item ?? raw;
  const name = item.itemName ?? "";
  const price = Number(item.itemPrice ?? 0);
  const reviewAverage = Number(item.reviewAverage ?? 0);
  const rank = item.rank == null ? undefined : Number(item.rank);

  return {
    name,
    code: item.itemCode ?? name,
    brand: item.shopName ?? "",
    price: Number.isFinite(price) ? price : 0,
    image: getImageUrl(item),
    url: item.affiliateUrl || item.itemUrl || "https://www.rakuten.co.jp/",
    reviewCount: item.reviewCount ?? 0,
    reviewAverage: Number.isFinite(reviewAverage) ? reviewAverage : 0,
    shopName: item.shopName ?? "",
    caption: item.itemCaption || item.catchcopy || "",
    rank: Number.isFinite(rank) ? rank : undefined,
  };
}

async function throttleRakuten<T>(task: () => Promise<T>) {
  const run = rakutenQueue.then(async () => {
    const elapsed = Date.now() - lastRakutenRequestAt;
    const wait = Math.max(0, 1100 - elapsed);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRakutenRequestAt = Date.now();
    return task();
  });

  rakutenQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}

export async function searchRakutenItems({
  name,
  brand,
  sub,
  category,
  keyword,
  hits = 6,
  page = 1,
  sort = "-reviewCount",
}: {
  name?: string;
  brand?: string;
  sub?: string;
  category?: string;
  keyword?: string;
  hits?: number;
  page?: number;
  sort?: string;
}) {
  const { applicationId, accessKey } = requireCredentials();
  const searchKeyword = buildKeyword({ name, brand, sub, category, keyword });

  if (!searchKeyword) return [];

  const url = new URL(RAKUTEN_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
  url.searchParams.set("keyword", searchKeyword);
  url.searchParams.set("genreId", BEAUTY_GENRE_ID);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("hits", String(Math.min(Math.max(hits, 1), 30)));
  url.searchParams.set("page", String(Math.min(Math.max(page, 1), 100)));
  url.searchParams.set("imageFlag", "1");
  url.searchParams.set("availability", "1");
  url.searchParams.set("sort", sort);
  url.searchParams.set(
    "elements",
    [
      "itemName",
      "itemCode",
      "catchcopy",
      "itemPrice",
      "itemCaption",
      "itemUrl",
      "affiliateUrl",
      "mediumImageUrls",
      "reviewCount",
      "reviewAverage",
      "shopName",
    ].join(",")
  );

  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);

  return throttleRakuten(async () => {
    const res = await fetch(url.toString(), {
      headers: { Origin: getOrigin() },
      next: { revalidate: 3600 },
    });
    const data = (await res.json().catch(() => ({}))) as RakutenApiResponse;

    if (!res.ok) {
      const message =
        data.errors?.errorMessage ??
        data.error_description ??
        data.error ??
        `Rakuten API error: ${res.status}`;
      throw new Error(message);
    }

    const rawItems = data.Items ?? data.items ?? [];
    return rawItems.map(normalizeItem).filter((item) => item.name && item.image);
  });
}

export async function getRakutenRanking({
  category,
  page = 1,
  period = "realtime",
}: {
  category?: string;
  page?: number;
  period?: "realtime" | "";
}) {
  const { applicationId, accessKey } = requireCredentials();
  const genreId = RAKUTEN_BEAUTY_GENRES[category || ""] ?? BEAUTY_GENRE_ID;

  const url = new URL(RAKUTEN_RANKING_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
  url.searchParams.set("genreId", genreId);
  url.searchParams.set("page", String(Math.min(Math.max(page, 1), 34)));
  url.searchParams.set("format", "json");
  url.searchParams.set("formatVersion", "2");
  if (period) url.searchParams.set("period", period);

  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);

  return throttleRakuten(async () => {
    const res = await fetch(url.toString(), {
      headers: { Origin: getOrigin() },
      next: { revalidate: 900 },
    });
    const data = (await res.json().catch(() => ({}))) as RakutenApiResponse;

    if (!res.ok) {
      const message =
        data.errors?.errorMessage ??
        data.error_description ??
        data.error ??
        `Rakuten ranking API error: ${res.status}`;
      throw new Error(message);
    }

    const rawItems = data.Items ?? data.items ?? [];
    return rawItems.map(normalizeItem).filter((item) => item.name && item.image);
  });
}

export async function findRakutenProductImage({
  name,
  brand,
  sub,
}: {
  id: number;
  name: string;
  brand: string;
  sub?: string;
}) {
  const items = await searchRakutenItems({ name, brand, sub, hits: 6 });
  if (items.length === 0) return null;

  return items[0];
}
