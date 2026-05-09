import type { PlanType } from "@/types";

export const PLAN_RULES = {
  free: {
    label: "無料",
    priceLabel: "¥0",
    monthlyAnalyzeLimit: 3,
    logLimit: 10,
    savedAnalysisLimit: 3,
    favoriteLimit: 10,
    compareLimit: 3,
    searchDetailLimitPerPage: 12,
    rankingDetailLimit: 10,
    trialDays: 0,
    headline: "まずは美容ログと基本検索を試す",
  },
  pro: {
    label: "PRO",
    priceLabel: "¥500",
    monthlyAnalyzeLimit: null,
    logLimit: null,
    savedAnalysisLimit: 50,
    favoriteLimit: null,
    compareLimit: 10,
    searchDetailLimitPerPage: null,
    rankingDetailLimit: null,
    trialDays: 7,
    headline: "解析・記録・商品詳細をすべて解放",
  },
} as const;

export const PLAN_FEATURE_MATRIX = [
  { label: "成分解析", free: "月3回まで", pro: "無制限" },
  { label: "解析履歴", free: "直近3件", pro: "最大50件" },
  { label: "美容ログ", free: "10件まで", pro: "無制限" },
  { label: "お気に入り", free: "10件まで", pro: "無制限" },
  { label: "比較リスト", free: "3件まで", pro: "10件まで" },
  { label: "楽天商品詳細", free: "検索12件/ランキングTOP10", pro: "全商品" },
  { label: "パーソナル表示", free: "基本おすすめ", pro: "肌質・悩みを反映" },
  { label: "購入リンク", free: "無料対象のみ", pro: "全商品の楽天リンク" },
  { label: "カルテ相談", free: "PRO限定", pro: "カルテを見ながら質問OK" },
] as const;

export function getPlanType(isPro: boolean): PlanType {
  return isPro ? "pro" : "free";
}

export function getPlanRules(isPro: boolean) {
  return PLAN_RULES[getPlanType(isPro)];
}

export function getRemaining(current: number, limit: number | null): number | null {
  if (limit == null) return null;
  return Math.max(0, limit - current);
}

export function isWithinLimit(current: number, limit: number | null): boolean {
  return limit == null || current < limit;
}

export function formatPlanLimit(limit: number | null, unit = "件") {
  return limit == null ? "無制限" : `${limit}${unit}`;
}

export function isFreeRakutenProduct(index: number, rank?: number) {
  if (typeof rank === "number" && Number.isFinite(rank)) {
    return rank <= PLAN_RULES.free.rankingDetailLimit;
  }
  return index < PLAN_RULES.free.searchDetailLimitPerPage;
}

export function isAdminEmail(email?: string | null) {
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Boolean(email && adminEmails.includes(email));
}

export function resolveIsPro(dbIsPro: boolean | null | undefined, email?: string | null) {
  return Boolean(dbIsPro) || isAdminEmail(email);
}
