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
  sub: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  rev: number;
  free: boolean;
  desc: string;
  tags: string[];
  image: string;
  url?: string;
  source?: "rakuten" | "local" | "supabase";
  rank?: number;
  video: { title: string; views: string; url: string };
  note?: string;
}

export interface UserProfile {
  age: string;
  gender: string;
  skinType: string;
  hairType: string;
  concerns: string[];
  currentProducts: string[];
  currentState: string[];
  desiredIngredients: string[];
  habits: string[];
  goals: string[];
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

export interface AnalysisEntry {
  id: string;
  user_id?: string;
  result: AnalyzeResult;
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

export interface ProductSave {
  id: string;
  user_id?: string;
  product_key: string;
  product: Product;
  favorite: boolean;
  compare: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalPreferences {
  positiveSignals: string[];
  negativeSignals: string[];
  topCategories: Category[];
  summary: string;
  logCount: number;
  savedCount: number;
  confidence: number;
}

export type PlanType = "free" | "pro";

export type ProductEventType =
  | "product_view"
  | "locked_product_click"
  | "purchase_click"
  | "upgrade_click";

export interface ProductEvent {
  id: string;
  user_id?: string;
  event_type: ProductEventType;
  source_area: string;
  product_key?: string | null;
  product?: Product | null;
  category?: Category | null;
  brand?: string | null;
  product_name?: string | null;
  is_pro: boolean;
  locked: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}
