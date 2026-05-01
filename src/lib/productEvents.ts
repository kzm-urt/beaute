"use client";

import { supabase } from "@/lib/supabase";
import { getProductKey } from "@/lib/utils";
import type { Product, ProductEventType } from "@/types";

interface TrackProductEventInput {
  eventType: ProductEventType;
  sourceArea: string;
  product?: Product | null;
  isPro?: boolean;
  metadata?: Record<string, unknown>;
}

export async function trackProductEvent({
  eventType,
  sourceArea,
  product,
  isPro = false,
  metadata,
}: TrackProductEventInput) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const payload = {
      accessToken: session.access_token,
      eventType,
      sourceArea,
      product: product ?? null,
      productKey: product ? getProductKey(product) : null,
      isPro,
      metadata: metadata ?? {},
    };

    await fetch("/api/product-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should never interrupt the shopping/recommendation flow.
  }
}
