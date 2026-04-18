export type CatKey =
  | "skincare"
  | "haircare"
  | "makeup"
  | "body"
  | "uv"
  | "fragrance"
  | "nail"
  | "supplement";

export type Category =
  | "スキンケア"
  | "ヘアケア"
  | "メイク"
  | "ボディ"
  | "UVケア"
  | "フレグランス"
  | "ネイル"
  | "サプリ";

export interface Product {
  id: number;
  cat: Category;
  catKey?: CatKey;
  sub: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  rev: number;
  free: boolean;
  desc: string;
  tags: string[];
  editors?: boolean;
  volume?: string;
  video: { title: string; views: string; url: string };
}

export interface UserProfile {
  age: string;
  skinType: string;
  hairType: string;
  concerns: string[];
}

export interface LogEntry {
  id: string;
  user_id: string;
  product_name: string;
  category: Category;
  rating: number;
  memo: string;
  started_at: string;
  created_at: string;
}

export interface AnalyzeResult {
  productType: string;
  highlight: string[];
  caution: string[];
  skinTypes: string[];
  avoid: string[];
  overallScore: number;
  verdict: string;
  keyIngredient: string;
}

export type PlanType = "free" | "pro";

export interface Subscription {
  plan: PlanType;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}
