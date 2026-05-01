import { NextRequest, NextResponse } from "next/server";
import { CAT_META, ALL_TAGS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase";
import type { Category, PersonalPreferences, Product } from "@/types";

export const dynamic = "force-dynamic";

interface LogRow {
  product_name: string;
  category: Category;
  rating: number;
  memo: string | null;
}

interface SaveRow {
  product: Product;
  favorite: boolean;
  compare: boolean;
}

const CATEGORIES = Object.keys(CAT_META) as Category[];

function getAccessToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

function addWeight(map: Map<string, number>, key: string, value: number) {
  const normalized = key.trim();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + value);
}

function extractSignals(text: string) {
  const matchedTags = ALL_TAGS.filter((tag) => text.includes(tag));
  const matchedCategories = CATEGORIES.filter((cat) => text.includes(cat));
  return [...matchedTags, ...matchedCategories];
}

function topKeys<T extends string>(map: Map<T, number>, limit: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const [{ data: logData }, { data: saveData }] = await Promise.all([
      supabase
        .from("log_entries")
        .select("product_name, category, rating, memo")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("product_saves")
        .select("product, favorite, compare")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(80),
    ]);

    const logs = (logData ?? []) as LogRow[];
    const saves = (saveData ?? []) as SaveRow[];
    const positiveWeights = new Map<string, number>();
    const negativeWeights = new Map<string, number>();
    const categoryWeights = new Map<Category, number>();

    logs.forEach((entry) => {
      const rating = Number(entry.rating ?? 0);
      const weight = rating >= 4 ? rating - 3 : rating <= 2 ? -(3 - rating) : 0;
      if (weight === 0) return;

      if (weight > 0) addWeight(categoryWeights, entry.category, weight * 2);
      const text = `${entry.product_name} ${entry.memo ?? ""} ${entry.category}`;
      const signals = extractSignals(text);
      signals.forEach((signal) => {
        if (weight > 0) addWeight(positiveWeights, signal, weight);
        else addWeight(negativeWeights, signal, Math.abs(weight));
      });
      if (weight > 0) addWeight(positiveWeights, entry.category, weight);
      else addWeight(negativeWeights, entry.category, Math.abs(weight));
    });

    saves.forEach((save) => {
      const p = save.product;
      const weight = save.favorite && save.compare ? 3 : save.compare ? 2 : save.favorite ? 1.5 : 0;
      if (!weight) return;
      addWeight(categoryWeights, p.cat, weight);
      addWeight(positiveWeights, p.cat, weight);
      addWeight(positiveWeights, p.sub, weight);
      p.tags.slice(0, 5).forEach((tag) => addWeight(positiveWeights, tag, weight));
    });

    const topCategories = topKeys(categoryWeights, 3) as Category[];
    const positiveSignals = topKeys(positiveWeights, 8);
    const negativeSignals = topKeys(negativeWeights, 5);
    const confidence = Math.min(100, logs.length * 10 + saves.length * 8);
    const summary =
      positiveSignals.length > 0
        ? `${positiveSignals.slice(0, 3).join("・")}を好む傾向`
        : "ログや保存が増えるほどおすすめが育ちます";

    const preferences: PersonalPreferences = {
      positiveSignals,
      negativeSignals,
      topCategories,
      summary,
      logCount: logs.length,
      savedCount: saves.length,
      confidence,
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "好みデータを取得できませんでした" }, { status: 500 });
  }
}
