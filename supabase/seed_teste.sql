-- Produtos de TESTE (seções 37 e 38). Entram inativos e com preço zero:
-- servem só para validar o sistema. Exclua-os depois dos testes.
insert into public.categories (id, name, position) values
 ('00000000-0000-4000-8000-0000000000a1', 'Agendas (teste)', 90),
 ('00000000-0000-4000-8000-0000000000a2', 'Fotografias (teste)', 91)
on conflict (id) do nothing;

insert into public.products (name, category_id, description, price, active, sale_type, specs, custom_fields) values
('Agenda personalizada (TESTE)', '00000000-0000-4000-8000-0000000000a1', 'Produto de teste.', 0, false, 'unit',
 '{"miolo":{"uses":true,"tipo":"Offset","gramatura":"75"},"capa":{"uses":true,"tipo":"Fotográfico Gloss","gramatura":"130","aplicacao":"adesivo"},"estrutura":"Capa dura","encadernacao":{"tipo":"Wire-O","cor":"branco"},"acessorios":["Bolso plástico","Elástico"],"laminacao":{"has":"nao"},"arte":{"tipo":"inclusa","alteracoes":"2"}}',
 '[{"label":"Nome para a capa","instruction":"Digite o nome que deverá aparecer na capa.","required":true,"max":"30","suggestions":"","allow_free":true}]'),
('Kit de fotos personalizadas (TESTE)', '00000000-0000-4000-8000-0000000000a2', 'Produto de teste.', 0, false, 'kit',
 '{"principal":{"tipo":"Papel fotográfico"},"miolo":{"uses":false},"capa":{"uses":false},"laminacao":{"has":"nao"}}',
 '[{"label":"Frase","instruction":"Escreva a frase das fotos.","required":true,"max":"60","suggestions":"Feliz aniversário!\nTe amo!\nMelhores amigas","allow_free":true}]');
update public.products set kit_qty = 10 where name = 'Kit de fotos personalizadas (TESTE)';
