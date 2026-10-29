# Gera supabase/seed.sql a partir do catálogo de encadernação (PDF)
import json
A5 = "Capa personalizada no tema desejado."
ART = "Arte inclusa (até 2 alterações)"
MIOLO = "Consulte as opções de miolos disponíveis."
def desc(*l): return "\n".join(l)
def var(name, vals): return [{"name": name, "values": [{"label": l, "price": p, "stock": "", "photo": "", "available": True} for l, p in vals]}]
def specs(miolo_g=75, dims="A5", outras=None, elastico=True, bolso=True, alteracoes=2, estrutura="Capa dura"):
    d = {"altura": "21", "largura": "15"} if dims == "A5" else dims
    if outras: d = {**d, "outras": outras}
    acc = (["Bolso plástico"] if bolso else []) + (["Elástico"] if elastico else [])
    return {"dimensions": d, "miolo": {"uses": True, "tipo": "Offset", "gramatura": str(miolo_g)}, "capa": {"uses": True},
            "principal": {}, "laminacao": {"has": "nao"}, "estrutura": estrutura, "encadernacao": {"tipo": "Wire-O", "cor": "branco"},
            "acessorios": acc, "outros_acabamentos": "", "arte": {"tipo": "inclusa", "alteracoes": str(alteracoes)}}
CF = [{"label": "Tema e nome da capa", "instruction": "Conte o tema desejado e o nome que deve aparecer na capa.", "required": False, "max": "120", "suggestions": "", "allow_free": True}]
CAPA = [{"name": "Capa personalizada", "required": False, "multiple": False,
         "choices": [{"label": "Quero informar o tema e o nome", "extra": "", "input": True}]}]

cats = ["Agendas e planners", "Cadernetas", "Cadernos e blocos", "Controles", "Devocionais"]
C = {n: f"00000000-0000-4000-8000-00000000000{i+1}" for i, n in enumerate(cats)}

P = [
 ("Agenda adulto ou escolar", "Agendas e planners", 87, desc(A5, MIOLO),
   var("Miolo", [("Dois dias por página (~220 páginas)", 87), ("Um dia por página (~400 páginas)", 105)]), True),
 ("Agenda infantil / creche", "Agendas e planners", 89, desc("Um dia por página — 280 páginas", A5, MIOLO), [], False),
 ("Planner horizontal ou vertical", "Agendas e planners", 87, desc("210 páginas", A5, MIOLO),
   var("Formato", [("Horizontal", ""), ("Vertical", "")]), True),
 ("Caderneta da gestante", "Cadernetas", 62, desc("60 páginas", A5), [], False),
 ("Caderneta de vacinação infantil", "Cadernetas", 65, desc("112 páginas", A5, "Para reforma, o miolo deve estar preservado."),
   var("Tipo", [("Caderneta nova", 65), ("Reforma da antiga", 69)]), True),
 ("Caderneta de saúde para pets", "Cadernetas", 72, desc("160 páginas", A5, "Acompanha uma foto do seu pet."), [], False),
 ("Caderno pautado ou de pedidos", "Cadernos e blocos", 85, desc(A5, MIOLO),
   var("Modelo", [("Caderno pautado (200 páginas)", 85), ("Caderno de pedidos (240 páginas)", 88)]), False),
 ("Bloco de anotações grande", "Cadernos e blocos", 27, desc("80 páginas", "Tamanho 14 cm de altura x 10 cm de largura", "Capa dura personalizada com a arte desejada", "Espiral wire-o branco", "Acabamento em elástico", "Miolo impresso é apenas frente"),
   var("Miolo", [("Em branco", 27), ("Impresso", 32)]), False),
 ("Livro de receitas", "Cadernos e blocos", 72, desc("160 páginas — miolo padrão", "Tamanho A5 (21 x 15 cm)\nCapa dura\nCom bolsinho plástico\nCapa personalizada no tema desejado\nEspiral wire-o branco"), [], False),
 ("Controle de agendamentos ou procedimentos", "Controles", 87, desc(A5, MIOLO),
   var("Páginas", [("200 páginas", 87), ("400 páginas", 105)]), False),
 ("Controle de glicemia", "Controles", 87, desc(A5, MIOLO), var("Páginas", [("200 páginas", 87), ("400 páginas", 105)]), False),
 ("Controle financeiro", "Controles", 87, desc(A5, MIOLO), var("Páginas", [("200 páginas", 87), ("400 páginas", 105)]), False),
 ("Devocional católico ou evangélico", "Devocionais", 87, desc(A5, MIOLO),
   var("Linha", [("Católico", ""), ("Evangélico", "")]) + var("Páginas", [("200 páginas", 87), ("400 páginas", 105)]), False),
]

settings = {
 "active": True, "name": "Gio Essenza", "slogan": "Papelaria com Significado",
 "whatsapp": "5541987152125", "whatsapp_enabled": True,
 "description": "Agendas, cadernetas, planners e cadernos encadernados com capa personalizada no tema que você escolher. Faça seu pedido com antecedência pelo WhatsApp. Pode haver variações de cor em relação à tela do celular ou monitor.",
 "logo": "", "public_url": "",
 "banner": {"enabled": True, "type": "color", "color": "#55663C", "image": "", "title": "Ideias que ganham forma, momentos com mais significado.", "subtitle": "Encomendas de produtos personalizados"},
 "colors": {"primary": "#55663C", "accent": "#A9B98C", "background": "#FBF7F0", "text": "#3D4A2A"},
 "hours": {"show": True, "days": [{"open": d not in (0, 6), "start": "09:00", "end": "19:00"} for d in range(7)]},
 "delivery": {"app": True, "pickup": True, "pickup_note": "Retiradas de segunda a sexta, das 15h às 19h, mediante agendamento prévio."},
}

q = lambda s: "'" + s.replace("'", "''") + "'"
out = ["-- Dados iniciais (rode depois do schema.sql)",
       f"insert into public.settings (id, data) values (1, {q(json.dumps(settings, ensure_ascii=False))}::jsonb) on conflict (id) do update set data = excluded.data;"]
for i, n in enumerate(cats):
    out.append(f"insert into public.categories (id, name, position) values ({q(C[n])}, {q(n)}, {i}) on conflict (id) do nothing;")
SP = {
 "Caderneta da gestante": specs(120), "Caderneta de vacinação infantil": specs(120),
 "Bloco de anotações grande": specs(75, {"altura": "14", "largura": "10"}, bolso=False),
 "Livro de receitas": specs(75, elastico=False),
}
for i, (name, cat, price, d, v, feat) in enumerate(P):
    sp = SP.get(name, specs(75))
    out.append("insert into public.products (name, category_id, description, price, featured, active, sale_type, specs, custom_fields, variations, options, position) values "
               f"({q(name)}, {q(C[cat])}, {q(d)}, {price}, {str(feat).lower()}, false, 'unit', {q(json.dumps(sp, ensure_ascii=False))}::jsonb, "
               f"{q(json.dumps(CF, ensure_ascii=False))}::jsonb, {q(json.dumps(v, ensure_ascii=False))}::jsonb, '[]'::jsonb, {i});")
open("supabase/seed.sql", "w").write("\n".join(out) + "\n")
print(len(P), "produtos")
