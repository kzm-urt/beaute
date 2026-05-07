import type { PersonalPreferences, Product, UserProfile } from "@/types";

const SIGNAL_ALIASES: Record<string, string[]> = {
  乾燥肌: ["乾燥", "保湿", "高保湿"],
  脂性肌: ["皮脂", "毛穴", "皮脂コントロール"],
  混合肌: ["混合肌", "皮脂", "保湿"],
  敏感肌: ["敏感肌", "低刺激", "赤み", "CICA"],
  普通肌: ["デイリー", "保湿"],
  ダメージ毛: ["ダメージ", "補修", "トリートメント"],
  うねり: ["うねり", "まとまり", "しっとり"],
  エイジング: ["エイジング", "ハリ", "シワ"],
  皮脂過多: ["皮脂", "毛穴", "テカリ"],
  UV対策: ["UV", "SPF", "日焼け止め"],
  ナイアシンアミド: ["ナイアシンアミド", "毛穴", "皮脂", "くすみ"],
  セラミド: ["セラミド", "保湿", "バリア", "乾燥"],
  ビタミンC: ["ビタミンC", "くすみ", "透明感", "毛穴"],
  レチノール: ["レチノール", "ハリ", "エイジング", "毛穴"],
  CICA: ["CICA", "敏感肌", "赤み", "鎮静"],
  ヒアルロン酸: ["ヒアルロン酸", "保湿", "乾燥"],
  コラーゲン: ["コラーゲン", "ハリ", "サプリ"],
  鉄分: ["鉄分", "くすみ", "サプリ", "貧血対策"],
};

export function getProfileSignals(profile?: UserProfile | null, preferences?: PersonalPreferences | null) {
  const baseSignals = profile
    ? [
        profile.skinType,
        profile.hairType,
        profile.gender,
        ...profile.concerns,
        ...profile.currentProducts,
        ...profile.currentState,
        ...profile.desiredIngredients,
        ...profile.habits,
        ...profile.goals,
      ]
    : [];
  const preferenceSignals = preferences?.positiveSignals ?? [];

  return [...baseSignals, ...preferenceSignals]
    .flatMap((signal) => {
      if (!signal) return [];
      return [signal, ...(SIGNAL_ALIASES[signal] ?? [])];
    })
    .filter((signal, index, values) => values.indexOf(signal) === index);
}

export function getPersonalMatch(
  product: Product,
  profile?: UserProfile | null,
  preferences?: PersonalPreferences | null
) {
  const signals = getProfileSignals(profile, preferences);
  if (signals.length === 0) return null;

  const target = [
    product.cat,
    product.sub,
    product.name,
    product.brand,
    product.desc,
    ...product.tags,
  ].join(" ");

  const matched = signals.filter((signal) =>
    target.toLowerCase().includes(signal.toLowerCase())
  );
  const uniqueMatches = matched.filter((signal, index) => matched.indexOf(signal) === index);

  let score = 58 + uniqueMatches.length * 8;
  if (profile?.skinType && target.includes(profile.skinType)) score += 8;
  if (profile?.hairType && product.cat === "ヘアケア") score += 6;
  if (profile?.concerns.some((concern) => product.tags.includes(concern))) score += 8;
  if (profile?.currentProducts.some((item) => target.toLowerCase().includes(item.toLowerCase()))) score += 8;
  if (profile?.currentState.some((state) => target.includes(state))) score += 5;
  if (profile?.desiredIngredients.some((ingredient) => target.toLowerCase().includes(ingredient.toLowerCase()))) score += 10;
  if (profile?.goals.some((goal) => target.includes(goal))) score += 6;
  if (preferences?.topCategories.includes(product.cat)) score += 7;
  if (preferences?.positiveSignals.some((signal) => product.tags.includes(signal))) score += 6;
  if (preferences?.negativeSignals.some((signal) => target.includes(signal))) score -= 10;
  if (product.rating >= 4.5) score += 4;
  if (product.rev >= 1000) score += 3;

  return {
    score: Math.min(98, Math.max(62, score)),
    reasons: [
      ...uniqueMatches,
      ...(preferences?.topCategories.includes(product.cat) ? [`${product.cat}高評価`] : []),
    ].filter((reason, index, values) => values.indexOf(reason) === index).slice(0, 3),
  };
}
