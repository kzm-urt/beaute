-- ============================================================
-- beauté — Supabase スキーマ定義
-- Supabase ダッシュボード > SQL Editor で実行する
-- ============================================================

-- ── プロフィール ──────────────────────────────────────────────
create table if not exists profiles (
    id                uuid references auth.users on delete cascade primary key,
    age               text,
    gender            text,
    skin_type         text,
    hair_type         text,
    concerns          text[],
    current_products  text[],
    current_state     text[],
    desired_ingredients text[],
    beauty_habits     text[],
    beauty_goals      text[],
    is_pro            boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  stripe_current_period_end timestamptz,
  stripe_cancel_at_period_end boolean default false,
  updated_at        timestamptz default now()
);

alter table profiles add column if not exists stripe_subscription_id text;
alter table profiles add column if not exists age text;
alter table profiles add column if not exists gender text;
alter table profiles add column if not exists skin_type text;
alter table profiles add column if not exists hair_type text;
alter table profiles add column if not exists concerns text[];
alter table profiles add column if not exists current_products text[];
alter table profiles add column if not exists current_state text[];
alter table profiles add column if not exists desired_ingredients text[];
alter table profiles add column if not exists beauty_habits text[];
alter table profiles add column if not exists beauty_goals text[];
alter table profiles add column if not exists is_pro boolean default false;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_status text;
alter table profiles add column if not exists stripe_current_period_end timestamptz;
alter table profiles add column if not exists stripe_cancel_at_period_end boolean default false;
alter table profiles add column if not exists updated_at timestamptz default now();

alter table profiles enable row level security;

-- 本人のみ参照・更新可能
drop policy if exists "自分のプロフィールを参照" on profiles;
create policy "自分のプロフィールを参照" on profiles
  for select using (auth.uid() = id);

drop policy if exists "自分のプロフィールを更新" on profiles;
create policy "自分のプロフィールを更新" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "自分のプロフィールを変更" on profiles;
create policy "自分のプロフィールを変更" on profiles
  for update using (auth.uid() = id);

-- サインアップ時に自動でプロフィール行を作成するトリガー
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 使用ログ ──────────────────────────────────────────────────
create table if not exists log_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  product_name text not null,
  category     text not null,
  rating       int check (rating between 1 and 5),
  memo         text,
  started_at   date,
  created_at   timestamptz default now()
);

alter table log_entries add column if not exists user_id uuid references auth.users on delete cascade;
alter table log_entries add column if not exists product_name text;
alter table log_entries add column if not exists category text;
alter table log_entries add column if not exists rating int check (rating between 1 and 5);
alter table log_entries add column if not exists memo text;
alter table log_entries add column if not exists started_at date;
alter table log_entries add column if not exists created_at timestamptz default now();

alter table log_entries enable row level security;

drop policy if exists "自分のログを参照" on log_entries;
create policy "自分のログを参照" on log_entries
  for select using (auth.uid() = user_id);

-- ログ追加は /api/log-entries 経由。
-- 無料プラン上限（10件）をサーバー側で検証するため、クライアントからの直接insertは許可しない。

drop policy if exists "自分のログを削除" on log_entries;
create policy "自分のログを削除" on log_entries
  for delete using (auth.uid() = user_id);


-- ── 成分解析の使用回数（月別） ────────────────────────────────
create table if not exists analyze_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  year_month text not null,  -- "2025-04" 形式
  count      int default 1,
  unique(user_id, year_month)
);

alter table analyze_usage add column if not exists user_id uuid references auth.users on delete cascade;
alter table analyze_usage add column if not exists year_month text;
alter table analyze_usage add column if not exists count int default 1;

create unique index if not exists analyze_usage_user_year_month_key
  on analyze_usage (user_id, year_month);

alter table analyze_usage enable row level security;

drop policy if exists "自分の使用回数を参照" on analyze_usage;
create policy "自分の使用回数を参照" on analyze_usage
  for select using (auth.uid() = user_id);

-- analyze_usage の追加・更新は /api/analyze 経由。
-- 無料プラン上限（月3回）をサーバー側で検証するため、クライアントからの直接変更は許可しない。


-- ── 成分解析履歴 ──────────────────────────────────────────────
create table if not exists analysis_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  result     jsonb not null,
  created_at timestamptz default now()
);

alter table analysis_entries add column if not exists user_id uuid references auth.users on delete cascade;
alter table analysis_entries add column if not exists result jsonb;
alter table analysis_entries add column if not exists created_at timestamptz default now();

alter table analysis_entries enable row level security;

drop policy if exists "自分の解析履歴を参照" on analysis_entries;
create policy "自分の解析履歴を参照" on analysis_entries
  for select using (auth.uid() = user_id);

drop policy if exists "自分の解析履歴を削除" on analysis_entries;
create policy "自分の解析履歴を削除" on analysis_entries
  for delete using (auth.uid() = user_id);

-- 解析履歴の追加は /api/analysis-entries 経由。
-- 保存件数上限（最大50件）をサーバー側で整理するため、クライアントからの直接insertは許可しない。


-- ── 商品のお気に入り・比較リスト ──────────────────────────────
create table if not exists product_saves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  product_key text not null,
  product     jsonb not null,
  favorite    boolean default false,
  compare     boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, product_key)
);

alter table product_saves add column if not exists user_id uuid references auth.users on delete cascade;
alter table product_saves add column if not exists product_key text;
alter table product_saves add column if not exists product jsonb;
alter table product_saves add column if not exists favorite boolean default false;
alter table product_saves add column if not exists compare boolean default false;
alter table product_saves add column if not exists created_at timestamptz default now();
alter table product_saves add column if not exists updated_at timestamptz default now();

create unique index if not exists product_saves_user_product_key_key
  on product_saves (user_id, product_key);

alter table product_saves enable row level security;

drop policy if exists "自分の保存商品を参照" on product_saves;
create policy "自分の保存商品を参照" on product_saves
  for select using (auth.uid() = user_id);

drop policy if exists "自分の保存商品を削除" on product_saves;
create policy "自分の保存商品を削除" on product_saves
  for delete using (auth.uid() = user_id);

-- product_saves の追加・更新は /api/product-saves 経由。
-- 無料/PROの保存上限をサーバー側で検証するため、クライアントからの直接変更は許可しない。


-- ── 商品イベント計測 ──────────────────────────────────────────
create table if not exists product_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  event_type   text not null check (
    event_type in ('product_view', 'locked_product_click', 'purchase_click', 'upgrade_click')
  ),
  source_area  text,
  product_key  text,
  product      jsonb,
  category     text,
  brand        text,
  product_name text,
  is_pro       boolean default false,
  locked       boolean default false,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

alter table product_events add column if not exists source_area text;
alter table product_events add column if not exists product_key text;
alter table product_events add column if not exists product jsonb;
alter table product_events add column if not exists category text;
alter table product_events add column if not exists brand text;
alter table product_events add column if not exists product_name text;
alter table product_events add column if not exists is_pro boolean default false;
alter table product_events add column if not exists locked boolean default false;
alter table product_events add column if not exists metadata jsonb default '{}'::jsonb;
alter table product_events add column if not exists created_at timestamptz default now();

create index if not exists product_events_created_at_idx on product_events (created_at desc);
create index if not exists product_events_event_type_idx on product_events (event_type);
create index if not exists product_events_category_idx on product_events (category);
create index if not exists product_events_product_key_idx on product_events (product_key);
create index if not exists product_events_user_id_idx on product_events (user_id);

alter table product_events enable row level security;

drop policy if exists "自分の商品イベントを参照" on product_events;
create policy "自分の商品イベントを参照" on product_events
  for select using (auth.uid() = user_id);

-- 商品イベントの追加は /api/product-events 経由。
-- 管理者向け集計も service role を使うため、クライアントからの直接insertは許可しない。


-- ── API費用ログ ──────────────────────────────────────────────
create table if not exists api_usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete set null,
  provider      text not null,
  endpoint      text,
  operation     text,
  model         text,
  request_count int default 1,
  input_tokens  int default 0,
  output_tokens int default 0,
  cost_usd      numeric(12, 6) default 0,
  cost_jpy      numeric(12, 2) default 0,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz default now()
);

alter table api_usage_events add column if not exists user_id uuid references auth.users on delete set null;
alter table api_usage_events add column if not exists provider text;
alter table api_usage_events add column if not exists endpoint text;
alter table api_usage_events add column if not exists operation text;
alter table api_usage_events add column if not exists model text;
alter table api_usage_events add column if not exists request_count int default 1;
alter table api_usage_events add column if not exists input_tokens int default 0;
alter table api_usage_events add column if not exists output_tokens int default 0;
alter table api_usage_events add column if not exists cost_usd numeric(12, 6) default 0;
alter table api_usage_events add column if not exists cost_jpy numeric(12, 2) default 0;
alter table api_usage_events add column if not exists metadata jsonb default '{}'::jsonb;
alter table api_usage_events add column if not exists created_at timestamptz default now();

create index if not exists api_usage_events_created_at_idx on api_usage_events (created_at desc);
create index if not exists api_usage_events_provider_idx on api_usage_events (provider);
create index if not exists api_usage_events_operation_idx on api_usage_events (operation);
create index if not exists api_usage_events_user_id_idx on api_usage_events (user_id);

alter table api_usage_events enable row level security;

-- API費用ログは /api/analyze、/api/products、/api/youtube 経由でservice roleが保存する。
-- 管理者向け集計も service role を使うため、クライアントからの直接insert/selectは許可しない。

-- ── ベータテスト感想アンケート ─────────────────────────────────────
create table if not exists beta_feedback (
  id                    uuid primary key default gen_random_uuid(),
  tester_name           text,
  contact               text,
  relation              text,
  device                text,
  overall_rating        int check (overall_rating between 1 and 5),
  clarity_rating        int check (clarity_rating between 1 and 5),
  recommendation_rating int check (recommendation_rating between 1 and 5),
  design_rating         int check (design_rating between 1 and 5),
  paid_value_rating     int check (paid_value_rating between 1 and 5),
  liked_features        text[] default '{}',
  confusing_parts       text[] default '{}',
  would_pay             text,
  expected_price        text,
  most_valuable         text,
  missing_feature       text,
  mobile_issue          text,
  referral_idea         text,
  free_comment          text,
  permission_to_quote   boolean default false,
  metadata              jsonb default '{}'::jsonb,
  created_at            timestamptz default now()
);

alter table beta_feedback add column if not exists tester_name text;
alter table beta_feedback add column if not exists contact text;
alter table beta_feedback add column if not exists relation text;
alter table beta_feedback add column if not exists device text;
alter table beta_feedback add column if not exists overall_rating int check (overall_rating between 1 and 5);
alter table beta_feedback add column if not exists clarity_rating int check (clarity_rating between 1 and 5);
alter table beta_feedback add column if not exists recommendation_rating int check (recommendation_rating between 1 and 5);
alter table beta_feedback add column if not exists design_rating int check (design_rating between 1 and 5);
alter table beta_feedback add column if not exists paid_value_rating int check (paid_value_rating between 1 and 5);
alter table beta_feedback add column if not exists liked_features text[] default '{}';
alter table beta_feedback add column if not exists confusing_parts text[] default '{}';
alter table beta_feedback add column if not exists would_pay text;
alter table beta_feedback add column if not exists expected_price text;
alter table beta_feedback add column if not exists most_valuable text;
alter table beta_feedback add column if not exists missing_feature text;
alter table beta_feedback add column if not exists mobile_issue text;
alter table beta_feedback add column if not exists referral_idea text;
alter table beta_feedback add column if not exists free_comment text;
alter table beta_feedback add column if not exists permission_to_quote boolean default false;
alter table beta_feedback add column if not exists metadata jsonb default '{}'::jsonb;
alter table beta_feedback add column if not exists created_at timestamptz default now();

create index if not exists beta_feedback_created_at_idx on beta_feedback (created_at desc);
create index if not exists beta_feedback_device_idx on beta_feedback (device);
create index if not exists beta_feedback_would_pay_idx on beta_feedback (would_pay);

alter table beta_feedback enable row level security;

-- 回答の追加・管理者向け閲覧は /api/feedback 経由。
-- service roleを使うため、クライアントからの直接insert/selectは許可しない。
