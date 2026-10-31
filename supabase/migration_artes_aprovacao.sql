-- Aprovação manual de cada arte (rode uma vez no SQL Editor)
alter table public.art_items add column if not exists published boolean not null default false;
-- artes que já existiam continuam no catálogo
update public.art_items set published = true where created_at < now();
drop policy if exists "art items read" on public.art_items;
create policy "art items read" on public.art_items for select using (
  auth.role() = 'authenticated' or (published and exists (select 1 from public.art_galleries g where g.id = gallery_id and g.published)));
