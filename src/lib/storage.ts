// Supabase Storage のパブリックURL を返す
// バケット名: product-images（Supabaseダッシュボードで public に設定すること）
// ファイル名: {productId}.webp

export function getProductImageUrl(productId: number): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/product-images/${productId}.webp`;
}
