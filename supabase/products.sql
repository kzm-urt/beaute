-- Supabase ダッシュボード > SQL Editor で実行する

create table if not exists products (
  id          int primary key,
  cat         text not null,
  sub         text not null,
  name        text not null,
  brand       text not null,
  price       int not null,
  rating      numeric(3,1) not null,
  rev         int not null,
  free        boolean default true,
  description text,
  tags        text[],
  image       text,
  note        text,
  video_title text,
  video_views text,
  video_url   text,
  created_at  timestamptz default now()
);

-- 全ユーザーが読み取り可能（認証不要）
alter table products enable row level security;
create policy "誰でも参照可" on products for select using (true);
