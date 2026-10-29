-- Dados iniciais (rode depois do schema.sql)
insert into public.settings (id, data) values (1, '{"active": true, "name": "Gio Essenza", "slogan": "Papelaria com Significado", "whatsapp": "5541987152125", "whatsapp_enabled": true, "description": "Agendas, cadernetas, planners e cadernos encadernados com capa personalizada no tema que você escolher. Faça seu pedido com antecedência pelo WhatsApp. Pode haver variações de cor em relação à tela do celular ou monitor.", "logo": "", "public_url": "", "banner": {"enabled": true, "type": "color", "color": "#55663C", "image": "", "title": "Ideias que ganham forma, momentos com mais significado.", "subtitle": "Encomendas de produtos personalizados"}, "colors": {"primary": "#55663C", "accent": "#A9B98C", "background": "#FBF7F0", "text": "#3D4A2A"}, "hours": {"show": true, "days": [{"open": false, "start": "09:00", "end": "19:00"}, {"open": true, "start": "09:00", "end": "19:00"}, {"open": true, "start": "09:00", "end": "19:00"}, {"open": true, "start": "09:00", "end": "19:00"}, {"open": true, "start": "09:00", "end": "19:00"}, {"open": true, "start": "09:00", "end": "19:00"}, {"open": false, "start": "09:00", "end": "19:00"}]}, "delivery": {"app": true, "pickup": true, "pickup_note": "Retiradas de segunda a sexta, das 15h às 19h, mediante agendamento prévio."}}'::jsonb) on conflict (id) do update set data = excluded.data;
insert into public.categories (id, name, position) values ('00000000-0000-4000-8000-000000000001', 'Agendas e planners', 0) on conflict (id) do nothing;
insert into public.categories (id, name, position) values ('00000000-0000-4000-8000-000000000002', 'Cadernetas', 1) on conflict (id) do nothing;
insert into public.categories (id, name, position) values ('00000000-0000-4000-8000-000000000003', 'Cadernos e blocos', 2) on conflict (id) do nothing;
insert into public.categories (id, name, position) values ('00000000-0000-4000-8000-000000000004', 'Controles', 3) on conflict (id) do nothing;
insert into public.categories (id, name, position) values ('00000000-0000-4000-8000-000000000005', 'Devocionais', 4) on conflict (id) do nothing;
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Agenda adulto ou escolar', '00000000-0000-4000-8000-000000000001', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, true, '[{"name": "Miolo", "values": [{"label": "Dois dias por página (~220 páginas)", "price": 87, "stock": "", "photo": "", "available": true}, {"label": "Um dia por página (~400 páginas)", "price": 105, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 0);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Agenda infantil / creche', '00000000-0000-4000-8000-000000000001', 'Um dia por página — 280 páginas
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 89, false, '[]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 1);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Planner horizontal ou vertical', '00000000-0000-4000-8000-000000000001', '210 páginas
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, true, '[{"name": "Formato", "values": [{"label": "Horizontal", "price": "", "stock": "", "photo": "", "available": true}, {"label": "Vertical", "price": "", "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 2);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Caderneta da gestante', '00000000-0000-4000-8000-000000000002', '60 páginas
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 120g
Arte inclusa (até 2 alterações)', 62, false, '[]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 3);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Caderneta de vacinação infantil', '00000000-0000-4000-8000-000000000002', '112 páginas
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 120g
Arte inclusa (até 2 alterações)
Para reforma, o miolo deve estar preservado.', 65, true, '[{"name": "Tipo", "values": [{"label": "Caderneta nova", "price": 65, "stock": "", "photo": "", "available": true}, {"label": "Reforma da antiga", "price": 69, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 4);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Caderneta de saúde para pets', '00000000-0000-4000-8000-000000000002', '160 páginas
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Acompanha uma foto do seu pet.', 72, false, '[]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 5);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Caderno pautado ou de pedidos', '00000000-0000-4000-8000-000000000003', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 85, false, '[{"name": "Modelo", "values": [{"label": "Caderno pautado (200 páginas)", "price": 85, "stock": "", "photo": "", "available": true}, {"label": "Caderno de pedidos (240 páginas)", "price": 88, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 6);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Bloco de anotações grande', '00000000-0000-4000-8000-000000000003', '80 páginas
Tamanho 14 cm de altura x 10 cm de largura
Capa dura personalizada com a arte desejada
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Miolo impresso é apenas frente
Arte inclusa (até 2 alterações)', 27, false, '[{"name": "Miolo", "values": [{"label": "Em branco", "price": 27, "stock": "", "photo": "", "available": true}, {"label": "Impresso", "price": 32, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 7);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Livro de receitas', '00000000-0000-4000-8000-000000000003', '160 páginas — miolo padrão
Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)', 72, false, '[]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 8);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Controle de agendamentos ou procedimentos', '00000000-0000-4000-8000-000000000004', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, false, '[{"name": "Páginas", "values": [{"label": "200 páginas", "price": 87, "stock": "", "photo": "", "available": true}, {"label": "400 páginas", "price": 105, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 9);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Controle de glicemia', '00000000-0000-4000-8000-000000000004', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, false, '[{"name": "Páginas", "values": [{"label": "200 páginas", "price": 87, "stock": "", "photo": "", "available": true}, {"label": "400 páginas", "price": 105, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 10);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Controle financeiro', '00000000-0000-4000-8000-000000000004', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, false, '[{"name": "Páginas", "values": [{"label": "200 páginas", "price": 87, "stock": "", "photo": "", "available": true}, {"label": "400 páginas", "price": 105, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 11);
insert into public.products (name, category_id, description, price, featured, variations, options, position) values ('Devocional católico ou evangélico', '00000000-0000-4000-8000-000000000005', 'Tamanho A5 (21 x 15 cm)
Capa dura
Com bolsinho plástico
Capa personalizada no tema desejado
Espiral wire-o branco
Acabamento em elástico
Folhas em papel offset 75g
Arte inclusa (até 2 alterações)
Consulte as opções de miolos disponíveis.', 87, false, '[{"name": "Linha", "values": [{"label": "Católico", "price": "", "stock": "", "photo": "", "available": true}, {"label": "Evangélico", "price": "", "stock": "", "photo": "", "available": true}]}, {"name": "Páginas", "values": [{"label": "200 páginas", "price": 87, "stock": "", "photo": "", "available": true}, {"label": "400 páginas", "price": 105, "stock": "", "photo": "", "available": true}]}]'::jsonb, '[{"name": "Capa personalizada", "required": false, "multiple": false, "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": true}]}]'::jsonb, 12);
