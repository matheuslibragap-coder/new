-- Juridicont: schema inicial
-- Executar no SQL Editor do Supabase (ou via `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfis (dados profissionais editáveis pelo próprio usuário)
-- ---------------------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nome_profissional text,
  areas text[] not null default '{}',
  cidade text,
  tom text check (tom in ('formal', 'acessivel')),
  papel text not null default 'usuario' check (papel in ('usuario', 'admin')),
  onboarding_concluido boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Planos (fonte única dos limites; lida pelo backend e pela interface)
-- ---------------------------------------------------------------------------
create table public.planos (
  codigo text primary key check (codigo in ('gratuito', 'essencial', 'pro')),
  nome text not null,
  preco_centavos integer not null,
  limite_checagens integer not null,
  limite_posts integer not null,
  limite_auditorias integer not null,
  permite_reels boolean not null default false,
  permite_anuncio boolean not null default false,
  ordem integer not null default 0
);

insert into public.planos
  (codigo, nome, preco_centavos, limite_checagens, limite_posts, limite_auditorias, permite_reels, permite_anuncio, ordem)
values
  ('gratuito',  'Gratuito',  0,    3,   0,  1, false, false, 0),
  ('essencial', 'Essencial', 1990, 100, 12, 1, false, false, 1),
  ('pro',       'Pro',       4990, 300, 40, 1, true,  true,  2);

-- ---------------------------------------------------------------------------
-- Contas (plano, assinatura e contadores). Somente leitura para o usuário.
-- ---------------------------------------------------------------------------
create table public.contas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plano text not null default 'gratuito' references public.planos (codigo),
  assinatura_status text not null default 'nenhuma'
    check (assinatura_status in ('nenhuma', 'pendente', 'ativa', 'atrasada', 'cancelada')),
  plano_pendente text references public.planos (codigo),
  asaas_customer_id text,
  asaas_subscription_id text,
  ciclo_inicio timestamptz not null default now(),
  ciclo_fim timestamptz not null default (now() + interval '1 month'),
  checagens_usadas integer not null default 0,
  posts_usados integer not null default 0,
  auditorias_usadas integer not null default 0,
  atualizado_em timestamptz not null default now()
);

-- Cria perfil e conta automaticamente quando um usuário se cadastra
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome_profissional)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  insert into public.contas (user_id) values (new.id);
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Base de regras
-- ---------------------------------------------------------------------------
create table public.regras (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Z][A-Z0-9_]*$' and codigo <> 'NAO_CATALOGADO'),
  titulo text not null,
  dispositivo text not null,
  descricao text not null,
  exemplos_vedados text[] not null default '{}',
  exemplos_conformes text[] not null default '{}',
  severidade_padrao text not null check (severidade_padrao in ('vermelho', 'amarelo')),
  ativa boolean not null default true,
  revisao_pendente boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Versão global da base de regras: incrementa a cada alteração
create table public.regras_versao (
  id integer primary key default 1 check (id = 1),
  versao integer not null default 1,
  atualizado_em timestamptz not null default now()
);
insert into public.regras_versao (id, versao) values (1, 1);

create or replace function public.incrementar_versao_regras()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.regras_versao set versao = versao + 1, atualizado_em = now() where id = 1;
  return null;
end;
$$;

create trigger regras_alteradas
  after insert or update or delete on public.regras
  for each row execute function public.incrementar_versao_regras();

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger regras_atualizado_em before update on public.regras
  for each row execute function public.tocar_atualizado_em();
create trigger perfis_atualizado_em before update on public.perfis
  for each row execute function public.tocar_atualizado_em();
create trigger contas_atualizado_em before update on public.contas
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- Checagens (histórico)
-- ---------------------------------------------------------------------------
create table public.checagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  origem text not null default 'checador' check (origem in ('checador', 'gerador', 'auditoria')),
  tipo_conteudo text not null,
  texto text,
  imagem_path text,
  classificacao text not null check (classificacao in ('verde', 'amarelo', 'vermelho')),
  resultado jsonb not null,
  regras_versao integer not null,
  regras_snapshot jsonb not null,
  modelo text,
  criado_em timestamptz not null default now()
);
create index checagens_user_criado on public.checagens (user_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Posts gerados
-- ---------------------------------------------------------------------------
create table public.posts_gerados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  formato text not null check (formato in ('carrossel', 'legenda', 'reels')),
  tema text,
  conteudo jsonb not null,
  checagem_id uuid references public.checagens (id) on delete set null,
  tentativas integer not null default 1,
  criado_em timestamptz not null default now()
);
create index posts_user_criado on public.posts_gerados (user_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Auditorias de perfil
-- ---------------------------------------------------------------------------
create table public.auditorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entrada jsonb not null,
  resultado jsonb not null,
  nota integer not null check (nota between 0 and 100),
  regras_versao integer not null,
  criado_em timestamptz not null default now()
);
create index auditorias_user_criado on public.auditorias (user_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Logs de validação (achados descartados, JSON inválido etc.)
-- ---------------------------------------------------------------------------
create table public.logs_validacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  tipo text not null,
  detalhe jsonb not null,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Eventos de pagamento (idempotência do webhook). Só service_role acessa.
-- ---------------------------------------------------------------------------
create table public.pagamentos_eventos (
  id uuid primary key default gen_random_uuid(),
  evento_id text unique,
  evento text not null,
  pagamento_id text,
  user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null,
  criado_em timestamptz not null default now()
);
create table public.ciclos_pagos (
  pagamento_id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.planos enable row level security;
alter table public.contas enable row level security;
alter table public.regras enable row level security;
alter table public.regras_versao enable row level security;
alter table public.checagens enable row level security;
alter table public.posts_gerados enable row level security;
alter table public.auditorias enable row level security;
alter table public.logs_validacao enable row level security;
alter table public.pagamentos_eventos enable row level security;
alter table public.ciclos_pagos enable row level security;

-- perfis: cada um vê e edita o próprio; admin vê todos
create policy perfis_select on public.perfis for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy perfis_update on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- O usuário só pode alterar colunas não sensíveis (papel fica de fora)
revoke update on public.perfis from authenticated, anon;
grant update (nome_profissional, areas, cidade, tom, onboarding_concluido) on public.perfis to authenticated;

-- planos: leitura pública
create policy planos_select on public.planos for select to anon, authenticated using (true);

-- contas: somente leitura da própria conta. Escrita apenas por funções e service_role.
create policy contas_select on public.contas for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.contas from authenticated, anon;

-- regras: usuários leem as ativas; admin lê e escreve todas
create policy regras_select on public.regras for select to authenticated
  using (ativa or public.is_admin());
create policy regras_insert on public.regras for insert to authenticated
  with check (public.is_admin());
create policy regras_update on public.regras for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy regras_delete on public.regras for delete to authenticated
  using (public.is_admin());

create policy regras_versao_select on public.regras_versao for select to authenticated using (true);

-- checagens, posts, auditorias: cada usuário só vê e cria os próprios
create policy checagens_select on public.checagens for select to authenticated using (user_id = auth.uid());
create policy checagens_insert on public.checagens for insert to authenticated with check (user_id = auth.uid());
create policy checagens_delete on public.checagens for delete to authenticated using (user_id = auth.uid());

create policy posts_select on public.posts_gerados for select to authenticated using (user_id = auth.uid());
create policy posts_insert on public.posts_gerados for insert to authenticated with check (user_id = auth.uid());
create policy posts_delete on public.posts_gerados for delete to authenticated using (user_id = auth.uid());

create policy auditorias_select on public.auditorias for select to authenticated using (user_id = auth.uid());
create policy auditorias_insert on public.auditorias for insert to authenticated with check (user_id = auth.uid());
create policy auditorias_delete on public.auditorias for delete to authenticated using (user_id = auth.uid());

-- logs: o usuário registra, só admin lê
create policy logs_insert on public.logs_validacao for insert to authenticated with check (user_id = auth.uid());
create policy logs_select on public.logs_validacao for select to authenticated using (public.is_admin());

-- pagamentos_eventos e ciclos_pagos: sem políticas (apenas service_role)

-- ---------------------------------------------------------------------------
-- Controle de cota
-- ---------------------------------------------------------------------------

-- Normaliza o ciclo: se a data de renovação passou, zera contadores e avança o ciclo.
-- Plano pago sem assinatura ativa volta para o gratuito na virada do ciclo.
create or replace function public._normalizar_ciclo(p_user uuid)
returns public.contas
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.contas;
begin
  select * into c from public.contas where user_id = p_user for update;
  if not found then
    raise exception 'conta inexistente';
  end if;

  if now() >= c.ciclo_fim then
    if c.plano <> 'gratuito' and c.assinatura_status <> 'ativa' then
      c.plano := 'gratuito';
    end if;
    while c.ciclo_fim <= now() loop
      c.ciclo_inicio := c.ciclo_fim;
      c.ciclo_fim := c.ciclo_fim + interval '1 month';
    end loop;
    update public.contas
       set plano = c.plano,
           ciclo_inicio = c.ciclo_inicio,
           ciclo_fim = c.ciclo_fim,
           checagens_usadas = 0,
           posts_usados = 0,
           auditorias_usadas = 0
     where user_id = p_user
     returning * into c;
  end if;
  return c;
end;
$$;

-- Consome uma unidade de cota de forma atômica.
-- p_tipo: 'checagem' | 'post' | 'auditoria'
create or replace function public.consumir_cota(p_tipo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.contas;
  p public.planos;
  usados integer;
  limite integer;
begin
  if uid is null then
    raise exception 'não autenticado';
  end if;
  c := public._normalizar_ciclo(uid);
  select * into p from public.planos where codigo = c.plano;

  if p_tipo = 'checagem' then
    usados := c.checagens_usadas; limite := p.limite_checagens;
  elsif p_tipo = 'post' then
    usados := c.posts_usados; limite := p.limite_posts;
  elsif p_tipo = 'auditoria' then
    usados := c.auditorias_usadas; limite := p.limite_auditorias;
  else
    raise exception 'tipo de cota inválido';
  end if;

  if usados >= limite then
    return jsonb_build_object('ok', false, 'usados', usados, 'limite', limite, 'plano', c.plano, 'renova_em', c.ciclo_fim);
  end if;

  if p_tipo = 'checagem' then
    update public.contas set checagens_usadas = checagens_usadas + 1 where user_id = uid;
  elsif p_tipo = 'post' then
    update public.contas set posts_usados = posts_usados + 1 where user_id = uid;
  else
    update public.contas set auditorias_usadas = auditorias_usadas + 1 where user_id = uid;
  end if;

  return jsonb_build_object('ok', true, 'usados', usados + 1, 'limite', limite, 'plano', c.plano, 'renova_em', c.ciclo_fim);
end;
$$;

-- Devolve uma unidade quando a operação falha depois do consumo
create or replace function public.devolver_cota(p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'não autenticado';
  end if;
  if p_tipo = 'checagem' then
    update public.contas set checagens_usadas = greatest(checagens_usadas - 1, 0) where user_id = uid;
  elsif p_tipo = 'post' then
    update public.contas set posts_usados = greatest(posts_usados - 1, 0) where user_id = uid;
  elsif p_tipo = 'auditoria' then
    update public.contas set auditorias_usadas = greatest(auditorias_usadas - 1, 0) where user_id = uid;
  end if;
end;
$$;

-- Retorna a conta já normalizada (para exibir cotas atualizadas)
create or replace function public.minha_conta()
returns public.contas
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  return public._normalizar_ciclo(auth.uid());
end;
$$;

revoke execute on function public._normalizar_ciclo(uuid) from public, anon, authenticated;
revoke execute on function public.consumir_cota(text) from public, anon;
revoke execute on function public.devolver_cota(text) from public, anon;
revoke execute on function public.minha_conta() from public, anon;
grant execute on function public.consumir_cota(text) to authenticated;
grant execute on function public.devolver_cota(text) to authenticated;
grant execute on function public.minha_conta() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para imagens enviadas ao checador
-- Os arquivos ficam em <user_id>/<arquivo>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('conteudos', 'conteudos', false)
on conflict (id) do nothing;

create policy conteudos_select on storage.objects for select to authenticated
  using (bucket_id = 'conteudos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy conteudos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'conteudos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy conteudos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'conteudos' and (storage.foldername(name))[1] = auth.uid()::text);
