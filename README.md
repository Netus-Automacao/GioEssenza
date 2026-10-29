# Catálogo Gio Essenza — Papelaria com Significado

Catálogo virtual com área administrativa. Next.js 14 + Supabase, hospedado na Vercel.

- **Catálogo público:** `/` e `/produto/[id]`
- **Painel da proprietária:** `/admin` (login com e-mail e senha)

## 1. Supabase (banco, login e imagens)
1. Crie um projeto em https://supabase.com (plano gratuito).
2. **SQL Editor** → cole e rode `supabase/schema.sql`. Depois rode `supabase/seed.sql` (13 produtos do catálogo de encadernação, já com variações e preços).
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

## Funcionalidades
Geral (ativar/desativar catálogo, resumo, copiar link) · Identidade (logo, nome, slogan, WhatsApp, descrição, endereço) · Banner (cor sólida ou imagem, título e subtítulo, prévia) · Cores (4 cores com hex/RGB, degradê, verificação de contraste, prévia ao vivo) · Horários por dia com "Aberto agora" · Entrega por aplicativo e retirada · Produtos (fotos com ordem e foto principal, categorias, preço promocional, destaque, estoque, variações com preço/foto/estoque próprios, opções adicionais com acréscimo e campo de texto) · Pedido pelo WhatsApp com mensagem pronta contendo as escolhas do cliente.

## Fotos dos produtos
O seed não inclui fotos: envie-as pelo painel em **Produtos → Editar → Fotografias**.
