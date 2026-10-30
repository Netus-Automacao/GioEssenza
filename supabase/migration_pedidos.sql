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
