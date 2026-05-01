import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getProductKey } from "@/lib/utils";
import { PLAN_RULES, isWithinLimit, resolveIsPro } from "@/lib/plan";
import type { Product, ProductSave } from "@/types";

export const dynamic = "force-dynamic";

interface SaveRow {
  id: string;
  user_id: string;
  product_key: string;
  product: Product;
  favorite: boolean;
  compare: boolean;
  created_at: string;
  updated_at: string;
}

function getAccessToken(req: NextRequest) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

async function getAuthedUser(accessToken: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

function toSave(row: SaveRow): ProductSave {
  return {
    id: row.id,
    user_id: row.user_id,
    product_key: row.product_key,
    product: row.product,
    favorite: row.favorite,
    compare: row.compare,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const { supabase, user } = await getAuthedUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("product_saves")
      .select("id, user_id, product_key, product, favorite, compare, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const saves = ((data ?? []) as SaveRow[]).map(toSave);
    return NextResponse.json({
      saves,
      favoriteCount: saves.filter((save) => save.favorite).length,
      compareCount: saves.filter((save) => save.compare).length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "保存商品を取得できませんでした" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, product, favorite, compare } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    if (!product?.name) {
      return NextResponse.json({ error: "商品情報が不足しています" }, { status: 400 });
    }

    const { supabase, user } = await getAuthedUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();
    const isPro = resolveIsPro(profileData?.is_pro, user.email);
    const productKey = getProductKey(product as Product);

    const { data: existing } = await supabase
      .from("product_saves")
      .select("id, favorite, compare")
      .eq("user_id", user.id)
      .eq("product_key", productKey)
      .maybeSingle();

    const nextFavorite = typeof favorite === "boolean" ? favorite : Boolean(existing?.favorite);
    const nextCompare = typeof compare === "boolean" ? compare : Boolean(existing?.compare);

    if (nextFavorite && !existing?.favorite) {
      const { count } = await supabase
        .from("product_saves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("favorite", true);
      const limit = isPro ? PLAN_RULES.pro.favoriteLimit : PLAN_RULES.free.favoriteLimit;
      if (!isWithinLimit(count ?? 0, limit)) {
        return NextResponse.json(
          { error: `お気に入り上限（${limit}件）に達しました。`, limitReached: true },
          { status: 429 }
        );
      }
    }

    if (nextCompare && !existing?.compare) {
      const { count } = await supabase
        .from("product_saves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("compare", true);
      const limit = isPro ? PLAN_RULES.pro.compareLimit : PLAN_RULES.free.compareLimit;
      if (!isWithinLimit(count ?? 0, limit)) {
        return NextResponse.json(
          { error: `比較リスト上限（${limit}件）に達しました。`, limitReached: true },
          { status: 429 }
        );
      }
    }

    if (!nextFavorite && !nextCompare && existing?.id) {
      await supabase.from("product_saves").delete().eq("id", existing.id);
      return NextResponse.json({ save: null });
    }

    const { data, error } = await supabase
      .from("product_saves")
      .upsert(
        {
          id: existing?.id,
          user_id: user.id,
          product_key: productKey,
          product,
          favorite: nextFavorite,
          compare: nextCompare,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_key" }
      )
      .select("id, user_id, product_key, product, favorite, compare, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ save: toSave(data as SaveRow) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "商品を保存できませんでした" }, { status: 500 });
  }
}
