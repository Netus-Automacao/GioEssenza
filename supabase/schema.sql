-- =========================================================
-- Gio Essenza — estrutura do banco (rode 1x no SQL Editor)
-- =========================================================
create extension if not exists pgcrypto;

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  photos jsonb not null default '[]'::jsonb,
  price numeric(10,2) not null default 0 check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  stock_enabled boolean not null default false,
  stock int not null default 0 check (stock >= 0),
  variations jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- leitura pública; escrita só para usuária logada
drop policy if exists "settings read"  on public.settings;
drop policy if exists "settings write" on public.settings;
create policy "settings read"  on public.settings for select using (true);
create policy "settings write" on public.settings for all to authenticated using (true) with check (true);

drop policy if exists "categories read"  on public.categories;
drop policy if exists "categories write" on public.categories;
create policy "categories read"  on public.categories for select using (true);
create policy "categories write" on public.categories for all to authenticated using (true) with check (true);

drop policy if exists "products read"  on public.products;
drop policy if exists "products write" on public.products;
create policy "products read"  on public.products for select using (active or auth.role() = 'authenticated');
create policy "products write" on public.products for all to authenticated using (true) with check (true);

-- armazenamento das imagens
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "images read"   on storage.objects;
drop policy if exists "images insert" on storage.objects;
drop policy if exists "images update" on storage.objects;
drop policy if exists "images delete" on storage.objects;
create policy "images read"   on storage.objects for select using (bucket_id = 'images');
create policy "images insert" on storage.objects for insert to authenticated with check (bucket_id = 'images');
create policy "images update" on storage.objects for update to authenticated using (bucket_id = 'images');
create policy "images delete" on storage.objects for delete to authenticated using (bucket_id = 'images');
