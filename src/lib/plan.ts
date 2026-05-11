import type { PlanType } from "@/types";

export const PLAN_RULES = {
  free: {
    label: "無料",
    priceLabel: "¥0",
    analyzeLimit: 1,
    analyzeUsageWindow: "week",
    analyzeUsageLabel: "週1回まで",
    logLimit: 10,
    savedAnalysisLimit: 3,
    favoriteLimit: 10,
    compareLimit: 3,
    personalChatDailyLimit: 3,
    searchDetailLimitPerPage: 12,
    rankingDetailLimit: 10,
    trialDays: 0,
    headline: "まずは美容ログと基本検索を試せます",
  },
  pro: {
    label: "PRO",
    priceLabel: "¥500",
    analyzeLimit: null,
    analyzeUsageWindow: "unlimited",
    analyzeUsageLabel: "回数制限なし",
    logLimit: null,
    savedAnalysisLimit: 50,
    favoriteLimit: null,
    compareLimit: 10,
    personalChatDailyLimit: 20,
    searchDetailLimitPerPage: null,
    rankingDetailLimit: null,
    trialDays: 7,
    headline: "解析、記録、商品詳細をまとめて使えます",
  },
} as const;

export const PLAN_FEATURE_MATRIX = [
  { label: "写真分析", free: "週1回まで", pro: "回数制限なし" },
  { label: "解析履歴", free: "直近3件", pro: "最大50件" },
  { label: "美容ログ", free: "10件まで", pro: "回数制限なし" },
  { label: "お気に入り保存", free: "10件まで", pro: "回数制限なし" },
  { label: "比較リスト", free: "3件まで", pro: "10件まで" },
  { label: "楽天商品詳細", free: "検索12件 / ランキングTOP10", pro: "全商品" },
  { label: "パーソナル相談", free: "1日3回", pro: "1日20回" },
  { label: "購入リンク", free: "無料対象のみ", pro: "全商品の楽天リンク" },
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
