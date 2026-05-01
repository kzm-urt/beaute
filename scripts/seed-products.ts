/**
 * 製品データをSupabaseにシードするスクリプト
 * 実行: npx ts-node -r tsconfig-paths/register scripts/seed-products.ts
 */
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../src/lib/constants";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const rows = PRODUCTS.map((p) => ({
    id:          p.id,
    cat:         p.cat,
    sub:         p.sub,
    name:        p.name,
    brand:       p.brand,
    price:       p.price,
    rating:      p.rating,
    rev:         p.rev,
    free:        p.free,
    description: p.desc,
    tags:        p.tags,
    image:       p.image,
    note:        p.note ?? null,
    video_title: p.video.title,
    video_views: p.video.views,
    video_url:   p.video.url,
  }));

  const { error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("シード失敗:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${rows.length}件の製品データをSupabaseにシードしました`);
}

main();
