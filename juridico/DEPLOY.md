# Como colocar no ar

Ordem recomendada: Supabase, Vercel, domínio, integrações, carga inicial, teste. Faça tudo primeiro em modo de teste (sandbox) e só depois troque para produção.

Contas necessárias: GitHub (já tem), Supabase, Vercel, Google Cloud (login com Google), Resend (e-mail), Anthropic (IA), Asaas (pagamentos), ZapSign (assinatura). Opcionais: Voyage AI (busca semântica), Meta/WhatsApp Business.

---

## 1. Levar o código para o branch principal

O código está no branch `claude/cool-ramanujan-uh4n48`. No GitHub, abra um Pull Request desse branch para `main` e faça o merge. A Vercel publica o `main` como produção.

## 2. Supabase (banco, login e arquivos)

1. Em https://supabase.com, crie um projeto. Região: **South America (São Paulo)**. Guarde a senha do banco.
2. Em **Project Settings > API**, anote: `Project URL`, chave `anon` e chave `service_role` (esta é secreta).
3. Aplique as migrations pelo seu computador (precisa de Node 20+):
   ```
   git clone https://github.com/matheuslibragap-coder/new.git
   cd new/juridico
   npm install
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF   # o ref aparece na URL do painel
   npx supabase db push
   ```
   Sem terminal: abra **SQL Editor** e cole, um por vez e em ordem, os arquivos de `supabase/migrations` (0001 a 0009).
4. Confira em **Storage** se o bucket `documentos` existe (privado). Se a migration 0006 der erro de permissão, crie o bucket pelo painel com o nome `documentos`, privado, e rode de novo só as linhas `create policy` do arquivo 0006.
5. **Authentication > Providers**: deixe **Email** ligado (com "Confirm email").
6. **Authentication > URL Configuration**:
   - Site URL: `https://SEU-DOMINIO` (use o endereço da Vercel até ter domínio).
   - Redirect URLs: `https://SEU-DOMINIO/auth/callback` e `https://SEU-PROJETO.vercel.app/auth/callback`.
7. **Authentication > SMTP Settings**: configure o SMTP do Resend (passo 5). O e-mail padrão do Supabase só envia poucas mensagens por hora e não serve para produção.

### Login com Google
1. https://console.cloud.google.com > crie um projeto > **APIs e serviços > Tela de consentimento OAuth** (tipo Externo, preencha nome e e-mail).
2. **Credenciais > Criar credenciais > ID do cliente OAuth > Aplicativo da Web**.
3. Em "URIs de redirecionamento autorizados" coloque: `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`.
4. Copie Client ID e Client Secret para **Supabase > Authentication > Providers > Google** e ative.

## 3. Vercel (aplicação)

1. https://vercel.com > **Add New > Project** > importe o repositório `new`.
2. **Root Directory: `juridico`** (obrigatório: a raiz do repositório tem outro projeto). Framework: Next.js (detectado sozinho).
3. Em **Environment Variables**, cadastre (os valores vêm dos passos seguintes; pode completar depois e fazer "Redeploy"):

| Variável | De onde vem |
| --- | --- |
| `NEXT_PUBLIC_NOME_PRODUTO` | Nome do seu produto |
| `NEXT_PUBLIC_URL_APP` | `https://SEU-DOMINIO` (sem barra no fim) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > API > anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > API > service_role |
| `CRON_SECRET` | Gere uma senha longa (ex.: `openssl rand -hex 32`) |
| `DATAJUD_API_KEY` | Chave pública em https://datajud-wiki.cnj.jus.br/api-publica/acesso (copie só o texto depois de `APIKey `) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com > API Keys |
| `VOYAGE_API_KEY` | Opcional: https://dash.voyageai.com |
| `RESEND_API_KEY`, `EMAIL_REMETENTE` | Passo 5 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Rode `npx web-push generate-vapid-keys`; subject = `mailto:seu@email` |
| `ASAAS_AMBIENTE`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` | Passo 6 |
| `ZAPSIGN_AMBIENTE`, `ZAPSIGN_API_TOKEN`, `ZAPSIGN_WEBHOOK_TOKEN` | Passo 7 |
| `WHATSAPP_TOKEN`, `WHATSAPP_TEMPLATE` | Opcional, passo 8 |

4. Clique em **Deploy**. Ao terminar, abra o endereço `https://SEU-PROJETO.vercel.app`.

## 4. Domínio próprio

1. Vercel > projeto > **Settings > Domains** > adicione `seudominio.com.br`.
2. No registro.br (ou onde comprou), crie os registros DNS que a Vercel mostrar.
3. Atualize `NEXT_PUBLIC_URL_APP` na Vercel e a Site URL/Redirect URLs no Supabase. Faça **Redeploy**.

## 5. E-mail (Resend)

1. https://resend.com > **Domains** > adicione seu domínio e crie os registros DNS indicados. Espere ficar "Verified".
2. Crie uma API Key. Preencha `RESEND_API_KEY` e `EMAIL_REMETENTE="Avisos <avisos@seudominio.com.br>"` na Vercel.
3. No Supabase > Authentication > SMTP: host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a API Key, remetente igual ao acima.

## 6. Pagamentos (Asaas)

1. Crie conta em https://sandbox.asaas.com (teste). Em **Integrações > Chave de API**, gere a chave → `ASAAS_API_KEY`. `ASAAS_AMBIENTE=sandbox`.
2. **Integrações > Webhooks > Adicionar**:
   - URL: `https://SEU-DOMINIO/api/webhooks/asaas`
   - Token de autenticação: crie uma senha → mesma em `ASAAS_WEBHOOK_TOKEN`
   - Eventos: cobranças (confirmada, recebida, vencida) e assinaturas (excluída/inativada).
3. Teste assinando um plano em Configurações > Plano (informe antes o CPF/CNPJ em Configurações > Escritório) e pague a fatura de teste.
4. Para produção: crie a conta em https://www.asaas.com, troque a chave, `ASAAS_AMBIENTE=producao` e recadastre o webhook.

## 7. Assinatura eletrônica (ZapSign)

1. https://app.zapsign.com.br > **Configurações > Integração > API**: copie o token → `ZAPSIGN_API_TOKEN`. Comece com `ZAPSIGN_AMBIENTE=sandbox` (token do sandbox).
2. Crie uma senha para `ZAPSIGN_WEBHOOK_TOKEN` e cadastre o webhook: `https://SEU-DOMINIO/api/webhooks/zapsign?token=ESSA_SENHA`.

## 8. WhatsApp automático (opcional, plano Pro)

Exige conta Meta Business, número verificado e um modelo de mensagem aprovado com uma variável no corpo (ex.: nome `atualizacao_processo`, texto "{{1}}"). Preencha `WHATSAPP_TOKEN` e `WHATSAPP_TEMPLATE`; cada escritório informa seu Phone Number ID em Configurações > Escritório. Sem isso, o envio manual por wa.me funciona normalmente.

## 9. Agendamentos frequentes (Supabase)

A Vercel já roda os jobs diários (`vercel.json`). Os frequentes rodam no Supabase:

1. Supabase > **Database > Extensions**: ative `pg_cron` e `pg_net`.
2. No **SQL Editor**, troque `SEU-DOMINIO` e `SEU_CRON_SECRET` e rode:
   ```sql
   select cron.schedule('datajud-fila', '*/10 * * * *', $$
     select net.http_get(
       url := 'https://SEU-DOMINIO/api/cron/datajud',
       headers := jsonb_build_object('Authorization', 'Bearer SEU_CRON_SECRET'),
       timeout_milliseconds := 60000);
   $$);

   select cron.schedule('alertas-hora', '5 * * * *', $$
     select net.http_get(
       url := 'https://SEU-DOMINIO/api/cron/alertas',
       headers := jsonb_build_object('Authorization', 'Bearer SEU_CRON_SECRET'),
       timeout_milliseconds := 60000);
   $$);
   ```
3. Para conferir: `select * from cron.job_run_details order by start_time desc limit 10;`

## 10. Carga inicial

1. Acesse o site, crie sua conta e o seu escritório.
2. Torne-se administrador (SQL Editor):
   ```sql
   insert into admins_plataforma (user_id)
   select id from auth.users where email = 'seu@email.com';
   ```
3. Menu > **Admin da plataforma**:
   - **Feriados**: confira cada item [CONFERIR] no calendário oficial do TJRS e do TRT4 e marque como validado. Inclua portarias de suspensão.
   - **Regras de prazo**: revise as regras marcadas [VALIDAR COM ADVOGADO].
   - **Índices**: importe CSV no formato `INDICE;AAAA-MM;valor` (ex.: `IPCA;2024-01;0,42`). Fontes: IBGE/SIDRA (IPCA, IPCA-E, INPC) e Banco Central/SGS (Selic e TR). Sem índices, as calculadoras de atualização não funcionam.
   - **Modelos**: revise os modelos de contrato e procuração.
4. Preencha os textos de **Termos de uso** e **Política de privacidade** (`src/app/(publico)/termos/page.tsx` e `privacidade/page.tsx`) antes de abrir para clientes.

## 11. Teste antes de divulgar

- [ ] Criar conta por e-mail (o e-mail de confirmação chega) e pelo Google.
- [ ] Cadastrar um cliente e um processo real do TJRS: capa e andamentos aparecem com "Fonte: CNJ / DataJud".
- [ ] Calcular um prazo e salvar; conferir a memória de cálculo.
- [ ] Ativar notificações no celular (Avisos > Ativar notificações). No iPhone, antes adicione o site à tela de início.
- [ ] Criar uma audiência e baixar o .ics.
- [ ] Gerar uma mensagem com IA, aprovar e abrir no WhatsApp.
- [ ] Assinar um plano no sandbox do Asaas e ver o plano mudar depois do pagamento.
- [ ] Gerar um contrato e enviar para assinatura no sandbox da ZapSign.
- [ ] Exportar os dados (Configurações > Privacidade).
- [ ] Em Vercel > projeto > **Logs**, nenhum erro nas rotas `/api/cron/*` após um dia.

## 12. Virar para produção

Troque Asaas e ZapSign para produção (chaves, ambiente e webhooks), confirme o domínio no Resend e faça **Redeploy** na Vercel.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| Login com Google volta para "Link inválido" | Redirect URL faltando no Supabase ou no Google Cloud |
| E-mail de confirmação não chega | SMTP do Resend não configurado ou domínio não verificado |
| Processo fica "Erro na consulta" | `DATAJUD_API_KEY` errada ou o CNJ trocou a chave pública (confira a página do DataJud) |
| Jobs retornam 401 | `CRON_SECRET` diferente entre Vercel e o SQL do pg_cron |
| Plano não muda após pagar | Webhook do Asaas sem o token correto ou URL errada |
| Deploy falha na Vercel | Root Directory diferente de `juridico` |
