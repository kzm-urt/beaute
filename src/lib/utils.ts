import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(yen: number) {
  return `¥${yen.toLocaleString()}`;
}

export function formatViews(views: string) {
  return `🔥 再生 ${views}回`;
}

// 楽天アフィリエイトリンクを生成
export function toRakutenAffiliateUrl(productName: string, brandName: string): string {
  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  const keyword = encodeURIComponent(`${brandName} ${productName}`);
  const rakutenUrl = `https://search.rakuten.co.jp/search/mall/${keyword}/`;
  if (!affiliateId) return rakutenUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(rakutenUrl)}`;
}

export function getProductKey(product: Pick<Product, "id" | "source" | "url" | "name" | "brand">) {
  if (product.url) return product.url;
  return `${product.source ?? "product"}:${product.id}:${product.brand}:${product.name}`;
}
