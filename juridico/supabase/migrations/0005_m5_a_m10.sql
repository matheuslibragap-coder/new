-- =====================================================================
-- 0005 M5 a M10
-- =====================================================================

-- ---------------------------------------------------------------------
-- M5 Calculadoras: índices (global, importável por CSV) e cálculos salvos
-- ---------------------------------------------------------------------
create table public.indices (
  indice text not null check (indice in ('IPCA','IPCA-E','INPC','SELIC','TR')),
  competencia date not null, -- primeiro dia do mês
  valor numeric(12,6) not null, -- variação percentual do mês (ex.: 0.44 = 0,44%)
  fonte text,
  atualizado_em timestamptz not null default now(),
  primary key (indice, competencia)
);
select public.rls_global('public.indices');

create table public.calculos_salvos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete set null,
  tipo text not null check (tipo in ('atualizacao','rescisao','pensao','cumprimento_sentenca')),
  titulo text not null,
  entrada jsonb not null,
  resultado jsonb not null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
select public.rls_inquilino('public.calculos_salvos');

-- ---------------------------------------------------------------------
-- M6 Financeiro (exige permissão "financeiro")
-- ---------------------------------------------------------------------
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  processo_id uuid references public.processos(id) on delete set null,
  tipo text not null check (tipo in ('honorario_contratual','honorario_exito','honorario_sucumbencia',
                                     'custas','reembolso','alvara','despesa')),
  natureza text not null default 'receber' check (natureza in ('receber','pagar')),
  descricao text,
  valor_centavos bigint not null check (valor_centavos > 0),
  vencimento date not null,
  status text not null default 'previsto' check (status in ('previsto','recebido','cancelado')),
  recebido_em date,
  parcela_numero integer,
  parcela_total integer,
  grupo_parcelamento uuid,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index lancamentos_venc_idx on public.lancamentos(escritorio_id, status, vencimento);
select public.rls_inquilino('public.lancamentos', 'financeiro');
select public.auditar('public.lancamentos');

-- "atrasado" é derivado: previsto com vencimento no passado (sem job para mudar status)
create or replace view public.lancamentos_situacao with (security_invoker = true) as
  select l.*,
    case when l.status = 'previsto' and l.vencimento < (now() at time zone 'America/Sao_Paulo')::date
         then 'atrasado' else l.status end as situacao
  from public.lancamentos l;

-- ---------------------------------------------------------------------
-- M7 Contratos de honorários e procurações
-- ---------------------------------------------------------------------
create table public.modelos_documento (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid references public.escritorios(id) on delete cascade, -- nulo = modelo padrão global
  tipo text not null check (tipo in ('contrato_honorarios','procuracao','declaracao','outro')),
  nome text not null,
  conteudo text not null,
  validar_com_advogado boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.modelos_documento enable row level security;
create policy modelos_select on public.modelos_documento for select
  using (escritorio_id is null or public.is_membro(escritorio_id));
create policy modelos_insert on public.modelos_documento for insert
  with check ((escritorio_id is null and public.is_admin_plataforma()) or public.is_membro(escritorio_id));
create policy modelos_update on public.modelos_documento for update
  using ((escritorio_id is null and public.is_admin_plataforma()) or public.is_membro(escritorio_id))
  with check ((escritorio_id is null and public.is_admin_plataforma()) or public.is_membro(escritorio_id));
create policy modelos_delete on public.modelos_documento for delete
  using ((escritorio_id is null and public.is_admin_plataforma()) or public.is_membro(escritorio_id));

create table public.documentos_gerados (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  modelo_id uuid references public.modelos_documento(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  processo_id uuid references public.processos(id) on delete set null,
  titulo text not null,
  conteudo text not null,
  pdf_caminho text,
  assinatura_status text not null default 'nao_enviado'
    check (assinatura_status in ('nao_enviado','aguardando','assinado','recusado','erro')),
  assinatura_provedor text,
  assinatura_id_externo text,
  assinatura_links jsonb,
  aviso_validade_aceito_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
select public.rls_inquilino('public.documentos_gerados');
select public.auditar('public.documentos_gerados');

-- ---------------------------------------------------------------------
-- M8 Banco de modelos com IA (Pro). Embeddings isolados por escritório.
-- ---------------------------------------------------------------------
create extension if not exists vector;

create table public.biblioteca_documentos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  nome text not null,
  arquivo_caminho text,
  tipo_peca text,
  area text,
  texto text not null,
  anonimizado boolean not null default false,
  status_indexacao text not null default 'pendente' check (status_indexacao in ('pendente','indexado','sem_embedding','erro')),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table public.biblioteca_documentos enable row level security;
create policy bib_select on public.biblioteca_documentos for select using (public.is_membro(escritorio_id));
create policy bib_insert on public.biblioteca_documentos for insert
  with check (public.is_membro(escritorio_id) and public.tem_modulo(escritorio_id, 'M8'));
create policy bib_update on public.biblioteca_documentos for update
  using (public.is_membro(escritorio_id)) with check (public.is_membro(escritorio_id));
create policy bib_delete on public.biblioteca_documentos for delete using (public.is_membro(escritorio_id));

create table public.biblioteca_trechos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  documento_id uuid not null references public.biblioteca_documentos(id) on delete cascade,
  ordem integer not null,
  conteudo text not null,
  embedding vector(1024),
  busca tsvector generated always as (to_tsvector('portuguese', conteudo)) stored
);
create index trechos_esc_idx on public.biblioteca_trechos(escritorio_id);
create index trechos_busca_idx on public.biblioteca_trechos using gin(busca);
create index trechos_emb_idx on public.biblioteca_trechos using hnsw (embedding vector_cosine_ops);
select public.rls_inquilino('public.biblioteca_trechos');

-- Busca semântica sempre filtrada pelo escritório (RLS também se aplica: security invoker)
create or replace function public.buscar_trechos(e uuid, consulta vector(1024), limite integer default 8)
returns table (id uuid, documento_id uuid, conteudo text, similaridade double precision)
language sql stable security invoker set search_path = public as $$
  select t.id, t.documento_id, t.conteudo, 1 - (t.embedding <=> consulta) as similaridade
  from public.biblioteca_trechos t
  where t.escritorio_id = e and t.embedding is not null
  order by t.embedding <=> consulta
  limit limite;
$$;

create or replace function public.buscar_trechos_texto(e uuid, consulta text, limite integer default 8)
returns table (id uuid, documento_id uuid, conteudo text, similaridade double precision)
language sql stable security invoker set search_path = public as $$
  select t.id, t.documento_id, t.conteudo,
         ts_rank(t.busca, websearch_to_tsquery('portuguese', consulta))::double precision
  from public.biblioteca_trechos t
  where t.escritorio_id = e and t.busca @@ websearch_to_tsquery('portuguese', consulta)
  order by 4 desc
  limit limite;
$$;

create table public.rascunhos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete set null,
  titulo text not null,
  briefing text not null,
  texto text not null,
  documentos_base uuid[] not null default '{}',
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table public.rascunhos enable row level security;
create policy rasc_select on public.rascunhos for select using (public.is_membro(escritorio_id));
create policy rasc_insert on public.rascunhos for insert
  with check (public.is_membro(escritorio_id) and public.tem_modulo(escritorio_id, 'M8'));
create policy rasc_update on public.rascunhos for update
  using (public.is_membro(escritorio_id)) with check (public.is_membro(escritorio_id));
create policy rasc_delete on public.rascunhos for delete using (public.is_membro(escritorio_id));

-- ---------------------------------------------------------------------
-- M9 Verificador de petição
-- ---------------------------------------------------------------------
create table public.leis_referencia (
  sigla text primary key,          -- ex.: CPC, CC, CF
  nome text not null,
  apelidos text[] not null default '{}', -- variações usadas nas petições
  ultimo_artigo integer not null,
  fonte text
);
select public.rls_global('public.leis_referencia');

create table public.verificacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  titulo text not null,
  texto text not null,
  resultado jsonb not null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table public.verificacoes enable row level security;
create policy ver_select on public.verificacoes for select using (public.is_membro(escritorio_id));
create policy ver_insert on public.verificacoes for insert
  with check (public.is_membro(escritorio_id) and public.tem_modulo(escritorio_id, 'M9'));
create policy ver_delete on public.verificacoes for delete using (public.is_membro(escritorio_id));

-- ---------------------------------------------------------------------
-- M10 Monitor de intimações
-- ---------------------------------------------------------------------
create table public.config_intimacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  provedor text not null default 'djen',
  oab_numero text not null,
  oab_uf text not null,
  nome_advogado text,
  ativo boolean not null default true,
  ultima_captura timestamptz,
  ultimo_erro text,
  criado_em timestamptz not null default now(),
  unique (escritorio_id, oab_numero, oab_uf)
);
alter table public.config_intimacoes enable row level security;
create policy ci_select on public.config_intimacoes for select using (public.is_membro(escritorio_id));
create policy ci_insert on public.config_intimacoes for insert
  with check (public.is_membro(escritorio_id) and public.tem_modulo(escritorio_id, 'M10'));
create policy ci_update on public.config_intimacoes for update
  using (public.is_membro(escritorio_id)) with check (public.is_membro(escritorio_id));
create policy ci_delete on public.config_intimacoes for delete using (public.is_membro(escritorio_id));

create table public.intimacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  provedor text not null,
  id_externo text not null,
  numero_cnj text,
  processo_id uuid references public.processos(id) on delete set null,
  tribunal text,
  orgao text,
  tipo_comunicacao text,
  data_disponibilizacao date,
  texto text,
  link text,
  prazo_sugerido jsonb,
  status text not null default 'nova' check (status in ('nova','confirmada','descartada')),
  tarefa_id uuid references public.tarefas(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (escritorio_id, provedor, id_externo)
);
create index intimacoes_idx on public.intimacoes(escritorio_id, status, data_disponibilizacao desc);
select public.rls_inquilino('public.intimacoes');
select public.auditar('public.intimacoes');

-- Módulo M7 restrito ao plano (bloqueia só a criação de novos documentos)
create policy modulo_m7 on public.documentos_gerados as restrictive for insert
  with check (public.tem_modulo(escritorio_id, 'M7'));
