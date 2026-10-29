-- Atualização v2 (rode se já executou o schema.sql da versão 1)
alter table public.categories add column if not exists active boolean not null default true;

alter table public.products add column if not exists sale_type text not null default 'unit' check (sale_type in ('unit','kit','other'));
alter table public.products add column if not exists kit_qty int check (kit_qty is null or kit_qty > 0);
alter table public.products add column if not exists sale_note text not null default '';
alter table public.products add column if not exists specs jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists custom_fields jsonb not null default '[]'::jsonb;

-- no máximo 10 fotos por produto; produto ativo precisa de pelo menos 1
alter table public.products drop constraint if exists products_photos_max;
alter table public.products add constraint products_photos_max check (jsonb_array_length(photos) <= 10);

-- categoria com produtos não pode ser excluída
alter table public.products drop constraint if exists products_category_id_fkey;
alter table public.products add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete restrict;
