# Catálogo Gio Essenza — Papelaria com Significado

Catálogo virtual com área administrativa. Next.js 14 + Supabase, hospedado na Vercel.

- **Catálogo público:** `/`, `/produto/[id]` e `/carrinho`
- **Painel:** `/admin/login`, `/admin/dashboard`, `/admin/loja`, `/admin/banner`, `/admin/cores`, `/admin/horarios`, `/admin/entrega`, `/admin/categorias`, `/admin/produtos`

## 1. Supabase (banco, login e imagens)
1. Crie um projeto em https://supabase.com (plano gratuito).
2. **SQL Editor** → rode `supabase/schema.sql`. Depois, opcionalmente:
   - `supabase/seed.sql` — os 13 produtos reais do catálogo de encadernação, com preços, variações e especificações. Entram **inativos** (sem foto); publique cada um após enviar as fotos.
   - `supabase/seed_teste.sql` — os 2 produtos de teste (Agenda e Kit de fotos), inativos e com preço zero.
   - Já rodou a versão 1? Rode só `supabase/migration_v2.sql`.
3. **Authentication → Users → Add user**: crie o usuário da Gio (e-mail + senha, marque *Auto Confirm*).
4. **IMPORTANTE — Authentication → Sign In / Providers → desative "Allow new users to sign up".** Sem isso, qualquer pessoa poderia criar uma conta e editar o catálogo.
5. **Project Settings → API**: copie a *Project URL* e a *anon public key*.

## 2. Rodar localmente
```bash
cp .env.example .env.local   # preencha as duas variáveis
npm install
npm run dev                  # http://localhost:3000 e /admin
```

## 3. Publicar na Vercel
1. Importe o repositório `Netus-Automacao/GioEssenza` em https://vercel.com/new.
2. Em *Environment Variables*, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. Cada `git push` na `main` publica de novo.

**Domínio próprio:** registre o domínio (ex.: registro.br), adicione em Vercel → Settings → Domains e siga as instruções de DNS. Depois cole o endereço em Painel → Identidade da loja → Endereço público.

## Regras de preço
- Cada produto tem preço normal e promocional (opcional).
- Em cada grupo de variação, a Gio escolhe se o preço da opção **substitui** o preço do produto (ex.: 400 páginas = R$ 105) ou **soma** a ele (ex.: + R$ 5). Opção sem preço = preço do produto.
- Opções adicionais somam o acréscimo cadastrado. Nenhum frete ou taxa é adicionado.

## Personalização em kits
A Gio cadastra os campos (nome, frase…), o limite de caracteres e as frases sugeridas. Em um kit, o **cliente escolhe** se usa o mesmo texto para o kit todo ou um texto para cada unidade. Itens com personalizações diferentes ficam separados no carrinho.

## Estoque
Como o pedido é concluído no WhatsApp, o site não sabe quando a venda foi confirmada: **a Gio atualiza o estoque no painel após cada venda.** O carrinho não deixa passar da quantidade disponível.

## Carrinho
Fica salvo no navegador do cliente. Os dados da loja e dos produtos ficam sempre no banco (Supabase).
