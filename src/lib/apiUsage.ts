import { createAdminClient } from "@/lib/supabase";

export interface ApiUsageLogInput {
  userId?: string | null;
  provider: "anthropic" | "rakuten" | "youtube" | "app";
  endpoint: string;
  operation: string;
  model?: string | null;
  requestCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  costJpy?: number;
  metadata?: Record<string, unknown>;
}

export async function logApiUsage({
  userId = null,
  provider,
  endpoint,
  operation,
  model = null,
  requestCount = 1,
  inputTokens = 0,
  outputTokens = 0,
  costUsd = 0,
  costJpy = 0,
  metadata = {},
}: ApiUsageLogInput) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("api_usage_events").insert({
      user_id: userId,
      provider,
      endpoint: endpoint.slice(0, 120),
      operation: operation.slice(0, 120),
      model: model?.slice(0, 120) ?? null,
      request_count: Math.max(1, Math.round(requestCount)),
      input_tokens: Math.max(0, Math.round(inputTokens)),
      output_tokens: Math.max(0, Math.round(outputTokens)),
      cost_usd: costUsd,
      cost_jpy: costJpy,
      metadata,
    });
  } catch (error) {
    console.warn("api_usage_events insert skipped", error);
  }
}
