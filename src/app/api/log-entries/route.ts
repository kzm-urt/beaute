import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_RULES, resolveIsPro } from "@/lib/plan";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, productName, category, rating, memo, startedAt } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    if (!productName || !category || !rating) {
      return NextResponse.json({ error: "記録内容が不足しています" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    const isPro = resolveIsPro(profileData?.is_pro, user.email);

    if (!isPro) {
      const { count } = await supabase
        .from("log_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= PLAN_RULES.free.logLimit) {
        return NextResponse.json(
          {
            error: `無料プランの美容ログ上限（${PLAN_RULES.free.logLimit}件）に達しました。`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    const { data, error } = await supabase
      .from("log_entries")
      .insert({
        user_id: user.id,
        product_name: String(productName).slice(0, 120),
        category,
        rating: Math.min(5, Math.max(1, Number(rating))),
        memo: memo ? String(memo).slice(0, 1000) : "",
        started_at: startedAt ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ログ保存に失敗しました" }, { status: 500 });
  }
}
