# Bluds Social

Rede social estilo Twitter, com identidade visual própria ("Aurora" — fundo em névoa animada, tons violeta/verde-água). Feita com **React + Vite + Tailwind + Framer Motion** no front e **Node/Express + Prisma + Postgres (Supabase)** no back. Responsivo, PWA instalável, com push notifications.

## O que já tem
**Conta:** cadastro/login (JWT), avatar e banner com recorte/zoom, editar perfil, trocar usuário/e-mail/senha, apagar conta, exportar dados, conta privada com aprovação de seguidores, bloquear e denunciar usuários.

**Posts:** texto (280 car.), até 4 imagens, enquetes, hashtags clicáveis, @menções, editar, fixar no perfil, curtir, responder (com thread), repostar, citar, salvar (bookmarks), compartilhar (nativo no celular).

**Feed:** abas "Para você"/"Seguindo", scroll infinito, hashtags em alta, sugestões de quem seguir.

**Perfil:** sub-abas (Posts/Respostas/Curtidas/Mídia), selo de verificado.

**Notificações:** dentro do app (curtida/resposta/repost/seguidor/menção) + push notification de verdade, mesmo com o app fechado.

**Extras:** busca de usuários, zoom em imagens (lightbox), seletor de emoji, rascunho de post salvo automaticamente, reduzir animações (acessibilidade).

## Estrutura
```
bluds-social/
├── backend/     # API (Express + Prisma + SQLite/Postgres)
└── frontend/    # App React (Vite + Tailwind)
```

---

## 1. Rodando localmente

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init   # cria o banco (SQLite local, dev.db)
npm run dev                           # roda em http://localhost:3333
```

### Frontend
```bash
cd frontend
npm install
npm run dev                           # roda em http://localhost:5173
```

Abra `http://localhost:5173` no navegador. Pra testar como "app" no celular, acesse pelo IP da sua máquina na mesma rede Wi-Fi (ex: `http://192.168.0.10:5173`) e use "Adicionar à tela de início" no navegador do celular.

---

---

## Configuração extra: Supabase Storage (imagens) e Push Notifications

### Supabase Storage (obrigatório pras imagens não sumirem no deploy)
1. No painel do Supabase: **Storage** (menu lateral) → **New bucket**
2. Nome: `uploads` → marque **Public bucket** → criar
3. Em **Project Settings → API Keys**, copie a **service_role key**
4. No `backend/.env`, preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_STORAGE_BUCKET="uploads"`

Pronto — avatar, banner e imagens de post agora sobem direto pro Supabase Storage.

### Push Notifications (opcional)
1. Gere as chaves VAPID:
   ```bash
   node -e "console.log(require('web-push').generateVAPIDKeys())"
   ```
2. Cole `publicKey` e `privateKey` em `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no `backend/.env`
3. Ative em **Configurações → Notificações push** dentro do app (precisa de HTTPS em produção; localhost funciona sem HTTPS pra testar)

---

## 2. Colocando no ar (deploy)

### Banco de dados
O projeto usa **SQLite** por padrão pra facilitar o dev local, mas SQLite não é ideal pra produção. Pra deploy, recomendo:

1. Criar um banco Postgres grátis em [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [Railway](https://railway.app)
2. Editar `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // trocar de "sqlite" pra "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Colocar a URL do banco na variável `DATABASE_URL` (nas configs do seu host)
4. Rodar `npx prisma migrate deploy` no ambiente de produção

### Backend
Suba a pasta `backend/` no [Railway](https://railway.app), [Render](https://render.com) ou [Fly.io](https://fly.io). Configure as variáveis de ambiente (veja `.env.example`):
- `DATABASE_URL`
- `JWT_SECRET` (troque por um valor aleatório forte)
- `CLIENT_URL` (a URL do seu frontend, pra liberar o CORS)

> ✅ Upload de imagens já usa o Supabase Storage (configuração na seção acima), então elas continuam disponíveis mesmo depois de um novo deploy.

### Frontend
Suba a pasta `frontend/` na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com):
- Configure a variável `VITE_API_URL` apontando pra URL do backend em produção (ex: `https://sua-api.up.railway.app`)

Depois disso, qualquer pessoa que acessar seu site no celular vai poder "instalar" o Bluds Social como um app de verdade.

---

## 3. Próximos passos sugeridos
- Mensagens diretas (DM)
- Silenciar palavras/hashtags no feed
- Onboarding: sugerir gente pra seguir logo no cadastro
- Enquetes com prazo de expiração
- Listas (grupos de usuários)

Se quiser, é só pedir que eu implemento qualquer um desses.
