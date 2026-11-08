# Academia do Departamento Pessoal

Estrutura de site para vender um infoproduto (curso em vídeo) de Departamento
Pessoal: landing page de vendas, checkout com Mercado Pago e área de membros
com as videoaulas hospedadas no Panda Video, liberada automaticamente após o
pagamento ser confirmado.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 7** + **PostgreSQL**
- **NextAuth (Auth.js) v5** — login por e-mail/senha, sessão em JWT
- **Mercado Pago** (Checkout Pro) — pagamento e liberação de acesso via webhook
- **Panda Video** — hospedagem e player das videoaulas

> Este projeto usa versões bem recentes do Next.js e do Prisma, com algumas
> mudanças importantes em relação a versões anteriores (ex.: `middleware.ts`
> virou `proxy.ts`; o Prisma Client agora exige um "driver adapter" em vez de
> `url` direto). Isso já está tudo configurado — só é bom saber caso você vá
> comparar com tutoriais mais antigos.

## Site publicado

O site já está no ar: <https://academia-dp-cursos.vercel.app> (projeto
`academia-dp-cursos` na sua conta Vercel). O checkout e os vídeos ainda não
funcionam de verdade em produção até você preencher `MERCADOPAGO_ACCESS_TOKEN`,
`MERCADOPAGO_WEBHOOK_SECRET` e `NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL` nas
variáveis de ambiente do projeto na Vercel (Project Settings → Environment
Variables) e publicar um novo deploy.

Este primeiro deploy foi feito por upload direto de arquivos (sem Git). Para
deploys automáticos a cada alteração, conecte o projeto a um repositório
Git (GitHub/GitLab/Bitbucket) nas configurações do projeto na Vercel.

## Como o fluxo funciona

1. Visitante entra na landing page (`/`) e clica em comprar.
2. Em `/checkout/[slug]` ele cria nome/e-mail/senha (ou usa a conta já
   logada) — isso já cria o usuário e a sessão.
3. É criada uma `Purchase` com status `PENDING` e uma *Preference* no
   Mercado Pago; o visitante é redirecionado ao checkout do Mercado Pago.
4. O Mercado Pago chama `POST /api/webhooks/mercadopago` quando o status do
   pagamento muda. A rota busca o pagamento de volta na API do Mercado Pago
   (nunca confia no corpo da notificação) e, se aprovado, marca a `Purchase`
   como `PAID`.
5. A área de membros (`/membros`) só lista cursos com uma `Purchase` `PAID`
   para o usuário logado. Cada aula roda no player do Panda Video.

Controle de acesso em duas camadas:

- `proxy.ts` (equivalente ao antigo `middleware.ts`) faz um redirecionamento
  otimista para `/login` se não houver sessão.
- Cada página da área de membros confere de novo, no servidor, se existe uma
  `Purchase` `PAID` para aquele curso antes de mostrar qualquer aula.

## Configuração local

```bash
npm install
cp .env.example .env
```

Edite o `.env`:

| Variável | Para que serve |
| --- | --- |
| `DATABASE_URL` | String de conexão Postgres. Já vem preenchida com um banco de teste gratuito (veja abaixo) — troque quando tiver seu Postgres definitivo. |
| `AUTH_SECRET` | Chave para assinar a sessão. Gere com `openssl rand -base64 32`. |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token (de teste ou produção) do [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel). |
| `MERCADOPAGO_WEBHOOK_SECRET` | Chave secreta do webhook (mesma tela do Access Token). Sem ela o webhook ainda funciona, mas sem validar a assinatura — **configure antes de ir para produção**. |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site, usada para montar as `back_urls` e a `notification_url` do checkout. |
| `NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL` | URL base do player da sua biblioteca no Panda Video. |

### Banco de dados

O `.env` já vem com um banco Postgres real e funcionando, criado
automaticamente (sem precisar de conta) com o `create-db` do Prisma. **Ele é
apagado em 24h se não for reivindicado** — reivindique gratuitamente e para
sempre neste link:

<https://create-db.prisma.io/claim?projectID=proj_uiv7t6cb5wmdzsufyfc4946s&utm_source=create-db&utm_medium=cli&utm_content=default>

(Se preferir usar outro Postgres — Neon, Supabase, Vercel Postgres, RDS etc. —
é só trocar o valor de `DATABASE_URL` no `.env` por outra string de conexão.)

Aplique o schema e os dados de exemplo:

```bash
npm run db:migrate   # cria/atualiza as tabelas (gera histórico de migração)
npm run db:seed      # cria o curso de exemplo + 1 usuário de teste
npm run db:studio    # interface visual para ver/editar os dados (Prisma Studio)
```

O seed cria o curso **"Departamento Pessoal na Prática"** com 4 módulos e 11
aulas (com `pandaVideoId` de placeholder — troque pelos IDs reais dos seus
vídeos em `prisma/seed.ts` ou direto no Prisma Studio) e um usuário de teste:

```
aluno.teste@example.com / senha12345
```

Esse usuário de teste não tem nenhuma compra aprovada por padrão — para
testar a área de membros sem precisar pagar de verdade, crie manualmente uma
`Purchase` com `status = PAID` para ele no Prisma Studio.

Rodar o site:

```bash
npm run dev
```

## Painel administrativo

Em `/admin` (só para usuários com `isAdmin = true`) tem um painel com:

- Métricas: alunos pagantes, acessos ativos, acessos expirados, pagamentos
  pendentes e receita confirmada.
- Lista de todas as inscrições, com status, valor, data da compra e data em
  que o acesso expira (ou "Vitalício", se o curso não tiver prazo), com botão
  para **cancelar** uma inscrição (revoga o acesso).
- Exportação em CSV (botão "Exportar CSV", também disponível em
  `GET /api/admin/export`).

Em `/admin/usuarios` tem a gestão de contas:

- **Adicionar usuário**: cria uma conta manualmente (cortesia, venda fora do
  site, etc.), com senha provisória gerada automaticamente, e já pode
  conceder acesso a um curso no mesmo passo.
- **Conceder/cancelar acesso** por curso, por usuário — é o "perfil de
  acesso": uma tabela com uma coluna por curso, mostrando quem tem acesso a
  quê.
- **Forçar nova senha**: gera uma nova senha provisória para quem esqueceu a
  senha (útil junto com o botão "Admin"/"Aluno" para promover/remover admins).
- O botão **Admin/Aluno** promove ou remove a permissão de administrador
  (não é possível remover a própria permissão, para evitar se trancar fora).

O link "Admin" aparece no menu só para quem tem `isAdmin = true`.

### Senha provisória e primeiro acesso

Toda conta criada pelo admin (ou que teve a senha redefinida via "Forçar nova
senha") recebe uma senha provisória aleatória e fica marcada com
`mustChangePassword = true`. No próximo login, a pessoa é redirecionada
automaticamente para `/trocar-senha` e só consegue usar o site depois de
definir uma senha nova — isso vale mesmo que ela já esteja com uma sessão
aberta (checado direto no banco a cada acesso às áreas protegidas).

Se `RESEND_API_KEY` estiver configurado, a senha provisória e o link do site
são enviados por e-mail automaticamente. Sem isso, a senha aparece só no
painel admin, para você repassar manualmente. Veja a seção
[E-mail transacional](#e-mail-transacional-resend) abaixo para configurar.

### Prazo de acesso

Cada curso tem um campo `accessDurationDays` (dias de acesso a partir da
aprovação do pagamento). Quando o Mercado Pago confirma um pagamento, o
webhook calcula automaticamente `Purchase.accessExpiresAt` = data do
pagamento + esse prazo. Deixe `accessDurationDays` vazio/`null` para acesso
vitalício (nunca expira). A verificação de acesso (`src/lib/access.ts`) já
bloqueia automaticamente quem passou do prazo.

## Conteúdo do curso (módulos e aulas)

O conteúdo (cursos, módulos, aulas) ainda não tem uma tela própria de edição
— é gerenciado por:

- `prisma/seed.ts`, para a carga inicial (`npm run db:seed`), ou
- **Prisma Studio** (`npm run db:studio`) para criar/editar cursos, módulos
  e aulas depois.

Cada aula guarda um `pandaVideoId`: o ID do vídeo na sua biblioteca do Panda
Video (aparece ao gerar o embed de qualquer vídeo no painel deles).

## Mercado Pago

1. Crie uma aplicação em <https://www.mercadopago.com.br/developers/panel>.
2. Copie o **Access Token** (use o de teste enquanto desenvolve) para
   `MERCADOPAGO_ACCESS_TOKEN`.
3. Configure a URL de notificações (webhook) apontando para
   `https://SEU_DOMINIO/api/webhooks/mercadopago`. Em desenvolvimento local,
   use um túnel (ex.: `ngrok http 3000`) e aponte para a URL gerada.
4. Copie a **chave secreta da assinatura do webhook** para
   `MERCADOPAGO_WEBHOOK_SECRET` — isso garante que só o Mercado Pago consegue
   liberar o acesso de um curso.
5. Para testar pagamentos sem usar dinheiro real, use as [contas e cartões de
   teste do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards).

## E-mail transacional (Resend)

Usado para enviar a senha provisória e o link do site quando o admin cria um
usuário ou força a troca de senha.

1. Crie uma conta grátis em <https://resend.com> (até 3.000 e-mails/mês sem
   custo).
2. Gere uma API key e coloque em `RESEND_API_KEY`.
3. Por padrão o remetente é `onboarding@resend.dev` (funciona sem configurar
   domínio, mas só em modo de teste). Para enviar de um e-mail com o seu
   domínio, [verifique um domínio no Resend](https://resend.com/docs/dashboard/domains/introduction)
   e troque `EMAIL_FROM` para algo como `"Academia DP <contato@seudominio.com.br>"`.

Sem `RESEND_API_KEY` configurado, nada quebra — o e-mail simplesmente não é
enviado, e a senha provisória aparece no painel admin para repasse manual.

## Panda Video

1. Faça upload dos vídeos na sua biblioteca do Panda Video.
2. Pegue a URL base do player da biblioteca (algo como
   `https://player-vz-xxxxxxx.tv.pandavideo.com.br/embed`) e configure em
   `NEXT_PUBLIC_PANDAVIDEO_PLAYER_URL`.
3. Em cada aula (seed ou Prisma Studio), preencha `pandaVideoId` com o ID do
   vídeo correspondente.
4. No painel do Panda Video, restrinja os domínios autorizados a reproduzir
   os vídeos (proteção contra hotlink/pirataria) para o domínio do seu site.

## Indo para produção

- **Banco de dados**: o projeto já usa Postgres (via `@prisma/adapter-pg`) e
  migrações versionadas em `prisma/migrations/`. O banco atual do `.env` é um
  banco de teste gratuito — **reivindique-o** (link na seção acima) ou troque
  `DATABASE_URL` por outro Postgres de sua preferência (Neon, Supabase,
  Vercel Postgres, RDS etc.) antes de ir ao ar. Ao migrar, rode
  `npx prisma migrate deploy` contra o banco de produção (em vez de
  `db:migrate`, que é para desenvolvimento).
- **Deploy**: o projeto roda bem na Vercel (`vercel.com`) — é só conectar o
  repositório e configurar as mesmas variáveis de ambiente do `.env` lá.
- Gere um `AUTH_SECRET` novo e forte para produção (nunca reaproveite o de
  desenvolvimento).

## O que ainda falta para um produto completo

Este projeto entrega a estrutura funcional de ponta a ponta (vendas →
pagamento → liberação → player), mas alguns pontos ficam como próximos
passos antes de operar em escala:

- **E-mail transacional**: hoje a conta é criada e logada automaticamente no
  checkout, mas não é enviado nenhum e-mail de boas-vindas/confirmação.
  Vale integrar um provedor (ex.: Resend, SendGrid) para enviar recibo e
  lembrete de acesso.
- **Recuperação de senha**: não há fluxo de "esqueci minha senha".
- **Painel de administração**: cadastro de cursos/módulos/aulas hoje é feito
  via seed/Prisma Studio, não por uma tela própria no site.
- **Emissão de certificado**, cupons de desconto, upsell/order bump, etc. —
  não fazem parte deste escopo inicial.
