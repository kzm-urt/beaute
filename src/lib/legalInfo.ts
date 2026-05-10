import { PLAN_RULES } from "@/lib/plan";

export const DEFAULT_SUPPORT_EMAIL = "computerschool.irise@gmail.com";

function firstConfiguredEmail() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  if (supportEmail) return supportEmail;

  return DEFAULT_SUPPORT_EMAIL;
}

export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "https://beaute-xi.vercel.app";

export const LEGAL_INFO = {
  serviceName: "beautia",
  operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "iRise",
  representativeName:
    process.env.LEGAL_REPRESENTATIVE_NAME?.trim() || "請求があった場合、遅滞なく開示します。",
  address: process.env.LEGAL_ADDRESS?.trim() || "請求があった場合、遅滞なく開示します。",
  phone: process.env.LEGAL_PHONE?.trim() || "請求があった場合、遅滞なく開示します。",
  supportEmail: firstConfiguredEmail(),
  siteUrl: PUBLIC_SITE_URL,
  proPrice: PLAN_RULES.pro.priceLabel,
  proTrialDays: PLAN_RULES.pro.trialDays,
  lastUpdated: "2026年5月10日",
};
