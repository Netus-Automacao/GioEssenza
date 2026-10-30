-- Adiciona o WhatsApp do cliente nos pedidos (rode uma vez no SQL Editor)
alter table public.orders add column if not exists phone text not null default '';
