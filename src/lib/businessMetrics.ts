import type { Product } from "@/types";

const DEFAULT_USD_JPY_RATE = 155;
const DEFAULT_ANTHROPIC_INPUT_USD_PER_MTOK = 5;
const DEFAULT_ANTHROPIC_OUTPUT_USD_PER_MTOK = 25;
const DEFAULT_RAKUTEN_COMMISSION_RATE = 0.04;
const DEFAULT_RAKUTEN_REWARD_CAP_JPY = 1000;

function envNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getUsdJpyRate() {
  return envNumber("API_COST_USD_JPY_RATE", DEFAULT_USD_JPY_RATE);
}

export function getAnthropicPricing() {
  return {
    inputUsdPerMTok: envNumber(
      "ANTHROPIC_INPUT_USD_PER_MTOK",
      DEFAULT_ANTHROPIC_INPUT_USD_PER_MTOK
    ),
    outputUsdPerMTok: envNumber(
      "ANTHROPIC_OUTPUT_USD_PER_MTOK",
      DEFAULT_ANTHROPIC_OUTPUT_USD_PER_MTOK
    ),
  };
}

export function estimateAnthropicCost({
  inputTokens,
  outputTokens,
}: {
  inputTokens: number;
  outputTokens: number;
}) {
  const pricing = getAnthropicPricing();
  const costUsd =
    (Math.max(inputTokens, 0) / 1_000_000) * pricing.inputUsdPerMTok +
    (Math.max(outputTokens, 0) / 1_000_000) * pricing.outputUsdPerMTok;

  return {
    costUsd: roundMoney(costUsd, 6),
    costJpy: Math.round(costUsd * getUsdJpyRate()),
    ...pricing,
    usdJpyRate: getUsdJpyRate(),
  };
}

export function getRakutenCommissionConfig() {
  return {
    rate: envNumber("RAKUTEN_AFFILIATE_RATE", DEFAULT_RAKUTEN_COMMISSION_RATE),
    capJpy: envNumber("RAKUTEN_AFFILIATE_REWARD_CAP_JPY", DEFAULT_RAKUTEN_REWARD_CAP_JPY),
  };
}

export function estimateRakutenReward(priceJpy: number) {
  const { rate, capJpy } = getRakutenCommissionConfig();
  if (!Number.isFinite(priceJpy) || priceJpy <= 0) return 0;
  return Math.min(Math.round(priceJpy * rate), capJpy);
}

export function getProductPrice(product: Product | null | undefined) {
  const price = Number(product?.price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function roundMoney(value: number, digits: number) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
