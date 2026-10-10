-- =====================================================================
-- 0002 M1: clientes, processos, andamentos, fila de consulta ao DataJud
-- =====================================================================

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  nome text not null,
  tipo_pessoa text not null default 'fisica' check (tipo_pessoa in ('fisica','juridica')),
  documento text, -- CPF ou CNPJ, só dígitos
  whatsapp text,  -- formato E.164 sem +, ex.: 5551999999999
  email text,
  nacionalidade text,
  estado_civil text,
  profissao text,
  endereco text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index clientes_esc_idx on public.clientes(escritorio_id, nome);
create unique index clientes_doc_unq on public.clientes(escritorio_id, documento) where documento is not null;
select public.rls_inquilino('public.clientes');
select public.auditar('public.clientes');

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  numero_cnj text not null, -- 20 dígitos, sem máscara
  tribunal_sigla text,      -- ex.: TJRS, TRT4
  datajud_alias text,       -- ex.: tjrs, trt4
  uf text,
  comarca text,
  vara text,
  area text,                -- cível, trabalhista, família, penal...
  polo text check (polo in ('ativo','passivo','terceiro','outro')),
  rito text not null default 'civel_cpc', -- referência a regras_prazo.codigo
  classe text,
  assunto text,
  orgao_julgador text,
  grau text,
  data_ajuizamento timestamptz,
  sigiloso boolean not null default false,
  monitorado boolean not null default true,
  ativo boolean not null default true,
  datajud_status text not null default 'pendente'
    check (datajud_status in ('pendente','ok','nao_encontrado','erro','manual')),
  datajud_ultima_consulta timestamptz,
  datajud_ultima_atualizacao timestamptz,
  datajud_erro text,
  dados_capa jsonb,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (escritorio_id, numero_cnj)
);
create index processos_esc_idx on public.processos(escritorio_id, ativo);
create index processos_cliente_idx on public.processos(cliente_id);
select public.rls_inquilino('public.processos');
select public.auditar('public.processos');

create table public.andamentos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  processo_id uuid not null references public.processos(id) on delete cascade,
  data_hora timestamptz not null,
  codigo integer,
  nome text not null,
  complementos jsonb,
  orgao_julgador text,
  origem text not null default 'datajud' check (origem in ('datajud','manual','intimacao')),
  hash text not null,
  importacao_inicial boolean not null default false,
  visto_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (processo_id, hash)
);
create index andamentos_proc_idx on public.andamentos(processo_id, data_hora desc);
create index andamentos_esc_idx on public.andamentos(escritorio_id, criado_em desc);
select public.rls_inquilino('public.andamentos');

-- Fila do job diário com backoff exponencial (usada só pelo backend com service role)
create table public.fila_datajud (
  processo_id uuid primary key references public.processos(id) on delete cascade,
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  proxima_tentativa timestamptz not null default now(),
  tentativas integer not null default 0,
  ultimo_erro text,
  enfileirado_em timestamptz not null default now()
);
create index fila_datajud_prox_idx on public.fila_datajud(proxima_tentativa);
alter table public.fila_datajud enable row level security;
create policy fila_select on public.fila_datajud for select using (public.is_membro(escritorio_id));

-- ---------------------------------------------------------------------
-- Cota de processos monitorados por plano (bloqueia só a ação nova)
-- ---------------------------------------------------------------------
create or replace function public.verificar_cota_processos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_max integer;
  v_atual integer;
begin
  if not (new.monitorado and new.ativo) then return new; end if;
  if tg_op = 'UPDATE' and old.monitorado and old.ativo then return new; end if;

  if not public.escritorio_ativo(new.escritorio_id) then
    raise exception 'ASSINATURA_INATIVA' using hint = 'Regularize a assinatura para monitorar novos processos.';
  end if;

  select p.max_processos into v_max
    from public.escritorios e join public.planos p on p.codigo = e.plano_codigo
    where e.id = new.escritorio_id;
  select count(*) into v_atual from public.processos
    where escritorio_id = new.escritorio_id and monitorado and ativo
      and id <> new.id;
  if v_atual >= v_max then
    raise exception 'COTA_PROCESSOS' using hint = format('Seu plano permite até %s processos monitorados.', v_max);
  end if;
  return new;
end;
$$;
create trigger cota_processos before insert or update of monitorado, ativo on public.processos
  for each row execute function public.verificar_cota_processos();

-- Cota de usuários por plano
create or replace function public.verificar_cota_usuarios()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_max integer;
  v_atual integer;
begin
  select p.max_usuarios into v_max
    from public.escritorios e join public.planos p on p.codigo = e.plano_codigo
    where e.id = new.escritorio_id;
  select count(*) into v_atual from public.membros
    where escritorio_id = new.escritorio_id and ativo and user_id <> new.user_id;
  if v_atual >= v_max then
    raise exception 'COTA_USUARIOS' using hint = format('Seu plano permite até %s usuários.', v_max);
  end if;
  return new;
end;
$$;
create trigger cota_usuarios before insert on public.membros
  for each row execute function public.verificar_cota_usuarios();

create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end;
$$;
create trigger tocar before update on public.clientes for each row execute function public.tocar_atualizado_em();
create trigger tocar before update on public.processos for each row execute function public.tocar_atualizado_em();
