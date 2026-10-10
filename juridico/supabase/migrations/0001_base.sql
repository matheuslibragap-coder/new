-- =====================================================================
-- 0001 BASE: escritórios, membros, convites, administradores, auditoria
-- Princípio: todo dado pertence a um escritorio_id e é protegido por RLS.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- ---------------------------------------------------------------------
-- Planos (definidos aqui porque escritorios referencia planos)
-- ---------------------------------------------------------------------
create table public.planos (
  codigo text primary key,
  nome text not null,
  preco_centavos integer not null,
  max_usuarios integer not null,
  max_processos integer not null,
  modulos text[] not null,
  cota_assinaturas_mes integer not null default 0,
  ordem integer not null default 0,
  ativo boolean not null default true
);

-- ---------------------------------------------------------------------
-- Escritórios (inquilinos)
-- ---------------------------------------------------------------------
create table public.escritorios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  uf text,
  plano_codigo text not null default 'essencial' references public.planos(codigo),
  assinatura_status text not null default 'trial'
    check (assinatura_status in ('trial','ativa','inadimplente','cancelada')),
  trial_ate timestamptz not null default (now() + interval '14 days'),
  gateway_cliente_id text,
  gateway_assinatura_id text,
  whatsapp_phone_number_id text,
  criado_em timestamptz not null default now()
);

create table public.membros (
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'advogado' check (papel in ('titular','advogado','assistente')),
  -- permissões finas; titular tem todas
  permissoes jsonb not null default '{"financeiro": true, "configuracoes": false}'::jsonb,
  nome text,
  email text,
  oab_numero text,
  oab_uf text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  primary key (escritorio_id, user_id)
);
create index membros_user_idx on public.membros(user_id);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  email text not null,
  papel text not null default 'advogado' check (papel in ('advogado','assistente')),
  permissoes jsonb not null default '{"financeiro": false, "configuracoes": false}'::jsonb,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  criado_por uuid references auth.users(id) on delete set null,
  aceito_em timestamptz,
  expira_em timestamptz not null default (now() + interval '7 days'),
  criado_em timestamptz not null default now()
);

-- Administradores da plataforma (editam feriados, regras, índices, modelos globais)
create table public.admins_plataforma (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funções auxiliares de autorização (security definer evita recursão de RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_membro(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros
    where escritorio_id = e and user_id = auth.uid() and ativo
  );
$$;

create or replace function public.pode(e uuid, permissao text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros
    where escritorio_id = e and user_id = auth.uid() and ativo
      and (papel = 'titular' or coalesce((permissoes ->> permissao)::boolean, false))
  );
$$;

create or replace function public.is_titular(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.membros
    where escritorio_id = e and user_id = auth.uid() and ativo and papel = 'titular'
  );
$$;

create or replace function public.is_admin_plataforma()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins_plataforma where user_id = auth.uid());
$$;

-- Assinatura válida: ativa, ou em teste dentro do prazo
create or replace function public.escritorio_ativo(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.escritorios
    where id = e
      and (assinatura_status = 'ativa'
           or (assinatura_status = 'trial' and trial_ate > now()))
  );
$$;

-- O plano do escritório inclui o módulo e a assinatura está válida?
create or replace function public.tem_modulo(e uuid, modulo text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.escritorio_ativo(e) and exists (
    select 1 from public.escritorios es join public.planos p on p.codigo = es.plano_codigo
    where es.id = e and modulo = any(p.modulos)
  );
$$;

-- ---------------------------------------------------------------------
-- Criação de escritório no primeiro acesso (onboarding)
-- ---------------------------------------------------------------------
create or replace function public.criar_escritorio(p_nome text, p_uf text default null,
  p_nome_usuario text default null, p_oab_numero text default null, p_oab_uf text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'NAO_AUTENTICADO';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into public.escritorios (nome, uf) values (p_nome, p_uf) returning id into v_id;
  insert into public.membros (escritorio_id, user_id, papel, permissoes, nome, email, oab_numero, oab_uf)
  values (v_id, auth.uid(), 'titular', '{"financeiro": true, "configuracoes": true}'::jsonb,
          p_nome_usuario, v_email, p_oab_numero, p_oab_uf);
  return v_id;
end;
$$;

create or replace function public.aceitar_convite(p_token text, p_nome text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c public.convites%rowtype;
  v_email text;
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO'; end if;
  select * into c from public.convites
    where token = p_token and aceito_em is null and expira_em > now();
  if not found then raise exception 'CONVITE_INVALIDO'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) <> lower(c.email) then raise exception 'CONVITE_OUTRO_EMAIL'; end if;
  perform set_config('app.bypass_protecao', 'on', true);
  insert into public.membros (escritorio_id, user_id, papel, permissoes, nome, email)
  values (c.escritorio_id, auth.uid(), c.papel, c.permissoes, p_nome, v_email)
  on conflict (escritorio_id, user_id) do update set ativo = true, papel = excluded.papel,
    permissoes = excluded.permissoes;
  update public.convites set aceito_em = now() where id = c.id;
  return c.escritorio_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Logs de acesso / auditoria (LGPD)
-- ---------------------------------------------------------------------
create table public.logs_acesso (
  id bigint generated always as identity primary key,
  escritorio_id uuid references public.escritorios(id) on delete cascade,
  user_id uuid,
  acao text not null,
  tabela text,
  registro_id text,
  detalhes jsonb,
  ip text,
  criado_em timestamptz not null default now()
);
create index logs_acesso_esc_idx on public.logs_acesso(escritorio_id, criado_em desc);

create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
begin
  r := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.logs_acesso (escritorio_id, user_id, acao, tabela, registro_id)
  values (
    nullif(r ->> 'escritorio_id', '')::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(r ->> 'id', r ->> 'user_id')
  );
  return null;
end;
$$;

-- Aplica auditoria a uma tabela
create or replace function public.auditar(tabela regclass)
returns void language plpgsql as $$
begin
  execute format(
    'create trigger auditoria after insert or update or delete on %s
     for each row execute function public.registrar_auditoria()', tabela);
end;
$$;

-- Aplica as políticas RLS padrão de inquilino a uma tabela com escritorio_id
create or replace function public.rls_inquilino(tabela regclass, permissao text default null)
returns void language plpgsql as $$
declare
  cond text;
begin
  cond := case when permissao is null
    then 'public.is_membro(escritorio_id)'
    else format('public.pode(escritorio_id, %L)', permissao) end;
  execute format('alter table %s enable row level security', tabela);
  execute format('create policy inquilino_select on %s for select using (%s)', tabela, cond);
  execute format('create policy inquilino_insert on %s for insert with check (%s)', tabela, cond);
  execute format('create policy inquilino_update on %s for update using (%s) with check (%s)', tabela, cond, cond);
  execute format('create policy inquilino_delete on %s for delete using (%s)', tabela, cond);
end;
$$;

-- Tabelas globais: leitura para autenticados, escrita só para admin da plataforma
create or replace function public.rls_global(tabela regclass)
returns void language plpgsql as $$
begin
  execute format('alter table %s enable row level security', tabela);
  execute format('create policy global_select on %s for select to authenticated using (true)', tabela);
  execute format('create policy global_admin_insert on %s for insert with check (public.is_admin_plataforma())', tabela);
  execute format('create policy global_admin_update on %s for update using (public.is_admin_plataforma()) with check (public.is_admin_plataforma())', tabela);
  execute format('create policy global_admin_delete on %s for delete using (public.is_admin_plataforma())', tabela);
end;
$$;

-- ---------------------------------------------------------------------
-- RLS das tabelas base
-- ---------------------------------------------------------------------
select public.rls_global('public.planos');

alter table public.escritorios enable row level security;
create policy escritorio_select on public.escritorios for select using (public.is_membro(id));
-- atualização de dados cadastrais apenas por quem tem permissão de configurações;
-- plano e status de assinatura são alterados somente pelo backend (service role)
create policy escritorio_update on public.escritorios for update
  using (public.pode(id, 'configuracoes')) with check (public.pode(id, 'configuracoes'));

create or replace function public.proteger_campos_escritorio()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' and (
     new.plano_codigo is distinct from old.plano_codigo
     or new.assinatura_status is distinct from old.assinatura_status
     or new.trial_ate is distinct from old.trial_ate
     or new.gateway_cliente_id is distinct from old.gateway_cliente_id
     or new.gateway_assinatura_id is distinct from old.gateway_assinatura_id) then
    raise exception 'CAMPOS_PROTEGIDOS';
  end if;
  return new;
end;
$$;
create trigger proteger_campos before update on public.escritorios
  for each row execute function public.proteger_campos_escritorio();

alter table public.membros enable row level security;
create policy membros_select on public.membros for select using (public.is_membro(escritorio_id));
create policy membros_update on public.membros for update
  using (public.is_titular(escritorio_id) or user_id = auth.uid())
  with check (public.is_titular(escritorio_id) or user_id = auth.uid());
create policy membros_delete on public.membros for delete
  using (public.is_titular(escritorio_id) and user_id <> auth.uid());

-- membro comum não pode promover a si mesmo
create or replace function public.proteger_papel_membro()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role'
     and coalesce(current_setting('app.bypass_protecao', true), '') <> 'on'
     and not public.is_titular(new.escritorio_id)
     and (new.papel is distinct from old.papel or new.permissoes is distinct from old.permissoes
          or new.ativo is distinct from old.ativo) then
    raise exception 'SEM_PERMISSAO';
  end if;
  return new;
end;
$$;
create trigger proteger_papel before update on public.membros
  for each row execute function public.proteger_papel_membro();

alter table public.convites enable row level security;
create policy convites_titular on public.convites for all
  using (public.is_titular(escritorio_id)) with check (public.is_titular(escritorio_id));

alter table public.admins_plataforma enable row level security;
create policy admins_select on public.admins_plataforma for select using (user_id = auth.uid());

alter table public.logs_acesso enable row level security;
create policy logs_select on public.logs_acesso for select using (public.is_titular(escritorio_id));
create policy logs_insert on public.logs_acesso for insert
  with check (public.is_membro(escritorio_id) and user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Notificações in-app e inscrições de push
-- ---------------------------------------------------------------------
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, -- nulo = todos do escritório
  tipo text not null,
  titulo text not null,
  corpo text,
  link text,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);
create index notificacoes_idx on public.notificacoes(escritorio_id, criado_em desc);
select public.rls_inquilino('public.notificacoes');

create table public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
alter table public.push_inscricoes enable row level security;
create policy push_proprio on public.push_inscricoes for all
  using (user_id = auth.uid() and public.is_membro(escritorio_id))
  with check (user_id = auth.uid() and public.is_membro(escritorio_id));
