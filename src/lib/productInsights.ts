import type { Product, UserProfile } from "@/types";

const CATEGORY_TIMING: Record<Product["cat"], string> = {
  スキンケア: "朝夜のケアに組み込みやすい候補",
  ヘアケア: "洗髪後・スタイリング前の見直し候補",
  メイク: "朝の仕上がりと日中の崩れ対策に",
  ボディ: "入浴後や乾燥を感じる日のケアに",
  UVケア: "朝のUV・下地ステップで比較したい候補",
  フレグランス: "外出前や気分を切り替えたい日に",
  ネイル: "週末ケアや色持ちを見たい時に",
  サプリ: "毎日の習慣として続けやすさを確認",
};

const CATEGORY_AVOID: Record<Product["cat"], string> = {
  スキンケア: "刺激を感じる日は少量から。成分相性を確認",
  ヘアケア: "重さが出やすい髪は使用量を控えめに",
  メイク: "色味・崩れ方は手持ち下地との相性を見る",
  ボディ: "香りや質感が残るタイプは使用シーンを選ぶ",
  UVケア: "白浮き・乾燥・落としやすさを購入前に確認",
  フレグランス: "香りの強さと持続時間は口コミで確認",
  ネイル: "乾きやすさと爪への負担をチェック",
  サプリ: "体質や服薬中の人は成分量を確認",
};

function hasAny(values: string[], words: string[]) {
  const text = values.join(" ").toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
}

export function getProductInsight(product: Product, profile?: UserProfile | null, matchReasons: string[] = []) {
  const textValues = [
    product.name,
    product.brand,
    product.sub,
    product.desc,
    ...product.tags,
  ];

  const matchedReason = matchReasons[0];
  const hasSkinConcern = profile?.concerns?.some((concern) => hasAny(textValues, [concern]));
  const ingredient = profile?.desiredIngredients?.find((item) => hasAny(textValues, [item]));
  const goal = profile?.goals?.find((item) => hasAny(textValues, [item]));
  const state = profile?.currentState?.find((item) => hasAny(textValues, [item]));

  const why = matchedReason
    ? `あなたの「${matchedReason}」に近い条件`
    : ingredient
      ? `欲しい成分「${ingredient}」に反応`
      : goal
        ? `目標「${goal}」から見たい候補`
        : hasSkinConcern
          ? "登録した悩みと近いタグあり"
          : `${product.cat}の購入前チェック候補`;

  const verdict =
    product.rank && product.rank <= 3
      ? `楽天ランキング上位。まず価格差とレビュー傾向を見る価値あり`
      : product.rev >= 10000 && product.rating >= 4.5
        ? `レビュー量と評価の両方が強く、比較リストに残したい`
        : product.rating >= 4.6
          ? `評価が高め。合う理由と避けたい点を見て判断`
          : product.price >= 8000
            ? `価格が高めなので、相性と口コミ確認を優先`
            : `試しやすい価格帯。タグと使用シーンで比較`;

  const caution =
    product.cat === "スキンケア" && hasAny(textValues, ["レチノール", "ビタミンC", "ピーリング", "酸"])
      ? "攻めた成分は夜・少量から。敏感な日は間隔を空ける"
      : profile?.skinType === "敏感肌" && product.cat !== "サプリ"
        ? "敏感肌は香料・刺激感の口コミを先に確認"
        : state
          ? `今の状態「${state}」に合うか、使うタイミングを確認`
          : CATEGORY_AVOID[product.cat];

  const purchaseCue =
    product.free
      ? "詳細と購入リンクを確認できます"
      : "PROで詳細・購入リンク・比較を解放";

  return {
    why,
    verdict,
    timing: CATEGORY_TIMING[product.cat],
    caution,
    purchaseCue,
  };
}
