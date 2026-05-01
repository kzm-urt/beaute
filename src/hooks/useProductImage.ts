"use client";
import { useState, useEffect } from "react";

const CACHE_KEY = "beaute_img_cache_v3";
const MAX_CACHE = 200;

function getCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); } catch { return {}; }
}

function setCache(key: string, url: string) {
  try {
    const cache = getCache();
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE) delete cache[keys[0]];
    cache[key] = url;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export function useProductImage(id: number, name: string, brand: string, sub: string, fallback: string) {
  const cacheKey = [id, brand, name, sub].filter(Boolean).join(":");
  const [src, setSrc] = useState<string>(() => {
    if (typeof window === "undefined") return fallback;
    return getCache()[cacheKey] ?? fallback;
  });

  useEffect(() => {
    if (/rakuten\.co\.jp|r10s\.jp/i.test(fallback)) {
      setSrc(fallback);
      setCache(cacheKey, fallback);
      return;
    }

    const cached = getCache()[cacheKey];
    if (cached) { setSrc(cached); return; }

    const params = new URLSearchParams({ name, brand, sub, id: String(id) });
    fetch(`/api/product-image?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.image) {
          setSrc(d.image);
          setCache(cacheKey, d.image);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, fallback]);

  return src;
}
