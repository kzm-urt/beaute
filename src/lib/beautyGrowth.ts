import type { PersonalPreferences, Product, UserProfile } from "@/types";
import { getProfileSignals } from "@/lib/personalization";

interface BeautyGrowthInput {
  profile?: UserProfile | null;
  preferences?: PersonalPreferences | null;
  isPro?: boolean;
  analysisCount?: number;
  logCount?: number;
  savedCount?: number;
  productCount?: number;
  topProduct?: Product | null;
}

export interface BeautyMission {
  label: string;
  body: string;
  reward: number;
  tone: "profile" | "analyze" | "log" | "save" | "pro";
}

export interface BeautyGrowth {
  score: number;
  delta: number;
  level: number;
  levelName: string;
  xp: number;
  nextXp: number;
  progress: number;
  summary: string;
  reasons: string[];
  missions: BeautyMission[];
}

const LEVEL_NAMES = [
  "はじめの一歩",
  "毎日のつや",
  "整え上手",
  "習慣づくり",
  "つや設計中",
  "自分ケア上手",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function countValues(values?: string[]) {
  return values?.filter(Boolean).length ?? 0;
}

function hasValues(values?: string[]) {
  return countValues(values) > 0;
}

export function getLogGrowthXp(rating?: number | null) {
  const normalizedRating = Number.isFinite(Number(rating)) ? Number(rating) : 3;
  return 14 + clamp(normalizedRating, 1, 5) * 3;
}

export function getBeautyGrowth({
  profile,
  preferences,
  isPro = false,
  analysisCount = 0,
  logCount = preferences?.logCount ?? 0,
  savedCount = preferences?.savedCount ?? 0,
  productCount = 0,
  topProduct,
}: BeautyGrowthInput): BeautyGrowth {
  const signals = getProfileSignals(profile, preferences);
  const signalCount = signals.length;
  const confidence = preferences?.confidence ?? 0;
  const profileCompleteness = profile
    ? [
        profile.skinType,
        profile.hairType,
        profile.gender,
        profile.age,
        hasValues(profile.concerns),
        hasValues(profile.currentProducts),
        hasValues(profile.currentState),
        hasValues(profile.desiredIngredients),
        hasValues(profile.habits),
        hasValues(profile.goals),
      ].filter(Boolean).length
    : 0;

  const rawScore =
    42 +
    Math.min(18, profileCompleteness * 2.4) +
    Math.min(16, signalCount * 1.1) +
    Math.min(12, logCount * 2.5) +
    Math.min(10, analysisCount * 2.8) +
    Math.min(7, savedCount * 1.6) +
    Math.min(5, productCount * 0.7) +
    Math.min(8, confidence / 9) +
    (isPro ? 3 : 0);

  const score = Math.round(clamp(rawScore, 38, 98));
  const activityLift = Math.min(16, Math.round(logCount * 2.1 + analysisCount * 1.8 + savedCount * 1.2 + confidence / 18));
  const delta = activityLift > 0 ? Math.max(1, activityLift) : 0;
  const xp =
    signalCount * 12 +
    profileCompleteness * 18 +
    logCount * 24 +
    analysisCount * 36 +
    savedCount * 18 +
    productCount * 5 +
    confidence * 3 +
    (isPro ? 90 : 0);
  const level = clamp(Math.floor(xp / 140) + 1, 1, 30);
  const nextXp = level * 140;
  const progress = Math.round(((xp % 140) / 140) * 100);
  const levelName = LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor((level - 1) / 2))];

  const reasons = [
    profile?.currentState?.[0] ? `今の状態「${profile.currentState[0]}」を反映` : "",
    logCount > 0 ? `ログ${logCount}件を反映` : "",
    analysisCount > 0 ? `成分解析${analysisCount}件を反映` : "",
    savedCount > 0 ? `保存${savedCount}件から好みを確認` : "",
    confidence > 0 ? `記録の反映度${confidence}` : "",
    topProduct ? `${topProduct.cat}候補として比較できます` : "",
  ].filter(Boolean);

  const missions: BeautyMission[] = [
    !profile || !hasValues(profile.currentState)
      ? { label: "今の状態を登録", body: "今日の肌・髪の状態を1つ追加", reward: 28, tone: "profile" }
      : null,
    !profile || !hasValues(profile.currentProducts)
      ? { label: "使用中アイテムを登録", body: "置き換え判断の基準を作る", reward: 24, tone: "profile" }
      : null,
    analysisCount === 0
      ? { label: "成分を1つ分析", body: "合う理由と注意点を増やす", reward: 36, tone: "analyze" }
      : null,
    logCount === 0
      ? { label: "使用感を1件ログ", body: "次回比較の起点を作る", reward: 32, tone: "log" }
      : null,
    savedCount === 0
      ? { label: "候補を1つ保存", body: "比較リストを育てる", reward: 20, tone: "save" }
      : null,
    !isPro
      ? { label: "30日予測を解放", body: "伸びた要因を深く見る", reward: 50, tone: "pro" }
      : null,
  ].filter(Boolean) as BeautyMission[];

  const summary =
    score >= 86
      ? "記録がそろってきました。次は変化を見比べましょう。"
      : score >= 72
        ? "使ったものと状態がつながり始めています。"
        : score >= 58
          ? "カルテの材料が少しずつ揃っています。"
          : "まずは状態・分析・ログのどれか1つから。";

  return {
    score,
    delta,
    level,
    levelName,
    xp,
    nextXp,
    progress,
    summary,
    reasons: reasons.slice(0, 4),
    missions: missions.slice(0, 3),
  };
}

const CATEGORY_GROWTH: Record<Product["cat"], string[]> = {
  スキンケア: ["保湿", "透明感", "毛穴"],
  ヘアケア: ["ツヤ", "まとまり", "補修"],
  メイク: ["仕上がり", "印象", "崩れにくさ"],
  ボディ: ["うるおい", "なめらかさ", "香り"],
  UVケア: ["防御力", "日中ケア", "下地相性"],
  フレグランス: ["気分", "印象", "余韻"],
  ネイル: ["清潔感", "色持ち", "手元印象"],
  サプリ: ["内側ケア", "習慣", "コンディション"],
};

export function getProductGrowthStats(product: Product, profile?: UserProfile | null) {
  const text = [product.cat, product.sub, product.name, product.desc, ...product.tags].join(" ");
  const base = CATEGORY_GROWTH[product.cat] ?? ["美容習慣", "比較", "継続"];
  const concernBoost = profile?.concerns?.find((concern) => text.includes(concern));
  const ingredientBoost = profile?.desiredIngredients?.find((ingredient) => text.toLowerCase().includes(ingredient.toLowerCase()));
  const stats = [
    concernBoost ? `${concernBoost} +12` : `${base[0]} +10`,
    ingredientBoost ? `${ingredientBoost} +9` : `${base[1]} +8`,
    `${base[2]} +6`,
  ];
  return stats.filter((stat, index, values) => values.indexOf(stat) === index).slice(0, 3);
}
