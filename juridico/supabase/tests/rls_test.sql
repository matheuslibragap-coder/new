-- Teste de isolamento multi-inquilino e cotas. Rodar após stub + migrations.
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'a@teste.com'),
                              ('00000000-0000-0000-0000-00000000000b', 'b@teste.com'),
                              ('00000000-0000-0000-0000-00000000000c', 'c@teste.com');

create or replace function pg_temp.como(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end $$;

set role authenticated;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select public.criar_escritorio('Escritório A', 'RS', 'Ana', '1', 'RS') as esc_a \gset
insert into public.clientes (escritorio_id, nome) values (:'esc_a', 'Cliente de A');

select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select public.criar_escritorio('Escritório B', 'RS') as esc_b \gset
insert into public.clientes (escritorio_id, nome) values (:'esc_b', 'Cliente de B');

-- B não vê nada de A
do $$ begin
  if (select count(*) from public.clientes) <> 1 then raise exception 'FALHA: B viu clientes de A'; end if;
  if (select count(*) from public.escritorios) <> 1 then raise exception 'FALHA: B viu escritório de A'; end if;
end $$;

-- B não consegue inserir no escritório de A
\set QUIET 1
select set_config('t.esc_a', :'esc_a', false);
do $$ declare ok boolean := false; begin
  begin
    execute format('insert into public.clientes (escritorio_id, nome) values (%L, %L)', current_setting('t.esc_a'), 'invasor');
  exception when insufficient_privilege or check_violation then ok := true;
           when others then ok := sqlstate = '42501'; end;
  if not ok then raise exception 'FALHA: B inseriu em A'; end if;
end $$;

-- B não pode alterar o próprio plano
do $$ declare ok boolean := false; begin
  begin update public.escritorios set plano_codigo = 'pro'; exception when others then ok := true; end;
  if not ok then raise exception 'FALHA: plano alterado pelo usuário'; end if;
end $$;

-- Cota: Essencial permite 30 processos monitorados
do $$ declare e uuid; ok boolean := false; begin
  select id into e from public.escritorios;
  for i in 1..30 loop
    insert into public.processos (escritorio_id, numero_cnj) values (e, lpad(i::text, 20, '0'));
  end loop;
  begin
    insert into public.processos (escritorio_id, numero_cnj) values (e, lpad('31', 20, '0'));
  exception when others then ok := sqlerrm = 'COTA_PROCESSOS'; end;
  if not ok then raise exception 'FALHA: cota de processos não aplicada'; end if;
  -- sem monitoramento a criação é permitida (não bloqueia o acesso aos dados)
  insert into public.processos (escritorio_id, numero_cnj, monitorado) values (e, lpad('32', 20, '0'), false);
end $$;

-- Módulo Pro bloqueado no Essencial
do $$ declare e uuid; ok boolean := false; begin
  select id into e from public.escritorios;
  begin
    insert into public.verificacoes (escritorio_id, titulo, texto, resultado) values (e, 't', 't', '{}');
  exception when others then ok := true; end;
  if not ok then raise exception 'FALHA: M9 liberado no Essencial'; end if;
end $$;

-- Mensagem não pode ser marcada como enviada sem aprovação
do $$ declare e uuid; ok boolean := false; begin
  select id into e from public.escritorios;
  begin
    insert into public.mensagens_cliente (escritorio_id, texto_final, status) values (e, 'oi', 'enviada');
  exception when others then ok := sqlerrm = 'ENVIO_SEM_APROVACAO'; end;
  if not ok then raise exception 'FALHA: envio sem aprovação'; end if;
end $$;

-- Convite: A convida C; C aceita; cota de usuários do Essencial é 1
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into public.convites (escritorio_id, email) values (:'esc_a', 'c@teste.com') returning token as tok \gset
select set_config('t.tok', :'tok', false);
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
do $$ declare ok boolean := false; begin
  begin perform public.aceitar_convite(current_setting('t.tok')); exception when others then ok := sqlerrm = 'COTA_USUARIOS'; end;
  if not ok then raise exception 'FALHA: cota de usuários'; end if;
end $$;

-- Tabelas globais: leitura sim, escrita não
do $$ declare ok boolean := false; begin
  if (select count(*) from public.feriados) = 0 then raise exception 'FALHA: feriados invisíveis'; end if;
  begin insert into public.feriados (data, descricao, abrangencia) values ('2030-01-01','x','nacional');
  exception when others then ok := true; end;
  if not ok then raise exception 'FALHA: não admin escreveu feriado'; end if;
end $$;

reset role;
select 'RLS OK' as resultado;
