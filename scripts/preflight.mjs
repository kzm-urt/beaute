import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";

const checks = [];

function loadEnvFile(path, { override = false, onlyKeys = null } = {}) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    if (onlyKeys && !onlyKeys.includes(key)) continue;
    const rawValue = trimmed.slice(index + 1).trim();
    if (process.env[key] && !override) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function loadLocalEnv() {
  loadEnvFile(".env.local");
  loadEnvFile(".admin-basic-login.txt", {
    override: false,
    onlyKeys: ["ADMIN_BASIC_USER", "ADMIN_BASIC_PASSWORD"],
  });
}

function addCheck(name, ok, detail, required = true) {
  checks.push({ name, ok, detail, required });
}

async function fetchJson(path, options = {}) {
  const res = await fetch(new URL(path, baseUrl), options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { res, data };
}

function getBasicAuthHeaders() {
  const user = process.env.ADMIN_BASIC_USER;
  const password = process.env.ADMIN_BASIC_PASSWORD;
  if (!user || !password) return {};
  const token = Buffer.from(`${user}:${password}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

function hasBasicAuthCredentials() {
  return Boolean(process.env.ADMIN_BASIC_USER && process.env.ADMIN_BASIC_PASSWORD);
}

async function fetchText(path, options = {}) {
  const res = await fetch(new URL(path, baseUrl), options);
  const text = await res.text();
  return { res, text };
}

async function checkAdminPage(path, label, needle, options) {
  try {
    const { res, text } = await fetchText(path, options);
    const hasCredentials = hasBasicAuthCredentials();
    const ok = hasCredentials ? res.ok && text.includes(needle) : res.status === 401;
    const mode = hasCredentials ? "authenticated" : "auth guard";
    const expected = hasCredentials ? needle : "401 Basic auth";
    addCheck(label, ok, `${mode} / status=${res.status} / bytes=${text.length} / expected=${expected}`);
  } catch (error) {
    addCheck(label, false, error.message);
  }
}

async function checkSupabaseTable(table, select, required = true) {
  const result = await probeSupabaseTable(table, select);
  addCheck(
    `Supabase ${table} schema`,
    result.ok,
    result.detail,
    required
  );
  return result;
}

async function probeSupabaseTable(table, select) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, detail: "Supabase env vars missing" };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase
    .from(table)
    .select(select, { count: "exact" })
    .limit(1);

  return {
    ok: !error,
    detail: error ? error.message : "table/columns OK",
  };
}

async function checkFeedbackStorage() {
  const feedback = await probeSupabaseTable(
    "beta_feedback",
    "id,tester_name,contact,relation,device,overall_rating,clarity_rating,recommendation_rating,design_rating,paid_value_rating,liked_features,confusing_parts,would_pay,expected_price,most_valuable,missing_feature,mobile_issue,referral_idea,free_comment,permission_to_quote,metadata,created_at"
  );

  if (feedback.ok) {
    addCheck("Feedback storage", true, "beta_feedback table/columns OK");
    return;
  }

  const fallback = await probeSupabaseTable(
    "api_usage_events",
    "id,provider,endpoint,operation,request_count,input_tokens,output_tokens,cost_usd,cost_jpy,metadata,created_at"
  );
  addCheck(
    "Feedback storage",
    fallback.ok,
    fallback.ok
      ? `api_usage_events fallback active / beta_feedback pending: ${feedback.detail}`
      : `beta_feedback missing and fallback unavailable: ${feedback.detail} / ${fallback.detail}`
  );
}

async function run() {
  loadLocalEnv();
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || baseUrl;
  console.log(`beautia preflight: ${baseUrl}`);
  const adminRequestOptions = { headers: getBasicAuthHeaders() };

  try {
    const { res, data } = await fetchJson("/api/products?limit=30");
    const products = Array.isArray(data?.products) ? data.products : [];
    const freeCount = products.filter((product) => product.free).length;
    const proCount = products.filter((product) => !product.free).length;
    addCheck(
      "Rakuten search products",
      res.ok && products.length > 0,
      `${res.status} / products=${products.length} / source=${data?.source ?? "unknown"} / free=${freeCount} / pro=${proCount}`
    );
  } catch (error) {
    addCheck("Rakuten search products", false, error.message);
  }

  try {
    const { res, data } = await fetchJson("/api/products?mode=ranking&page=1");
    const products = Array.isArray(data?.products) ? data.products : [];
    addCheck(
      "Rakuten ranking products",
      res.ok && products.length > 0 && products[0]?.rank === 1,
      `${res.status} / products=${products.length} / firstRank=${products[0]?.rank ?? "none"}`
    );
  } catch (error) {
    addCheck("Rakuten ranking products", false, error.message);
  }

  try {
    const { res } = await fetchJson("/api/product-events");
    addCheck("Product events auth guard", res.status === 401, `status=${res.status}`);
  } catch (error) {
    addCheck("Product events auth guard", false, error.message);
  }

  try {
    const { res } = await fetchJson("/api/system-status");
    addCheck("System status auth guard", res.status === 401, `status=${res.status}`);
  } catch (error) {
    addCheck("System status auth guard", false, error.message);
  }

  try {
    const { res } = await fetchJson("/api/feedback");
    addCheck("Feedback admin auth guard", res.status === 401, `status=${res.status}`);
  } catch (error) {
    addCheck("Feedback admin auth guard", false, error.message);
  }

  await checkSupabaseTable(
    "api_usage_events",
    "id,user_id,provider,endpoint,operation,model,request_count,input_tokens,output_tokens,cost_usd,cost_jpy,metadata,created_at"
  );

  await checkFeedbackStorage();

  await checkAdminPage("/admin/status", "Admin status page", "Launch Status", adminRequestOptions);
  await checkAdminPage("/admin/analytics", "Admin analytics page", "Product Analytics", adminRequestOptions);
  await checkAdminPage("/admin/feedback", "Admin feedback page", "Feedback Inbox", adminRequestOptions);

  for (const [path, needle] of [
    ["/feedback", "BETA TEST FEEDBACK"],
    ["/terms", "利用規約"],
    ["/privacy", "プライバシーポリシー"],
    ["/commercial", "特定商取引法"],
    ["/robots.txt", "Sitemap"],
    ["/sitemap.xml", "<urlset"],
  ]) {
    try {
      const { res, text } = await fetchText(path);
      addCheck(`Public route ${path}`, res.ok && text.includes(needle), `status=${res.status} / bytes=${text.length}`);
    } catch (error) {
      addCheck(`Public route ${path}`, false, error.message);
    }
  }

  const failures = checks.filter((check) => check.required && !check.ok);
  for (const check of checks) {
    const icon = check.ok ? "OK " : check.required ? "ERR" : "WARN";
    console.log(`${icon} ${check.name}: ${check.detail}`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} required preflight check(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll required preflight checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
