-- =====================================================================
-- 0004 M4 (tradutor de andamento) + planos, pagamentos e cotas
-- =====================================================================

create table public.mensagens_cliente (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  andamento_id uuid references public.andamentos(id) on delete set null,
  processo_id uuid references public.processos(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  texto_gerado text,
  texto_final text,
  status text not null default 'rascunho'
    check (status in ('rascunho','aprovada','enviada','descartada','erro_envio')),
  canal text check (canal in ('wa_me','whatsapp_api')),
  aprovada_por uuid references auth.users(id) on delete set null,
  aprovada_em timestamptz,
  enviada_em timestamptz,
  erro text,
  criado_em timestamptz not null default now()
);
create index mensagens_esc_idx on public.mensagens_cliente(escritorio_id, status, criado_em desc);
select public.rls_inquilino('public.mensagens_cliente');
select public.auditar('public.mensagens_cliente');

-- Nada é enviado sem aprovação: o banco recusa marcar como enviada sem aprovação registrada
create or replace function public.exigir_aprovacao_envio()
returns trigger language plpgsql as $$
begin
  if new.status = 'enviada' and (new.aprovada_em is null or new.aprovada_por is null) then
    raise exception 'ENVIO_SEM_APROVACAO';
  end if;
  return new;
end;
$$;
create trigger exigir_aprovacao before insert or update on public.mensagens_cliente
  for each row execute function public.exigir_aprovacao_envio();

-- ---------------------------------------------------------------------
-- Pagamentos (eventos do gateway, gravados só pelo backend)
-- ---------------------------------------------------------------------
create table public.pagamentos_eventos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid references public.escritorios(id) on delete cascade,
  gateway text not null,
  evento text not null,
  id_externo text,
  valor_centavos integer,
  payload jsonb,
  criado_em timestamptz not null default now(),
  unique (gateway, id_externo, evento)
);
alter table public.pagamentos_eventos enable row level security;
create policy pag_select on public.pagamentos_eventos for select using (public.is_titular(escritorio_id));

-- ---------------------------------------------------------------------
-- Uso de cotas mensais (ex.: assinaturas eletrônicas)
-- ---------------------------------------------------------------------
create table public.uso_cotas (
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  recurso text not null,
  periodo text not null, -- AAAA-MM
  quantidade integer not null default 0,
  primary key (escritorio_id, recurso, periodo)
);
alter table public.uso_cotas enable row level security;
create policy uso_select on public.uso_cotas for select using (public.is_membro(escritorio_id));

-- Consome uma unidade da cota mensal; retorna false se excedida (bloqueia só a ação nova)
create or replace function public.consumir_cota(e uuid, p_recurso text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_limite integer;
  v_periodo text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
  v_uso integer;
begin
  if not public.is_membro(e) and auth.role() <> 'service_role' then
    raise exception 'SEM_PERMISSAO';
  end if;
  if not public.escritorio_ativo(e) then return false; end if;
  if p_recurso = 'assinatura_eletronica' then
    select p.cota_assinaturas_mes into v_limite
      from public.escritorios es join public.planos p on p.codigo = es.plano_codigo where es.id = e;
  else
    raise exception 'RECURSO_DESCONHECIDO';
  end if;
  insert into public.uso_cotas (escritorio_id, recurso, periodo, quantidade)
    values (e, p_recurso, v_periodo, 0)
    on conflict do nothing;
  select quantidade into v_uso from public.uso_cotas
    where escritorio_id = e and recurso = p_recurso and periodo = v_periodo for update;
  if v_uso >= v_limite then return false; end if;
  update public.uso_cotas set quantidade = quantidade + 1
    where escritorio_id = e and recurso = p_recurso and periodo = v_periodo;
  return true;
end;
$$;

-- Resumo de uso para a tela de plano
create or replace function public.resumo_plano(e uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_membro(e) then null else jsonb_build_object(
    'plano', to_jsonb(p),
    'assinatura_status', es.assinatura_status,
    'trial_ate', es.trial_ate,
    'ativo', public.escritorio_ativo(e),
    'processos_monitorados', (select count(*) from public.processos where escritorio_id = e and monitorado and ativo),
    'usuarios', (select count(*) from public.membros where escritorio_id = e and ativo),
    'assinaturas_mes', coalesce((select quantidade from public.uso_cotas where escritorio_id = e
        and recurso = 'assinatura_eletronica'
        and periodo = to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM')), 0)
  ) end
  from public.escritorios es join public.planos p on p.codigo = es.plano_codigo
  where es.id = e;
$$;
