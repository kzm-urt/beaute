export type CatKey =
  | "skincare"
  | "haircare"
  | "makeup"
  | "body"
  | "uv"
  | "fragrance"
  | "nail"
  | "supplement";

export interface Product {
  id: string;
  cat: CatKey;
  brand: string;
  name: string;
  tag: string;
  price: string;
  volume: string;
  rating: number;
  reviews: number;
  editors: boolean;
  note: string;
}

export interface CatMeta {
  jp: string;
  en: string;
  color: string;
  accent: string;
  dark: string;
}

export interface UserProfile {
  age: string;
  skinType: string;
  hairType: string;
  concerns: string[];
}

export type PlanType = "free" | "pro";
