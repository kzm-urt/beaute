import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(yen: number) {
  return `¥${yen.toLocaleString()}`;
}

export function formatViews(views: string) {
  return `🔥 再生 ${views}回`;
}
