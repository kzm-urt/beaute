import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { PLAN_RULES, resolveIsPro } from "@/lib/plan";
import type { AnalysisEntry, AnalyzeResult } from "@/types";

export const dynamic = "force-dynamic";

interface AnalysisRow {
  id: string;
  user_id: string;
  result: AnalyzeResult;
  created_at: string;
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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();
    const isPro = resolveIsPro(profileData?.is_pro, user.email);
    const visibleLimit = isPro ? PLAN_RULES.pro.savedAnalysisLimit : PLAN_RULES.free.savedAnalysisLimit;

    const { data, count, error } = await supabase
      .from("analysis_entries")
      .select("id, user_id, result, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(visibleLimit);

    if (error) throw error;

    const entries = ((data ?? []) as AnalysisRow[]).map((entry): AnalysisEntry => ({
      id: entry.id,
      user_id: entry.user_id,
      result: entry.result,
      created_at: entry.created_at,
    }));

    return NextResponse.json({
      entries,
      total: count ?? entries.length,
      hiddenCount: Math.max(0, (count ?? entries.length) - entries.length),
      visibleLimit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "解析履歴を取得できませんでした" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, result } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    if (!result?.productType) {
      return NextResponse.json({ error: "解析結果が不足しています" }, { status: 400 });
    }

    const { supabase, user } = await getAuthedUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("analysis_entries")
      .insert({
        user_id: user.id,
        result,
      })
      .select("id, user_id, result, created_at")
      .single();

    if (error) throw error;

    const keepLimit = PLAN_RULES.pro.savedAnalysisLimit;
    const { data: staleRows } = await supabase
      .from("analysis_entries")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(keepLimit, keepLimit + 100);

    const staleIds = ((staleRows ?? []) as Array<{ id: string }>).map((row) => row.id);
    if (staleIds.length > 0) {
      await supabase.from("analysis_entries").delete().in("id", staleIds);
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "解析履歴を保存できませんでした" }, { status: 500 });
  }
}
