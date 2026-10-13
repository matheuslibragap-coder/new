# Plataforma de gestão jurídica

Plataforma web mobile-first para advogados autônomos e pequenos escritórios (1 a 5 advogados).
Next.js 16 (App Router), TypeScript, Tailwind 4, Supabase (Postgres, Auth, Storage, RLS), Vercel.

O nome do produto é configurável em `NEXT_PUBLIC_NOME_PRODUTO`.

## Princípios implementados

| Princípio | Onde |
| --- | --- |
| Multi-inquilino com RLS | Toda tabela tem `escritorio_id` e políticas criadas por `rls_inquilino` (`supabase/migrations/0001_base.sql`). Teste: `supabase/tests/rls_test.sql`. |
| Nenhuma regra jurídica fixa no código | Feriados, regras de prazo, índices, modelos e leis de referência ficam em tabelas editáveis em `/admin`. |
| A plataforma auxilia; não decide | Componente `AvisoResponsabilidade` em todo prazo, cálculo e texto gerado; os PDFs de cálculo trazem o aviso. |
| Nada é enviado sem aprovação | Trigger `exigir_aprovacao_envio` impede marcar mensagem como enviada sem aprovação registrada; a assinatura eletrônica não dispara e-mail do provedor. |
| Atribuição do DataJud | "Fonte: CNJ / DataJud" na capa, nos andamentos, nas mensagens e no verificador. |
| Sem travessão na interface | Conferido por busca no código; o caractere é removido dos textos da IA. |

## Estrutura

```
supabase/migrations   schema, RLS, cotas, funções dos jobs e cargas iniciais
supabase/tests        stub do Supabase + teste de isolamento e cotas (Postgres puro)
scripts/              gerador da carga de feriados (TJRS e TRT4)
src/lib               lógica pura (CNJ, prazos, calculadoras, verificador) e integrações
src/app/(publico)     landing, login, cadastro, termos e privacidade (placeholders)
src/app/(app)         área logada (todos os módulos)
src/app/api           jobs agendados, webhooks, PDFs, .ics, exportação LGPD
```

## Como rodar

1. `npm install`
Passo a passo completo de publicação: `DEPLOY.md`.

2. Crie um projeto no Supabase e aplique as migrations (`npx supabase link` e `npx supabase db push`, ou cole os arquivos de `supabase/migrations` em ordem no SQL Editor).
3. Em Authentication, habilite e-mail e Google e cadastre `{URL}/auth/callback` nas URLs de redirecionamento.
4. Copie `.env.example` para `.env.local` e preencha.
5. `npm run dev`
6. Para acessar o painel admin: `insert into admins_plataforma (user_id) values ('<uuid do seu usuário>');`
7. No admin, importe os índices por CSV e confira os feriados marcados [CONFERIR].

### Jobs agendados

Diários pela Vercel (`vercel.json`, compatível com o plano Hobby): enfileirar DataJud (06h), intimações (07h30) e alertas diários (08h).
Frequentes pelo Supabase (`pg_cron` + `pg_net`, ver `DEPLOY.md`): processamento da fila do DataJud a cada 10 min e alertas de hora em hora.
Todas as rotas exigem `Authorization: Bearer CRON_SECRET`.

### Webhooks

- Asaas: `{URL}/api/webhooks/asaas`, token em `ASAAS_WEBHOOK_TOKEN` (cabeçalho `asaas-access-token`).
- ZapSign: `{URL}/api/webhooks/zapsign?token={ZAPSIGN_WEBHOOK_TOKEN}`.

## Testes

```
npm test            # CNJ, motor de prazos, calculadoras, verificador, PDF, utilitários
npm run typecheck
npm run lint
PGHOST=/tmp PGPORT=5432 PGUSER=postgres ./supabase/tests/rodar.sh   # RLS e cotas num Postgres 16 com pgvector
```

## Fases

1. Autenticação (e-mail e Google), onboarding do escritório, convites com papéis e permissões, M1 com validação do dígito CNJ, identificação do tribunal por J.TR, importação de capa e movimentos do DataJud, cadastro manual de andamentos, job diário com fila e backoff.
2. M2: motor de prazos (dias úteis e corridos, DJe, ciência ficta no portal, suspensão anual, dobra, feriados por tribunal, UF e comarca, expediente reduzido) com memória dia a dia; prazo vira tarefa com alertas D-5, D-2 e D-0; painel admin. M3: agenda dia, semana e lista, anexos, alertas configuráveis, exportação e assinatura .ics.
3. M4: mensagem ao cliente gerada por IA, revisão, aprovação obrigatória, envio por wa.me ou pela API oficial (Pro).
4. Planos, assinatura recorrente (Asaas: cartão, Pix ou boleto), cotas no banco (processos, usuários, assinaturas, módulos), exportação e exclusão de dados (LGPD), registro de acessos.
5. M5: atualização monetária (incluindo a regra da Lei 14.905/2024), rescisão, pensão e cumprimento de sentença, com PDF.
6. M6: lançamentos com parcelamento, situação atrasada, resumo mensal em CSV, alerta de vencidos.
7. M7: modelos com variáveis, geração, PDF, assinatura eletrônica pela ZapSign com aviso de validade e cota.
8. M8: upload PDF/DOCX, anonimização, indexação isolada por escritório (pgvector com Voyage ou busca textual), rascunhos marcados como RASCUNHO.
9. M9: verificação de números CNJ no DataJud (existência, tribunal e classe), jurisprudência sem fonte marcada como NÃO VERIFICADO com link de busca, artigos inválidos, datas impossíveis, nomes divergentes, formatação.
10. M10: interface `ProvedorIntimacoes` com implementação DJEN (Comunica PJe); o prazo sugerido pelo M2 só vira tarefa após confirmação.
