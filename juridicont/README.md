# Juridicont

Auditor ético de publicidade para advogados brasileiros. O advogado envia um post, legenda, roteiro de reels,
stories, bio ou anúncio e recebe um semáforo (verde, amarelo, vermelho) com base numa **base de regras** do
Provimento 205/2021 e do Código de Ética e Disciplina da OAB, armazenada no banco.

Stack: Next.js 16 (App Router, TypeScript, Tailwind 4), Supabase (Auth, Postgres com RLS, Storage),
Claude (API da Anthropic, com visão), Asaas (assinatura com Pix e cartão), Vercel.

## Como rodar

1. **Supabase**
   - Crie um projeto em supabase.com.
   - No SQL Editor, rode em ordem os arquivos de `supabase/migrations/` (ou `supabase db push` com a CLI).
   - Authentication > Providers: deixe **Email** ativo (o login é por link mágico) e ative **Google**
     (crie as credenciais OAuth no Google Cloud e cole Client ID e Secret).
   - Authentication > URL Configuration: defina o Site URL e adicione `https://SEU-DOMINIO/auth/callback`
     (e `http://localhost:3000/auth/callback` para desenvolvimento) em Redirect URLs.
   - Para virar admin, depois de entrar pela primeira vez:
     `update public.perfis set papel = 'admin' where email = 'seu@email.com';`
2. **Variáveis de ambiente**: copie `.env.example` para `.env.local` e preencha.
3. **Asaas**: crie a chave de API (sandbox para testes). Em Integrações > Webhooks, cadastre
   `https://SEU-DOMINIO/api/webhooks/asaas` com um token de autenticação (o mesmo de `ASAAS_WEBHOOK_TOKEN`)
   e marque os eventos de cobrança (`PAYMENT_*`) e de assinatura (`SUBSCRIPTION_*`).
4. `npm install` e `npm run dev`.

Comandos: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Deploy na Vercel

Importe o repositório e defina **Root Directory = `juridicont`**. Cadastre as mesmas variáveis de ambiente.
As rotas de IA declaram `maxDuration` de até 300 s (o gerador pode regenerar o post até 2 vezes).

## Regra central

A IA nunca julga "de cabeça". Em cada checagem:

1. As regras ativas são lidas da tabela `regras` e enviadas no prompt; os códigos válidos também entram como
   `enum` no JSON Schema da resposta (structured outputs).
2. No backend (`src/lib/ia/validacao.ts`) a resposta é revalidada com Zod. Achados com `regra_codigo`
   inexistente são descartados e registrados em `logs_validacao`.
3. A severidade de cada achado é a `severidade_padrao` da regra cadastrada, e a classificação geral é recalculada.
4. Riscos sem regra correspondente usam o código reservado `NAO_CATALOGADO`: sempre amarelo, com
   "Possível risco não catalogado, revise com cautela.", sem citar dispositivo. Se o modelo indicar risco mas
   nenhum achado sobreviver à validação, o resultado também vira amarelo.

Cada checagem salva o texto, a imagem (bucket privado `conteudos`), o resultado, a versão da base de regras
(`regras_versao`, incrementada automaticamente a cada alteração) e um retrato das regras usadas.

## Estrutura

- `supabase/migrations/`: schema, RLS, funções de cota e seed das 8 regras (todas com `revisao_pendente`).
- `src/lib/ia/`: cliente da Anthropic, checador, gerador e validação.
- `src/lib/auditoria.ts`: nota (100 menos 18 por achado vermelho e 6 por amarelo) e os 3 principais riscos.
- `src/lib/pdf.ts`: registro em PDF com código de integridade SHA-256.
- `src/app/api/`: checar, gerar, auditoria, assinatura, webhook do Asaas, exclusão de conta, PDF.
- `src/app/admin/regras/`: painel de regras (apenas `papel = 'admin'`).

## Cotas e planos

Os limites ficam na tabela `planos` (fonte única). O consumo é atômico na função `consumir_cota`; se a
operação falhar, a cota é devolvida. Na data de renovação (`ciclo_fim`) os contadores zeram; plano pago sem
assinatura ativa volta para o gratuito na virada do ciclo. A confirmação de pagamento no webhook inicia um
novo ciclo uma única vez por cobrança.
