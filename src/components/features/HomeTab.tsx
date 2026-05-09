"use client";
import { useRef, useEffect, useState, type CSSProperties } from "react";
import { CAT_META } from "@/lib/constants";
import type { YoutubeVideo } from "@/app/api/youtube/route";
import { formatPrice } from "@/lib/utils";
import { PLAN_RULES } from "@/lib/plan";
import { getPersonalMatch } from "@/lib/personalization";
import { getProductInsight } from "@/lib/productInsights";
import { getBeautyGrowth } from "@/lib/beautyGrowth";
import { trackProductEvent } from "@/lib/productEvents";
import { Icon, Stars, FreeBadge, ProBadge, ProductImage } from "@/components/ui";
import type { PersonalPreferences, UserProfile, Product, Category } from "@/types";

interface Props {
  profile: UserProfile;
  displayName: string;
  isGuest: boolean;
  isPro: boolean;
  preferences?: PersonalPreferences | null;
  onUpgrade: (sourceArea?: string, product?: Product) => void;
  onGoSearch: (cat?: string) => void;
  onOpenProduct: (p: Product) => void;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
  onGoGuide: () => void;
}

const CATEGORY_GUIDES: Record<Category, { lead: string; route: string; tags: string[] }> = {
  スキンケア: { lead: "肌状態から選ぶ", route: "化粧水 / 美容液 / 洗顔", tags: ["毛穴", "保湿", "敏感"] },
  ヘアケア: { lead: "髪質で絞る", route: "シャンプー / オイル / マスク", tags: ["うねり", "補修", "艶"] },
  メイク: { lead: "仕上がりで探す", route: "下地 / ファンデ / リップ", tags: ["崩れ", "色味", "カバー"] },
  ボディ: { lead: "質感で選ぶ", route: "クリーム / 入浴剤 / スクラブ", tags: ["乾燥", "香り", "ギフト"] },
  UVケア: { lead: "肌相性で選ぶ", route: "日焼け止め / UV下地", tags: ["皮脂", "白浮き", "敏感"] },
  フレグランス: { lead: "シーンで探す", route: "香水 / ミスト / ルーム", tags: ["甘め", "清潔感", "夜"] },
  ネイル: { lead: "色と持ちで選ぶ", route: "カラー / ケア / ジェル", tags: ["速乾", "補強", "血色"] },
  サプリ: { lead: "目的で分ける", route: "ビタミン / 鉄分 / プロテイン", tags: ["肌荒れ", "疲れ", "髪"] },
};

type CategoryArtVariant = "skincare" | "haircare" | "makeup" | "body" | "uv" | "fragrance" | "nail" | "supplement";

const categoryArt = (accent: string, variant: CategoryArtVariant) => {
  const bottle = `<rect x="610" y="178" width="170" height="370" rx="34" fill="#F8EBDD" opacity=".48"/><rect x="650" y="120" width="90" height="76" rx="18" fill="#D8B56A" opacity=".52"/><rect x="642" y="250" width="106" height="148" rx="20" fill="#150B00" opacity=".2"/>`;
  const tube = `<g transform="rotate(-16 352 396)"><rect x="278" y="150" width="150" height="430" rx="44" fill="#F8EBDD" opacity=".45"/><rect x="307" y="544" width="92" height="58" rx="12" fill="${accent}" opacity=".5"/></g>`;
  const compact = `<circle cx="795" cy="404" r="128" fill="#F8EBDD" opacity=".24"/><circle cx="795" cy="404" r="88" fill="${accent}" opacity=".32"/><circle cx="795" cy="404" r="56" fill="#120804" opacity=".28"/>`;
  const cap = `<rect x="270" y="232" width="90" height="300" rx="42" fill="${accent}" opacity=".5"/><rect x="295" y="170" width="40" height="78" rx="12" fill="#F8EBDD" opacity=".48"/>`;
  const shapes: Record<CategoryArtVariant, string> = {
    skincare: `${bottle}<ellipse cx="355" cy="525" rx="170" ry="72" fill="#F8EBDD" opacity=".22"/><rect x="255" y="390" width="220" height="118" rx="54" fill="#F8EBDD" opacity=".34"/><circle cx="430" cy="214" r="34" fill="${accent}" opacity=".5"/>`,
    haircare: `${tube}<path d="M635 190 C860 260 842 470 650 540" fill="none" stroke="#F8EBDD" stroke-width="54" stroke-linecap="round" opacity=".22"/><path d="M690 158 C865 292 802 450 612 548" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" opacity=".48"/>`,
    makeup: `${compact}<g transform="rotate(-28 405 438)"><rect x="350" y="265" width="82" height="290" rx="38" fill="${accent}" opacity=".54"/><rect x="366" y="180" width="50" height="112" rx="22" fill="#F8EBDD" opacity=".5"/></g><rect x="478" y="172" width="80" height="340" rx="38" fill="#F8EBDD" opacity=".3"/>`,
    body: `<ellipse cx="420" cy="520" rx="190" ry="76" fill="#F8EBDD" opacity=".24"/><circle cx="376" cy="390" r="128" fill="#F8EBDD" opacity=".28"/><circle cx="374" cy="390" r="86" fill="${accent}" opacity=".2"/>${bottle}`,
    uv: `${bottle}<circle cx="300" cy="218" r="96" fill="${accent}" opacity=".26"/><circle cx="300" cy="218" r="152" fill="none" stroke="#F8EBDD" stroke-width="18" opacity=".14"/><path d="M196 408 C310 326 430 326 544 408" fill="none" stroke="#F8EBDD" stroke-width="28" stroke-linecap="round" opacity=".2"/>`,
    fragrance: `<rect x="522" y="194" width="236" height="322" rx="36" fill="#F8EBDD" opacity=".32"/><rect x="586" y="126" width="108" height="94" rx="22" fill="#D8B56A" opacity=".46"/><circle cx="364" cy="464" r="118" fill="${accent}" opacity=".22"/><path d="M248 282 C364 182 492 214 554 310" fill="none" stroke="#F8EBDD" stroke-width="22" stroke-linecap="round" opacity=".18"/>`,
    nail: `${cap}<g transform="rotate(18 704 410)"><rect x="656" y="226" width="92" height="312" rx="38" fill="#F8EBDD" opacity=".32"/><rect x="676" y="162" width="52" height="92" rx="16" fill="${accent}" opacity=".5"/></g><ellipse cx="752" cy="560" rx="168" ry="48" fill="#F8EBDD" opacity=".18"/>`,
    supplement: `<rect x="522" y="176" width="214" height="344" rx="44" fill="${accent}" opacity=".32"/><rect x="566" y="122" width="126" height="82" rx="18" fill="#F8EBDD" opacity=".35"/><g opacity=".42"><ellipse cx="330" cy="392" rx="58" ry="28" fill="#F8EBDD" transform="rotate(-24 330 392)"/><ellipse cx="400" cy="486" rx="58" ry="28" fill="#D8B56A" transform="rotate(20 400 486)"/><ellipse cx="818" cy="418" rx="58" ry="28" fill="#F8EBDD" transform="rotate(-18 818 418)"/></g>`,
  };

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760">
      <defs>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="36"/></filter>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#120804"/><stop offset=".52" stop-color="#291409"/><stop offset="1" stop-color="#080402"/></linearGradient>
      </defs>
      <rect width="1100" height="760" fill="url(#g)"/>
      <circle cx="850" cy="126" r="250" fill="${accent}" opacity=".28" filter="url(#blur)"/>
      <circle cx="180" cy="650" r="240" fill="#F8EBDD" opacity=".1" filter="url(#blur)"/>
      <path d="M104 112 H996 M104 650 H996 M170 76 V684 M930 76 V684" stroke="#F8EBDD" stroke-width="1" opacity=".13"/>
      <rect x="86" y="68" width="928" height="624" rx="34" fill="none" stroke="#F8EBDD" stroke-width="1" opacity=".18"/>
      ${shapes[variant]}
    </svg>
  `)}`;
};

const CATEGORY_VISUALS: Record<Category, { image: string; mood: string; mark: string; prompt: string }> = {
  スキンケア: {
    image: categoryArt("#C4556A", "skincare"),
    mood: "skin ritual",
    mark: "SK",
    prompt: "Luxury Japanese beauty editorial still life, translucent serum bottle, porcelain cream jar, soft ivory stone, single camellia petal, warm morning light, premium skincare ritual, no text, no logo.",
  },
  ヘアケア: {
    image: categoryArt("#4A8BAD", "haircare"),
    mood: "silk hair",
    mark: "HR",
    prompt: "Luxury haircare editorial still life, glossy hair oil bottle, silk ribbon, dark walnut surface, soft salon light, refined Japanese magazine composition, no text, no logo.",
  },
  メイク: {
    image: categoryArt("#AD4A8B", "makeup"),
    mood: "soft glamour",
    mark: "MK",
    prompt: "High-end makeup editorial still life, lipstick, compact powder, sheer fabric, muted rose and black lacquer, cinematic studio light, no text, no logo.",
  },
  ボディ: {
    image: categoryArt("#4AAD8B", "body"),
    mood: "body veil",
    mark: "BD",
    prompt: "Premium body care still life, cream texture, bath oil glass bottle, pale stone, clean spa atmosphere, soft steam, elegant minimal composition, no text, no logo.",
  },
  UVケア: {
    image: categoryArt("#C49A2A", "uv"),
    mood: "sun shield",
    mark: "UV",
    prompt: "Luxury sunscreen editorial still life, slim SPF bottle, sunlit frosted glass, pale gold reflection, clean summer light, premium skincare advertising, no text, no logo.",
  },
  フレグランス: {
    image: categoryArt("#8B4AAD", "fragrance"),
    mood: "sillage",
    mark: "FR",
    prompt: "Luxury fragrance editorial still life, sculptural perfume bottle, black marble, dried rose, amber reflection, moody premium lighting, no text, no logo.",
  },
  ネイル: {
    image: categoryArt("#AD4A4A", "nail"),
    mood: "lacquer",
    mark: "NL",
    prompt: "High-end nail polish editorial still life, glass nail lacquer bottle, subtle pearl powder, polished stone, elegant hand care mood, no text, no logo.",
  },
  サプリ: {
    image: categoryArt("#4AAD4A", "supplement"),
    mood: "inner glow",
    mark: "SP",
    prompt: "Premium beauty supplement editorial still life, amber glass supplement jar, capsules, linen, morning light, wellness luxury aesthetic, no text, no logo.",
  },
};

const HOME_HERO_IMAGE = {
  desktop: "/images/beautia-hero-still-life-wide.png",
  mobile: "/images/beautia-hero-still-life-mobile.png",
};

type HeroMessageTag =
  | "morning"
  | "day"
  | "evening"
  | "late"
  | "spring"
  | "rainy"
  | "summer"
  | "autumn"
  | "winter"
  | "guest"
  | "free"
  | "pro"
  | "highScore"
  | "lowScore"
  | "deltaUp"
  | "logged"
  | "noLog"
  | "saved"
  | "noSaved"
  | "dry"
  | "oil"
  | "mixed"
  | "sensitive"
  | "hair"
  | "pores"
  | "dull"
  | "missionAnalyze"
  | "missionLog"
  | "missionSave"
  | "productReady";

interface HeroMessageContext {
  displayName: string;
  isGuest: boolean;
  isPro: boolean;
  hour: number;
  month: number;
  score: number;
  delta: number;
  logCount: number;
  savedCount: number;
  confidence: number;
  conditionText: string;
  primaryMissionLabel: string;
  hasProduct: boolean;
  profile: UserProfile;
}

interface HeroMessage {
  id: string;
  tags: HeroMessageTag[];
  kicker: string;
  line1: string;
  accent: string;
  body: string | ((context: HeroMessageContext) => string);
}

const HERO_MESSAGES: HeroMessage[] = [
  { id: "morning-reset", tags: ["morning"], kicker: "朝の声かけ", line1: "今日は、", accent: "軽めでOK。", body: (context) => `${context.displayName}さん、おはようございます。今日ちょっと乾きそうなので、朝は軽めに守る感じで。` },
  { id: "morning-base", tags: ["morning", "productReady"], kicker: "朝の準備", line1: "メイク前は、", accent: "足しすぎない。", body: (context) => `${context.displayName}さん、メイク前は無理に足さなくて大丈夫。今日は使いやすいものから見ましょう。` },
  { id: "day-balance", tags: ["day"], kicker: "昼のひと息", line1: "崩れそうなら、", accent: "少しだけ。", body: "今の時間、乾きとテカりが出やすいです。気になるところだけ見ましょう。" },
  { id: "day-light", tags: ["day", "oil"], kicker: "昼の軽さ", line1: "重ねるより、", accent: "軽く直す。", body: "テカりが気になる日は、重ねすぎないほうがよさそうです。軽い質感からでOK。" },
  { id: "evening-review", tags: ["evening"], kicker: "夜のメモ", line1: "今日のこと、", accent: "少しだけ。", body: "今日使ったもの、ひとことだけ残しておきましょう。明日かなり楽です。" },
  { id: "late-small-step", tags: ["late"], kicker: "寝る前に", line1: "今夜は、", accent: "ひとつだけ。", body: "もう遅いので、全部やらなくて大丈夫です。気になるところだけ整えましょう。" },
  { id: "spring-sway", tags: ["spring"], kicker: "春のゆらぎ", line1: "攻めるより、", accent: "やさしく。", body: "春は肌がゆらぎやすいです。今日は攻めるより、続けやすいものがよさそう。" },
  { id: "rainy-light", tags: ["rainy"], kicker: "湿気の日", line1: "べたつく日は、", accent: "軽さ優先。", body: "湿気の日は、重いものを増やすとつらくなりがちです。軽めに見ていきましょう。" },
  { id: "summer-shield", tags: ["summer"], kicker: "夏の支度", line1: "汗ばむ日は、", accent: "崩れにくく。", body: "今日はUVと皮脂を先に見たいです。毛穴落ちも一緒に気をつけましょう。" },
  { id: "autumn-dry", tags: ["autumn"], kicker: "秋の切り替え", line1: "乾く前に、", accent: "少し守る。", body: "秋は急に乾きます。重くしすぎず、保湿を少し足すくらいがよさそう。" },
  { id: "winter-layer", tags: ["winter"], kicker: "冬の乾き", line1: "守るけど、", accent: "重くしすぎない。", body: "冬は保湿したいけど、重すぎると続きにくいです。朝夜で使いやすいものから。" },
  { id: "guest-first", tags: ["guest"], kicker: "まずはお試し", line1: "まずは、", accent: "気軽に見る。", body: "はじめまして。今日は気になる悩みをひとつだけ選んで、合いそうなものを見てみましょう。" },
  { id: "guest-reason", tags: ["guest", "productReady"], kicker: "お試し中", line1: "買う前に、", accent: "少し確認。", body: "気になる商品、まずは見るだけで大丈夫です。保存やメモは無料登録から使えます。" },
  { id: "free-narrow", tags: ["free"], kicker: "無料でOK", line1: "少しずつ、", accent: "絞っていく。", body: "無料のままでも大丈夫です。保存とメモを少し使うだけで、あとで比べやすくなります。" },
  { id: "pro-deep", tags: ["pro"], kicker: "PROカルテ", line1: "記録があると、", accent: "選びやすい。", body: "ログと保存があるので、今日は相性と注意点まで見ておきましょう。" },
  { id: "high-score", tags: ["highScore"], kicker: "調子よし", line1: "いい流れは、", accent: "崩さない。", body: "今はわりと整っています。今日は大きく変えず、続けやすさで見ましょう。" },
  { id: "low-score", tags: ["lowScore"], kicker: "立て直し", line1: "全部じゃなくて、", accent: "ひとつだけ。", body: "今日は全部変えなくて大丈夫です。まずは一番気になるところだけ見ましょう。" },
  { id: "delta-up", tags: ["deltaUp"], kicker: "変化あり", line1: "よかった流れ、", accent: "残しておく。", body: "少し上向きです。よかった動きを残しておくと、次も真似しやすくなります。" },
  { id: "logged-next", tags: ["logged"], kicker: "メモあり", line1: "前のメモ、", accent: "役に立ってます。", body: (context) => `前のメモ${context.logCount}件、ちゃんと役に立ってます。今日は重さより続けやすさで見ましょう。` },
  { id: "no-log", tags: ["noLog"], kicker: "最初のメモ", line1: "ひとことで、", accent: "十分です。", body: "まだメモがないので、使った感じを一言だけでOK。次に選ぶとき助かります。" },
  { id: "saved-compare", tags: ["saved"], kicker: "あとで比べる", line1: "気になるもの、", accent: "並べて見る。", body: (context) => `保存${context.savedCount}件あります。価格と使いやすさだけでも、あとで比べやすくなります。` },
  { id: "no-saved", tags: ["noSaved"], kicker: "気になるもの", line1: "ひとつだけ、", accent: "残しておく。", body: "気になったものを一つだけ保存しておくと、次回の買う前チェックが楽です。" },
  { id: "dry-care", tags: ["dry"], kicker: "乾燥の日", line1: "乾きそうなら、", accent: "先に守る。", body: "今日はちょっと乾きそうです。しっとり感だけじゃなく、重さも見ておきましょう。" },
  { id: "mixed-care", tags: ["mixed"], kicker: "混合肌の日", line1: "Tゾーンと頬、", accent: "分けて見る。", body: "Tゾーンと頬で、たぶん正解が違います。今日は一つに決めつけないほうがよさそう。" },
  { id: "sensitive-care", tags: ["sensitive"], kicker: "ゆらぎの日", line1: "攻めずに、", accent: "続けやすく。", body: "ゆらぎやすい日は、攻める成分より安心して続けられるものから見ましょう。" },
  { id: "hair-care", tags: ["hair"], kicker: "髪も見る", line1: "髪のまとまりも、", accent: "印象の一部。", body: "肌だけじゃなく、髪のまとまりも今日の印象に出ます。広がりや乾きも見ておきましょう。" },
  { id: "pores-care", tags: ["pores"], kicker: "毛穴の日", line1: "隠す前に、", accent: "落とすところから。", body: "毛穴が気になる日は、隠す前に洗顔と保湿を見たいです。下地はそのあとでOK。" },
  { id: "dull-care", tags: ["dull"], kicker: "くすみの日", line1: "色を足す前に、", accent: "土台から。", body: "くすみが気になる日は、先に保湿とUVを見ましょう。色を足すのはそのあとで大丈夫。" },
  { id: "mission-analyze", tags: ["missionAnalyze"], kicker: "成分だけ見る", line1: "迷ったら、", accent: "成分だけ。", body: "迷ったら、今日は成分チェックだけでOKです。合うかどうかの目安になります。" },
  { id: "mission-log", tags: ["missionLog"], kicker: "使った感じ", line1: "今日の感じ、", accent: "一言でOK。", body: "よかった、重かった、しみたかも。そのくらいの一言で、次にかなり使えます。" },
];

function resolveSeason(month: number): HeroMessageTag {
  if (month >= 3 && month <= 5) return "spring";
  if (month === 6 || month === 7) return "rainy";
  if (month === 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function resolveTimeSlot(hour: number): HeroMessageTag {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 23) return "evening";
  return "late";
}

function textIncludes(values: string[], patterns: string[]) {
  return values.some((value) => patterns.some((pattern) => value.includes(pattern)));
}

function matchesHeroMessageTag(tag: HeroMessageTag, context: HeroMessageContext) {
  const profileValues = [
    context.profile.skinType,
    context.profile.hairType,
    ...context.profile.concerns,
    ...context.profile.currentState,
    ...context.profile.habits,
    ...context.profile.goals,
  ].filter(Boolean);

  switch (tag) {
    case "morning":
    case "day":
    case "evening":
    case "late":
      return resolveTimeSlot(context.hour) === tag;
    case "spring":
    case "rainy":
    case "summer":
    case "autumn":
    case "winter":
      return resolveSeason(context.month) === tag;
    case "guest":
      return context.isGuest;
    case "free":
      return !context.isGuest && !context.isPro;
    case "pro":
      return context.isPro;
    case "highScore":
      return context.score >= 84;
    case "lowScore":
      return context.score < 68;
    case "deltaUp":
      return context.delta > 0;
    case "logged":
      return context.logCount > 0;
    case "noLog":
      return context.logCount === 0;
    case "saved":
      return context.savedCount > 0;
    case "noSaved":
      return context.savedCount === 0;
    case "dry":
      return textIncludes(profileValues, ["乾燥", "乾く"]);
    case "oil":
      return textIncludes(profileValues, ["脂性", "テカ", "皮脂"]);
    case "mixed":
      return textIncludes(profileValues, ["混合", "Tゾーン", "毛穴落ち"]);
    case "sensitive":
      return textIncludes(profileValues, ["敏感", "赤み", "刺激"]);
    case "hair":
      return Boolean(context.profile.hairType) || textIncludes(profileValues, ["髪", "毛", "うねり", "広が"]);
    case "pores":
      return textIncludes(profileValues, ["毛穴"]);
    case "dull":
      return textIncludes(profileValues, ["くすみ", "透明感"]);
    case "missionAnalyze":
      return context.primaryMissionLabel.includes("成分");
    case "missionLog":
      return context.primaryMissionLabel.includes("ログ") || context.primaryMissionLabel.includes("使用感");
    case "missionSave":
      return context.primaryMissionLabel.includes("保存") || context.primaryMissionLabel.includes("候補");
    case "productReady":
      return context.hasProduct;
    default:
      return false;
  }
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function selectHeroMessage(context: HeroMessageContext) {
  const matched = HERO_MESSAGES.filter((message) =>
    message.tags.every((tag) => matchesHeroMessageTag(tag, context))
  );
  const candidates = matched.length > 0 ? matched : HERO_MESSAGES;
  const dateKey = `${context.month}-${new Date().getDate()}-${context.displayName}-${context.score}-${context.primaryMissionLabel}`;
  const message = candidates[hashText(dateKey) % candidates.length];
  const body = typeof message.body === "function" ? message.body(context) : message.body;
  return { ...message, body };
}

function BeautyBuddyBubble({ body, conditionText, isGuest }: { body: string; conditionText: string; isGuest: boolean }) {
  return (
    <div className="home-buddy-bubble">
      <div className="home-buddy-avatar" aria-hidden="true">
        <Icon name="droplet" size={18} sw={1.6} />
      </div>
      <div>
        <span>{isGuest ? "beautiaから" : "横で見てます"}</span>
        <p>{body}</p>
        <small>いま: {conditionText}</small>
      </div>
    </div>
  );
}

export default function HomeTab({ profile, displayName, isGuest, isPro, preferences, onUpgrade, onGoSearch, onOpenProduct, onGoKarte, onGoAnalyze, onGoSaved, onGoLog, onGoGuide }: Props) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [activeVideoCategory, setActiveVideoCategory] = useState("全体");
  const [aiPicks, setAiPicks] = useState<Product[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Product[]>([]);

  useEffect(() => {
    setVideosLoading(true);
    fetch(`/api/youtube?category=${encodeURIComponent(activeVideoCategory)}&max=8`)
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .finally(() => setVideosLoading(false));
  }, [activeVideoCategory]);

  // プロフィールに基づくおすすめ
  useEffect(() => {
    const learnedTags = isPro ? preferences?.positiveSignals ?? [] : [];
    const tags = [
      ...learnedTags.slice(0, 4),
      profile.skinType,
      profile.hairType,
      ...profile.concerns.slice(0, 5),
    ].filter(Boolean);

    const params = new URLSearchParams({ limit: "6" });
    if (tags.length > 0) params.set("tags", tags.join(","));
    else params.set("free", "true");

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => {
        const picks: Product[] = d.products ?? [];
        const sorted = isPro
          ? [...picks].sort((a, b) =>
              (getPersonalMatch(b, profile, preferences)?.score ?? 0) -
              (getPersonalMatch(a, profile, preferences)?.score ?? 0)
            )
          : picks;
        setAiPicks(sorted.length >= 3 ? sorted : []);
      });
  }, [profile, isPro, preferences]);

  // エディターズピック（IDが4の倍数 or 評価順上位4件）
  useEffect(() => {
    fetch("/api/products?limit=20")
      .then(r => r.json())
      .then(d => {
        const all: Product[] = d.products ?? [];
        setEditorsPicks(all.filter((_, i) => i % 4 === 0).slice(0, 4));
      });
  }, []);

  const heroProduct = aiPicks[0] ?? editorsPicks[0] ?? null;
  const recommendationProducts = aiPicks.length > 0 ? aiPicks : editorsPicks.slice(0, 6);
  const growth = getBeautyGrowth({
    profile,
    preferences: isPro ? preferences : null,
    isPro,
    logCount: preferences?.logCount ?? 0,
    savedCount: preferences?.savedCount ?? 0,
    productCount: recommendationProducts.length,
    topProduct: heroProduct,
  });
  const concernText = profile.concerns.slice(0, 3).join("・") || "今日の悩み";
  const conditionText = profile.currentState.slice(0, 2).join("・") || concernText;
  const primaryMission = growth.missions[0];
  const primaryMissionLabel = primaryMission?.label ?? "ログで変化を比較";
  const now = new Date();
  const heroMessage = selectHeroMessage({
    displayName,
    isGuest,
    isPro,
    hour: now.getHours(),
    month: now.getMonth() + 1,
    score: growth.score,
    delta: growth.delta,
    logCount: preferences?.logCount ?? 0,
    savedCount: preferences?.savedCount ?? 0,
    confidence: preferences?.confidence ?? 0,
    conditionText,
    primaryMissionLabel,
    hasProduct: Boolean(heroProduct),
    profile,
  });
  const handlePrimaryMission = () => {
    switch (primaryMission?.tone) {
      case "analyze":
        onGoAnalyze();
        break;
      case "log":
        onGoLog();
        break;
      case "save":
        onGoSearch();
        break;
      case "pro":
        onUpgrade("home_growth_mission");
        break;
      case "profile":
      default:
        onGoKarte();
        break;
    }
  };

  return (
    <div className="motion-fade-scale" style={{ background: "linear-gradient(180deg,#FCF7F0 0%,#F7F0E8 42%,#EEF4EF 100%)" }}>
      {/* ── HERO ── */}
      <section className="home-hero" style={{ position: "relative", minHeight: 560, overflow: "hidden", background: "#21110D" }}>
        <div className="home-hero-art" aria-hidden="true">
          <picture>
            <source media="(max-width: 640px)" srcSet={HOME_HERO_IMAGE.mobile} />
            <img src={HOME_HERO_IMAGE.desktop} alt="" />
          </picture>
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "16.666% 100%", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(33,17,13,.98) 0%, rgba(58,33,26,.82) 38%, rgba(33,17,13,.2) 76%, rgba(33,17,13,.08) 100%)", pointerEvents: "none" }}/>

        <div className="motion-reveal" style={{ position: "absolute", top: 22, left: 32, right: 32, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.3em", color: "rgba(251,248,243,.45)", fontFamily: "ui-monospace,monospace" }}>
          <span>{heroMessage.kicker}</span>
          <span className="hidden md:block">━━ {isGuest ? "まずはお試し" : `${displayName}さんの今日`}</span>
          <span>{now.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}</span>
        </div>

        <div className="home-hero-content motion-reveal-slow" style={{ position: "absolute", bottom: 34, left: 32, right: 32, maxWidth: 560 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>
            {heroMessage.kicker} · {isPro && preferences?.confidence ? "記録も見ました" : "カルテを見ながら"}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.04, margin: 0, fontWeight: 400, color: "#FBF8F3", letterSpacing: "0.02em" }}>
            {heroMessage.line1}<br/>
            <span style={{ color: "#D4A853", fontStyle: "italic" }}>{heroMessage.accent}</span>
          </h1>
          <BeautyBuddyBubble body={heroMessage.body} conditionText={conditionText} isGuest={isGuest} />
          <div className="home-hero-helper">
            {isGuest ? "はじめてなら、使い方からでもOKです。" : "迷ったら、まずここだけでOKです。"}
          </div>
          <div className="home-hero-actions">
            <button className="motion-cta" onClick={handlePrimaryMission}>
              今日これだけ
            </button>
            {heroProduct && (
              <button className="motion-nav-button" onClick={() => onOpenProduct(heroProduct)}>
                候補を見る
              </button>
            )}
            <button className="motion-nav-button ghost" onClick={onGoGuide}>
              使い方
            </button>
          </div>
        </div>
      </section>

      <section className="home-guide-prompt mobile-tight">
        <div className="section-shell">
          <div>
            <span>{isGuest ? "はじめての方へ" : "迷ったらここ"}</span>
            <p>
              使い方とQ&AはGuideにまとめました。最初は商品を見るだけでも大丈夫です。
            </p>
          </div>
          <div className="home-guide-prompt-actions">
            <button className="motion-nav-button" onClick={onGoGuide}>
              使い方を見る
            </button>
            <button className="motion-nav-button" onClick={() => onGoSearch()}>
              商品を探す
            </button>
          </div>
        </div>
      </section>

      {!isGuest && (
        <section className="mobile-tight motion-reveal" style={{ padding: "20px 32px", borderBottom: "1px solid #EDE5DC", background: "#FBF8F3" }}>
          <div
            className="section-shell home-personal-desk"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr .9fr",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            <div style={{ border: "1px solid #E8D7BE", borderRadius: 16, padding: "18px 18px 16px", background: "linear-gradient(135deg,#fffaf0,#fff)", boxShadow: "0 12px 34px rgba(21,11,0,.05)" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 8 }}>今日の整理</div>
              <h2 style={{ margin: "0 0 8px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, lineHeight: 1.2, color: "#150B00", fontWeight: 500 }}>
                おかえりなさい、{displayName}さん。
              </h2>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: "#5F4A3D" }}>
                「{conditionText}」が気になりそう。まずここからでOKです。
              </p>
            </div>
            <div className="home-growth-mini motion-card">
              <div className="home-growth-mini-head">
                <div>
                  <span>今日の積み上げ</span>
                  <strong>{growth.levelName}</strong>
                </div>
                <div>
                  <b>{growth.score}</b>
                  <small>{growth.delta > 0 ? `+${growth.delta}` : "基準"}</small>
                </div>
              </div>
              <div className="home-growth-progress" aria-label={`今日の積み上げ ${growth.progress}%`}>
                <i style={{ width: `${growth.progress}%` }} />
              </div>
              <p>{growth.summary}</p>
              <button className="motion-nav-button" onClick={onGoKarte}>
                今日の分だけ見る →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY GRID ── */}
      <section className="editorial-section mobile-tight" style={{ padding: "44px 32px 38px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 01</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>目的から探す</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.7, color: "#7A6A5D" }}>
              悩み、質感、使う場面で選ぶ。
            </p>
          </div>
          <button className="motion-nav-button" onClick={() => onGoSearch()} style={{ border: "1px solid #D4A853", borderRadius: 999, padding: "9px 14px", background: "#fff", color: "#A8722A", fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
            検索を開く
          </button>
        </div>
        <div className="category-couture-grid grid-cols-1-mobile motion-stagger">
          {(Object.entries(CAT_META) as [Category, typeof CAT_META[Category]][]).map(([name, m], i) => {
            const guide = CATEGORY_GUIDES[name];
            const visual = CATEGORY_VISUALS[name];
            const cardStyle = {
              "--category-accent": m.accent,
              "--category-image": `url(${visual.image})`,
            } as CSSProperties;
            return (
            <button
              key={name}
              className="category-couture-card motion-card tap-card"
              onClick={() => onGoSearch(name)}
              style={cardStyle}
              aria-label={`${name}を詳しく探す`}
            >
              <div className="category-couture-content">
                <div className="category-couture-topline">
                  <span>{visual.mood}</span>
                  <span>0{i + 1}</span>
                </div>

                <div className="category-couture-title-wrap">
                  <span className="category-couture-icon">{visual.mark}</span>
                  <div>
                    <div className="category-couture-title">{name}</div>
                    <div className="category-couture-en">{m.en}</div>
                  </div>
                </div>

                <p className="category-couture-lead">{guide.lead}</p>

                <div className="category-couture-tags">
                  {guide.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="category-couture-footer">
                  <span>{guide.route}</span>
                  <span className="tap-card-hint">見る →</span>
                </div>
              </div>
            </button>
          )})}
        </div>
        {!isPro && (
          <div style={{ marginTop: 14, border: "1px solid #E8D7BE", borderRadius: 12, padding: "12px 14px", background: "#FFF9EC", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 420px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#A8722A", fontFamily: "ui-monospace,monospace", marginBottom: 4 }}>PROで細かく</div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "#5F4A3D", fontWeight: 700 }}>
                朝/夜・予算・避けたい成分まで。
              </p>
            </div>
            <button className="motion-cta" onClick={() => onUpgrade("home_precision_locked")} style={{ border: "none", borderRadius: 999, padding: "9px 14px", background: "#1A0E08", color: "#D4A853", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              条件を細かく見る
            </button>
          </div>
        )}
        </div>
      </section>

      {/* ── RECOMMENDATION RAIL ── */}
      <ProductRail
        number="02"
        title={`今週の ${profile.skinType || "あなた"} 向け候補`}
        eyebrow={aiPicks.length > 0 ? (isPro && preferences?.confidence ? "ログから更新" : "カルテから候補") : "編集部の候補"}
        products={recommendationProducts}
        onOpen={onOpenProduct}
        isPro={isPro}
        onUpgrade={onUpgrade}
        profile={profile}
        preferences={isPro ? preferences : null}
      />

      {/* ── EDITOR'S PICKS GRID ── */}
        <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 03</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>編集部が選ぶ、今週の逸品</h2>
          </div>
          <button className="motion-nav-button" onClick={() => onGoSearch()} style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer" }}>すべて見る →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-cols-2-mobile motion-stagger">
          {editorsPicks.map(p => (
            <EditorCard key={p.id} product={p} onOpen={onOpenProduct} isPro={isPro} profile={profile} preferences={preferences}/>
          ))}
        </div>
        </div>
      </section>

      {/* ── TRENDING VIDEOS ── */}
      <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 48px", borderBottom: "1px solid #EDE5DC" }}>
        <div className="section-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ 04</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, margin: 0, fontWeight: 400, color: "#150B00" }}>🔥 今バズってる動画</h2>
          </div>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeVideoCategory === "全体" ? "美容 おすすめ コスメ" : activeVideoCategory)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", textDecoration: "none" }}>
            YouTubeで見る →
          </a>
        </div>

        {/* カテゴリタブ */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }} className="hide-scrollbar">
          {["全体", ...Object.keys(CAT_META)].map(cat => (
            <button key={cat} className="motion-nav-button" onClick={() => setActiveVideoCategory(cat)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: activeVideoCategory === cat ? "#D4A853" : "#EDE5DC",
              background: activeVideoCategory === cat ? "#D4A853" : "transparent",
              color: activeVideoCategory === cat ? "#1A0E08" : "#8A7A6E",
              fontSize: 11, fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em",
              cursor: "pointer", fontWeight: activeVideoCategory === cat ? 700 : 400,
            }}>
              {cat === "全体" ? "すべて" : cat}
            </button>
          ))}
        </div>

        {/* 動画一覧 */}
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
          {videosLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, width: 200 }}>
                  <div style={{ height: 112, borderRadius: 10, background: "#F1EADE", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}/>
                  <div style={{ height: 12, borderRadius: 4, background: "#F1EADE", marginBottom: 4 }}/>
                  <div style={{ height: 10, borderRadius: 4, background: "#F1EADE", width: "60%" }}/>
                </div>
              ))
            : videos.map(v => (
                <a key={v.id} className="motion-card" href={v.url} target="_blank" rel="noreferrer" style={{ flexShrink: 0, width: 200, textDecoration: "none" }}>
                  <div style={{ height: 112, borderRadius: 10, overflow: "hidden", position: "relative", marginBottom: 8, background: "#1A0E08" }}>
                    <img src={v.thumbnail} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} loading="lazy"/>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.6) 0%, transparent 50%)" }}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(251,248,243,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
                        <Icon name="play" size={14} stroke="#1A0E08"/>
                      </div>
                    </div>
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, color: "#FBF8F3", fontFamily: "ui-monospace,monospace", background: "rgba(0,0,0,.65)", padding: "2px 6px", borderRadius: 10 }}>
                      👁 {v.views}回
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#150B00", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {v.title}
                  </p>
                </a>
              ))
          }
        </div>
        </div>
      </section>

      {/* ── PRO TEASER ── */}
      {!isPro && (
        <section className="mobile-tight motion-reveal motion-premium-hero" style={{ background: "#1A0E08", color: "#FBF8F3", padding: "56px 32px", position: "relative", overflow: "hidden" }}>
          <div className="section-shell" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 14 }}>━━ BEAUTIA PRO</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(28px,5vw,44px)", margin: "0 0 16px", fontWeight: 400, lineHeight: 1.2 }}>
              アトリエの扉を、<br/>そっと開ける。
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(251,248,243,.65)", margin: "0 0 24px", maxWidth: 380 }}>
              月額{PLAN_RULES.pro.priceLabel}。解析、詳細、購入リンクを開放。
            </p>
            <button className="motion-cta" onClick={() => onUpgrade("home_pro_teaser")} style={{ padding: "13px 28px", background: "linear-gradient(135deg,#D4A853,#A8722A)", border: "none", color: "#1A0E08", fontSize: 13, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
              PRO へアップグレード →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 180 }} className="hidden md:flex">
            {["✦ 成分解析 無制限", "✦ 全30製品 フルアクセス", "✦ パーソナル診断", "✦ 優先サポート"].map(f => (
              <div key={f} style={{ fontSize: 13, color: "rgba(251,248,243,.8)", letterSpacing: "0.05em" }}>{f}</div>
            ))}
          </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TutorialGuide({ isPro, onGoKarte, onGoAnalyze, onGoSearch, onGoSaved, onGoLog, onGoGuide, onUpgrade }: {
  isPro: boolean;
  onGoKarte: () => void;
  onGoAnalyze: () => void;
  onGoSearch: () => void;
  onGoSaved: () => void;
  onGoLog: () => void;
  onGoGuide: () => void;
  onUpgrade: () => void;
}) {
  const steps = [
    {
      no: "01",
      title: "カルテを整える",
      body: "肌・髪・予算を登録。",
      action: "カルテを見る",
      onClick: onGoKarte,
      badge: "最初にやる",
    },
    {
      no: "02",
      title: "商品を保存・比較",
      body: "気になる商品を残す。",
      action: "保存リスト",
      onClick: onGoSaved,
      badge: "無料でOK",
    },
    {
      no: "03",
      title: "成分を確認",
      body: "合う理由を確認。",
      action: "成分分析",
      onClick: onGoAnalyze,
      badge: "月3回無料",
    },
    {
      no: "04",
      title: "使った感想をログ",
      body: "あとで比べやすくする。",
      action: "ログを書く",
      onClick: onGoLog,
      badge: "次に使える",
    },
  ];

  return (
    <section className="mobile-tight motion-reveal" style={{ padding: "30px 32px", background: "#fff", borderBottom: "1px solid #EDE5DC" }}>
      <div className="section-shell grid-cols-1-mobile" style={{ display: "grid", gridTemplateColumns: "minmax(240px,.75fr) minmax(0,1.25fr)", gap: 18, alignItems: "stretch" }}>
        <div className="motion-card" style={{ borderRadius: 16, padding: "20px 20px 18px", background: "linear-gradient(145deg,#1A0E08,#3A1D0D)", color: "#FBF8F3", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>3分で使う</div>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 30, lineHeight: 1.15, fontWeight: 500 }}>
              迷ったら、<br/>使い方へ。
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.85, color: "rgba(251,248,243,.7)" }}>
              詳しい説明はここに集約。
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="motion-cta" onClick={onGoGuide} style={{ border: "none", borderRadius: 999, padding: "9px 12px", background: "linear-gradient(135deg,#D4A853,#A8722A)", color: "#1A0E08", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              使い方を見る
            </button>
            <button className="motion-nav-button" onClick={onGoSearch} style={{ border: "1px solid rgba(212,168,83,.45)", borderRadius: 999, padding: "9px 12px", background: "rgba(212,168,83,.12)", color: "#D4A853", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
              商品を探す
            </button>
            {!isPro && (
              <button className="motion-nav-button" onClick={onUpgrade} style={{ border: "1px solid rgba(212,168,83,.35)", borderRadius: 999, padding: "9px 12px", background: "transparent", color: "rgba(251,248,243,.78)", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
                PROで詳しく見る
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }} className="grid-cols-1-mobile motion-stagger">
          {steps.map((step) => (
            <button
              key={step.no}
              onClick={step.onClick}
              className="lift-card motion-card"
              style={{
                border: "1px solid #EDE5DC",
                borderRadius: 14,
                padding: 14,
                background: "#FBF8F3",
                textAlign: "left",
                cursor: "pointer",
                minHeight: 132,
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#A8722A", fontFamily: "ui-monospace,monospace" }}>{step.no}</span>
                <span style={{ fontSize: 10, borderRadius: 999, padding: "3px 7px", background: "#FFF0C8", color: "#A8722A", fontWeight: 900 }}>{step.badge}</span>
              </div>
              <div style={{ fontSize: 14, color: "#150B00", fontWeight: 900, lineHeight: 1.35 }}>{step.title}</div>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "#6B5B4A", flex: 1 }}>{step.body}</p>
              <span style={{ fontSize: 11, color: "#A8722A", fontWeight: 900 }}>{step.action} →</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Horizontal product rail ──────────────────────────────────────────
function ProductRail({ number, title, eyebrow, products, onOpen, isPro, onUpgrade, profile, preferences }: {
  number: string; title: string; eyebrow: string; products: Product[];
  onOpen: (p: Product) => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });

  return (
    <section className="mobile-tight motion-reveal" style={{ padding: "44px 32px 40px", borderBottom: "1px solid #EDE5DC" }}>
      <div className="section-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#D4A853", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>━━ {number}</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, margin: "0 0 4px", fontWeight: 400, color: "#150B00" }}>{title}</h2>
          <div style={{ fontSize: 11, color: "#8A7A6E", fontFamily: "ui-monospace,monospace", letterSpacing: "0.1em" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["←", "→"].map((d, i) => (
            <button key={d} className="motion-nav-button" onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #D9CDBC", background: "transparent", cursor: "pointer", fontSize: 14, color: "#150B00", display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar motion-stagger">
        {products.map(p => <RailCard key={p.id} product={p} onOpen={onOpen} isPro={isPro} onUpgrade={onUpgrade} profile={profile} preferences={preferences}/>)}
      </div>
      </div>
    </section>
  );
}

function RailCard({ product: p, onOpen, isPro, onUpgrade, profile, preferences }: {
  product: Product; onOpen: (p: Product) => void; isPro: boolean; onUpgrade: (sourceArea?: string, product?: Product) => void; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const insight = getProductInsight(p, profile, match?.reasons ?? []);
  const handleOpen = () => {
    if (locked) {
      void trackProductEvent({
        eventType: "locked_product_click",
        sourceArea: "home_recommendation_rail",
        product: p,
        isPro,
        metadata: { matchScore: match?.score ?? null },
      });
      onUpgrade("home_recommendation_rail", p);
      return;
    }
    onOpen(p);
  };
  return (
    <div className="lift-card motion-card tap-card" role="button" tabIndex={0} onClick={handleOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpen(); } }} style={{ flexShrink: 0, width: 220, cursor: "pointer", background: "#fff", border: "1px solid #EDE5DC", borderRadius: 12, overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.06)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(21,11,0,.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(21,11,0,.06)"; }}>
      <div style={{ position: "relative", height: 140, overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} imageSize={320}/>
        {locked && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(21,11,0,.55),rgba(248,244,239,.15))", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 10 }}><span style={{ fontSize: 10, color: "#F5EEE4", background: "rgba(26,14,8,.9)", borderRadius: 999, padding: "5px 9px", fontWeight: 800 }}>PROで詳細</span></div>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>{p.free ? <FreeBadge/> : <ProBadge/>}</div>
        {isPro && match && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "#1A0E08", color: "#D4A853", borderRadius: 999, padding: "3px 7px", fontSize: 9, fontWeight: 800 }}>
            {match.score}%
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em", marginBottom: 3 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 6 }}>{p.name}</div>
        <Stars rating={p.rating} size={11}/>
        <div style={{ marginTop: 9, padding: "8px 9px", borderRadius: 10, background: "#FBF8F3", border: "1px solid #EDE5DC" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.14em", color: "#A8722A", fontFamily: "ui-monospace,monospace", fontWeight: 900 }}>買う前メモ</div>
          <p style={{ margin: "3px 0 0", fontSize: 10, lineHeight: 1.45, color: "#6B5B4A", fontWeight: 700, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {isPro && match ? insight.why : insight.verdict}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 17, fontWeight: 500, color: "#150B00" }}>{formatPrice(p.price)}</span>
          <span className="tap-card-hint" style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: m.color, color: m.dark }}>チェック →</span>
        </div>
      </div>
    </div>
  );
}

function EditorCard({ product: p, onOpen, isPro, profile, preferences }: {
  product: Product; onOpen: (p: Product) => void; isPro: boolean; profile: UserProfile; preferences?: PersonalPreferences | null;
}) {
  const m = CAT_META[p.cat];
  const locked = !p.free && !isPro;
  const match = getPersonalMatch(p, profile, preferences);
  const insight = getProductInsight(p, profile, match?.reasons ?? []);
  return (
    <div className="lift-card motion-card tap-card" role="button" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(p); } }} style={{ cursor: "pointer", background: "#fff", border: `1px solid ${m.accent}33`, borderRadius: 10, overflow: "hidden", transition: "transform 0.2s ease", boxShadow: "0 2px 12px rgba(21,11,0,.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: m.color }}>
        <ProductImage id={p.id} name={p.name} brand={p.brand} sub={p.sub} src={p.image} alt={p.name} catColor={m.color} catIcon={m.icon} imageSize={360}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(21,11,0,.55) 0%, transparent 50%)" }}/>
        {locked && <div style={{ position: "absolute", inset: 0, background: "rgba(21,11,0,.2)" }}/>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ fontSize: 9, background: "rgba(212,168,83,.9)", color: "#1A0E08", padding: "3px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.1em" }}>編集部</span>
        </div>
        {locked && (
          <div style={{ position: "absolute", right: 8, bottom: 8, fontSize: 9, background: "rgba(26,14,8,.9)", color: "#D4A853", padding: "4px 8px", borderRadius: 999, fontWeight: 800 }}>
            PRO詳細
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: m.accent, fontFamily: "ui-monospace,monospace", letterSpacing: "0.12em", marginBottom: 2 }}>{p.brand}</div>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, lineHeight: 1.3, color: "#150B00", marginBottom: 4 }}>{p.name}</div>
        <p style={{ minHeight: 32, margin: "0 0 8px", fontSize: 10, lineHeight: 1.5, color: "#6B5B4A", fontWeight: 700, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {isPro && match ? insight.why : insight.verdict}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stars rating={p.rating} size={10}/>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 15, fontWeight: 500, color: "#A8722A" }}>{formatPrice(p.price)}</span>
        </div>
      </div>
    </div>
  );
}
