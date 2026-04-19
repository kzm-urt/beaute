import type { CatKey, CatMeta, Product } from "@/types";

export const BEAUTE_TOKENS = {
  bg: "#F8F4EF",
  bgDeeper: "#F1EADE",
  text: "#150B00",
  textMuted: "#6B5B4A",
  gold: "#A8722A",
  goldLight: "#D4A853",
  border: "#EDE5DC",
  borderDark: "#D9CDBC",
  navBg: "#1A0E08",
  navBgSoft: "#241710",
  cream: "#FBF8F3",
};

export const CAT_META: Record<CatKey, CatMeta> = {
  skincare:   { jp: "スキンケア",   en: "Skincare",   color: "#FDE8EC", accent: "#C4556A", dark: "#8B2E3F" },
  haircare:   { jp: "ヘアケア",     en: "Haircare",   color: "#E0EEF8", accent: "#4A8BAD", dark: "#2C5F78" },
  makeup:     { jp: "メイク",       en: "Makeup",     color: "#F5D5EA", accent: "#AD4A8B", dark: "#7A2C61" },
  body:       { jp: "ボディ",       en: "Body",       color: "#D5F0E8", accent: "#4AAD8B", dark: "#2C7861" },
  uv:         { jp: "UVケア",       en: "UV Care",    color: "#FDF0D5", accent: "#C49A2A", dark: "#8A6C10" },
  fragrance:  { jp: "フレグランス", en: "Fragrance",  color: "#EAD5F5", accent: "#8B4AAD", dark: "#612C78" },
  nail:       { jp: "ネイル",       en: "Nail",       color: "#F5D8D8", accent: "#AD4A4A", dark: "#782C2C" },
  supplement: { jp: "サプリ",       en: "Supplement", color: "#D5F0D5", accent: "#4AAD4A", dark: "#2C782C" },
};

export const CAT_ORDER: CatKey[] = [
  "skincare", "haircare", "makeup", "body", "uv", "fragrance", "nail", "supplement",
];

export const PRODUCTS: Product[] = [
  { id: "p01", cat: "skincare",   brand: "Maison N.",    name: "Velvet Repair Serum",      tag: "エイジングケア", price: "¥12,800", volume: "30ml",  rating: 4.8, reviews: 1284, editors: true,  note: "Night ritual · 2–3 drops" },
  { id: "p02", cat: "skincare",   brand: "Atelier 07",   name: "Dewdrop Essence",          tag: "保湿",           price: "¥8,200",  volume: "100ml", rating: 4.6, reviews: 842,  editors: false, note: "Morning layer · after toner" },
  { id: "p03", cat: "haircare",   brand: "Studio Ébène", name: "Silk Ribbon Treatment",    tag: "ダメージ補修",   price: "¥6,400",  volume: "200ml", rating: 4.7, reviews: 512,  editors: true,  note: "Weekly · 5min mask" },
  { id: "p04", cat: "makeup",     brand: "Rouge Club",   name: "Matte Couture Lip N° 08",  tag: "リップ",         price: "¥4,800",  volume: "3.5g",  rating: 4.9, reviews: 2203, editors: true,  note: "Deep plum · satin finish" },
  { id: "p05", cat: "body",       brand: "Onde & Co.",   name: "Mineral Bath Salt",        tag: "リラックス",     price: "¥3,600",  volume: "400g",  rating: 4.5, reviews: 377,  editors: false, note: "Cedar + bergamot" },
  { id: "p06", cat: "uv",         brand: "Plein Soleil", name: "Invisible Veil SPF50",     tag: "UV",             price: "¥5,400",  volume: "50ml",  rating: 4.7, reviews: 1092, editors: true,  note: "Daily base · no white cast" },
  { id: "p07", cat: "fragrance",  brand: "Carnet 19",    name: "Fumée de Iris EDP",        tag: "香水",           price: "¥18,000", volume: "50ml",  rating: 4.8, reviews: 421,  editors: true,  note: "Iris · cedar · smoke" },
  { id: "p08", cat: "nail",       brand: "Lune Noire",   name: "Glass Coat Top",           tag: "ネイル",         price: "¥2,400",  volume: "10ml",  rating: 4.4, reviews: 206,  editors: false, note: "Mirror gloss · chip-proof" },
  { id: "p09", cat: "supplement", brand: "Racine",       name: "Beauty Collagen Blend",    tag: "インナー",       price: "¥7,800",  volume: "30包",  rating: 4.6, reviews: 638,  editors: false, note: "Yuzu flavor · 30-day" },
  { id: "p10", cat: "skincare",   brand: "Maison N.",    name: "Clay Minute Mask",         tag: "毛穴",           price: "¥4,200",  volume: "75ml",  rating: 4.5, reviews: 491,  editors: false, note: "60-second detox" },
  { id: "p11", cat: "makeup",     brand: "Rouge Club",   name: "Skin Tint Fluide",         tag: "ベース",         price: "¥6,800",  volume: "30ml",  rating: 4.7, reviews: 1455, editors: true,  note: "14 shades · second-skin" },
  { id: "p12", cat: "fragrance",  brand: "Carnet 19",    name: "Rosée Blanche EDT",        tag: "香水",           price: "¥14,400", volume: "50ml",  rating: 4.6, reviews: 298,  editors: false, note: "Neroli · petitgrain" },
];
