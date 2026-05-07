"use client";
import { useState, useEffect } from "react";

const CACHE_KEY = "beaute_img_cache_v3";
const MAX_CACHE = 200;
const DIRECT_IMAGE_RE = /rakuten\.co\.jp|r10s\.jp/i;
let memoryCache: Record<string, string> | null = null;

function getCache(): Record<string, string> {
  if (memoryCache) return memoryCache;
  try {
    memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    memoryCache = {};
  }
  const cache = memoryCache ?? {};
  memoryCache = cache;
  return cache;
}

function readCache(key: string) {
  if (typeof window === "undefined") return undefined;
  return getCache()[key];
}

function setCache(key: string, url: string) {
  try {
    const cache = getCache();
    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE) delete cache[keys[0]];
    cache[key] = url;
    const write = () => localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(write, { timeout: 2000 });
    } else {
      globalThis.setTimeout(write, 0);
    }
  } catch { /* ignore */ }
}

export function useProductImage(id: number, name: string, brand: string, sub: string, fallback: string) {
  const cacheKey = [id, brand, name, sub].filter(Boolean).join(":");
  const directImage = DIRECT_IMAGE_RE.test(fallback);
  const [src, setSrc] = useState<string>(() => {
    if (typeof window === "undefined" || directImage) return fallback;
    return readCache(cacheKey) ?? fallback;
  });

  useEffect(() => {
    if (directImage) {
      setSrc(fallback);
      return;
    }

    const cached = readCache(cacheKey);
    if (cached) { setSrc(cached); return; }

    const controller = new AbortController();
    const params = new URLSearchParams({ name, brand, sub, id: String(id) });
    fetch(`/api/product-image?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.image) {
          setSrc(d.image);
          setCache(cacheKey, d.image);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, directImage, fallback]);

  return src;
}
