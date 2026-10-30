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
  position int not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories(id) on delete restrict,
  description text not null default '',
  photos jsonb not null default '[]'::jsonb check (jsonb_array_length(photos) <= 10),
  price numeric(10,2) not null default 0 check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  stock_enabled boolean not null default false,
  stock int not null default 0 check (stock >= 0),
  variations jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  sale_type text not null default 'unit' check (sale_type in ('unit','kit','other')),
  kit_qty int check (kit_qty is null or kit_qty > 0),
  sale_note text not null default '',
  specs jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '[]'::jsonb,
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
-- Pedidos (rode uma vez no SQL Editor do Supabase)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer text not null check (char_length(customer) between 3 and 120),
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0 check (total >= 0),
  delivery text not null default '',
  payment text not null default '',
  condition text not null default '',
  wanted_date date,
  theme text not null default '',
  doubts text not null default '',
  message text not null default '',
  status text not null default 'novo' check (status in ('novo','aprovado','producao','pronto','entregue','cancelado')),
  notes text not null default ''
);
alter table public.orders enable row level security;

drop policy if exists "orders insert public" on public.orders;
drop policy if exists "orders admin" on public.orders;
-- o cliente só consegue CRIAR pedidos novos; ver/editar/excluir é só para a administradora logada
create policy "orders insert public" on public.orders for insert to anon, authenticated
  with check (status = 'novo' and notes = '');
create policy "orders admin" on public.orders for all to authenticated using (true) with check (true);
