-- =====================================================================
-- 0003 M2 (motor de prazos e feriados) e M3 (agenda)
-- Nenhuma regra jurídica fica fixa no código: tudo aqui é editável no painel admin.
-- =====================================================================

create table public.feriados (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  descricao text not null,
  abrangencia text not null check (abrangencia in ('nacional','estadual','comarca')),
  uf text,          -- para abrangência estadual
  tribunal text,    -- nulo = vale para todos os tribunais; ex.: TJRS, TRT4
  comarca text,     -- para abrangência comarca (nome normalizado em minúsculas, sem acento)
  -- feriado, recesso e suspensao = dia sem expediente; expediente_reduzido só prorroga início e vencimento (CPC art. 224 §1º)
  tipo text not null default 'feriado' check (tipo in ('feriado','suspensao','recesso','expediente_reduzido')),
  fonte text,       -- link do ato normativo
  validado boolean not null default false, -- conferido por advogado/admin
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index feriados_data_idx on public.feriados(data);
select public.rls_global('public.feriados');
select public.auditar('public.feriados');

create table public.regras_prazo (
  codigo text primary key,
  nome text not null,
  rito text not null,
  contagem text not null check (contagem in ('uteis','corridos')),
  exclui_dia_inicio boolean not null default true,
  -- suspensão anual (ex.: CPC art. 220, 20/12 a 20/1), formato MM-DD
  suspensao_inicio text,
  suspensao_fim text,
  -- DJe: publicação no 1º dia útil após a disponibilização (CPC art. 224, §2º)
  dje_publicacao_dia_util_seguinte boolean not null default true,
  -- Lei 11.419/2006 art. 5º §3º: dias corridos para ciência ficta no portal
  portal_dias_ciencia_ficta integer not null default 10,
  -- prazo começa e vence apenas em dia útil (CPC art. 224 §1º; CPP art. 798 §3º; Súmula 310 STF)
  inicio_e_fim_em_dia_util boolean not null default true,
  permite_dobra boolean not null default true,
  fundamentacao text not null,
  validar_com_advogado boolean not null default true,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
select public.rls_global('public.regras_prazo');
select public.auditar('public.regras_prazo');

-- Prazos/tarefas do escritório
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo text not null default 'prazo' check (tipo in ('prazo','tarefa')),
  data_evento date,          -- disponibilização ou intimação
  tipo_evento text,
  dias integer,
  regra_codigo text references public.regras_prazo(codigo),
  em_dobro boolean not null default false,
  data_vencimento date not null,
  memoria jsonb,             -- memória de cálculo dia a dia
  status text not null default 'aberta' check (status in ('aberta','concluida','cancelada')),
  responsavel_id uuid references auth.users(id) on delete set null,
  origem text not null default 'manual' check (origem in ('manual','calculadora','intimacao')),
  alertas_enviados text[] not null default '{}', -- ex.: {D-5,D-2,D-0}
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  concluida_em timestamptz
);
create index tarefas_venc_idx on public.tarefas(escritorio_id, status, data_vencimento);
select public.rls_inquilino('public.tarefas');
select public.auditar('public.tarefas');

-- M3: audiências e compromissos
create table public.compromissos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete set null,
  titulo text not null,
  tipo text not null default 'audiencia'
    check (tipo in ('audiencia','reuniao','pericia','diligencia','sessao_julgamento','outro')),
  subtipo text, -- ex.: conciliação, instrução e julgamento
  inicio timestamptz not null,
  fim timestamptz,
  modalidade text not null default 'presencial' check (modalidade in ('presencial','virtual','hibrida')),
  link_sala text,
  local text,
  observacoes text,
  alertas_minutos integer[] not null default '{1440,60}',
  alertas_enviados integer[] not null default '{}',
  responsavel_id uuid references auth.users(id) on delete set null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index compromissos_inicio_idx on public.compromissos(escritorio_id, inicio);
select public.rls_inquilino('public.compromissos');
select public.auditar('public.compromissos');

create table public.compromisso_anexos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  compromisso_id uuid not null references public.compromissos(id) on delete cascade,
  nome text not null,
  caminho text not null, -- storage: documentos/{escritorio_id}/...
  tamanho integer,
  criado_em timestamptz not null default now()
);
select public.rls_inquilino('public.compromisso_anexos');

-- Token para assinatura do calendário .ics (link privado por usuário)
create table public.calendario_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  criado_em timestamptz not null default now(),
  primary key (user_id, escritorio_id)
);
alter table public.calendario_tokens enable row level security;
create policy cal_proprio on public.calendario_tokens for all
  using (user_id = auth.uid() and public.is_membro(escritorio_id))
  with check (user_id = auth.uid() and public.is_membro(escritorio_id));
