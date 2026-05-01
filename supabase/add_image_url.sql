-- products テーブルに画像URL管理カラムを追加
alter table products
  add column if not exists image_url text,
  add column if not exists image_source text,
  add column if not exists image_checked_at timestamptz;
