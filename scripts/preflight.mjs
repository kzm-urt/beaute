import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";

const checks = [];

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
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

async function fetchText(path) {
  const res = await fetch(new URL(path, baseUrl));
  const text = await res.text();
  return { res, text };
}

async function checkSupabaseTable(table, select) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    addCheck(`Supabase ${table} schema`, false, "Supabase env vars missing", false);
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase
    .from(table)
    .select(select, { count: "exact", head: true })
    .limit(1);

  addCheck(
    `Supabase ${table} schema`,
    !error,
    error ? error.message : "table/columns OK"
  );
}

async function run() {
  loadLocalEnv();
  console.log(`beaute preflight: ${baseUrl}`);

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

  await checkSupabaseTable(
    "api_usage_events",
    "id,user_id,provider,endpoint,operation,model,request_count,input_tokens,output_tokens,cost_usd,cost_jpy,metadata,created_at"
  );

  try {
    const { res, text } = await fetchText("/admin/status");
    addCheck("Admin status page", res.ok && text.includes("Launch Status"), `status=${res.status} / bytes=${text.length}`);
  } catch (error) {
    addCheck("Admin status page", false, error.message);
  }

  try {
    const { res, text } = await fetchText("/admin/analytics");
    addCheck("Admin analytics page", res.ok && text.includes("Product Analytics"), `status=${res.status} / bytes=${text.length}`);
  } catch (error) {
    addCheck("Admin analytics page", false, error.message);
  }

  for (const [path, needle] of [
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
    const icon = check.ok ? "OK " : "ERR";
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
