-- ARTES DISPONÍVEIS — rode uma vez no Supabase → SQL Editor (não altera nada que já existe)
create table if not exists public.art_galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  note text not null default '',
  mockup text not null default '',
  published boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.art_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.art_galleries(id) on delete cascade,
  original text not null,
  mockup text not null default '',
  thumb text not null default '',
  adjust jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists art_items_gallery_pos on public.art_items (gallery_id, position);

alter table public.art_galleries enable row level security;
alter table public.art_items enable row level security;

drop policy if exists "art galleries read" on public.art_galleries;
drop policy if exists "art galleries write" on public.art_galleries;
create policy "art galleries read" on public.art_galleries for select using (published or auth.role() = 'authenticated');
create policy "art galleries write" on public.art_galleries for all to authenticated using (true) with check (true);

drop policy if exists "art items read" on public.art_items;
drop policy if exists "art items write" on public.art_items;
create policy "art items read" on public.art_items for select using (
  auth.role() = 'authenticated' or exists (select 1 from public.art_galleries g where g.id = gallery_id and g.published));
create policy "art items write" on public.art_items for all to authenticated using (true) with check (true);
