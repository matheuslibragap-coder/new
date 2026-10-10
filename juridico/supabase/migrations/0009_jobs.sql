-- =====================================================================
-- 0009 Funções usadas pelos jobs agendados (executadas com service role)
-- =====================================================================

-- Enfileira todos os processos ativos e monitorados de escritórios com assinatura válida
create or replace function public.enfileirar_datajud()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  insert into public.fila_datajud (processo_id, escritorio_id, proxima_tentativa, tentativas)
  select p.id, p.escritorio_id, now(), 0
  from public.processos p
  where p.ativo and p.monitorado and p.datajud_alias is not null
    and p.datajud_status <> 'manual'
    and public.escritorio_ativo(p.escritorio_id)
  on conflict (processo_id) do update set proxima_tentativa = least(public.fila_datajud.proxima_tentativa, now());
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Reserva um lote da fila (evita processamento duplicado entre execuções concorrentes)
create or replace function public.reservar_fila_datajud(lote integer default 20)
returns setof public.fila_datajud language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.fila_datajud f
     set proxima_tentativa = now() + interval '15 minutes'
   where f.processo_id in (
     select processo_id from public.fila_datajud
      where proxima_tentativa <= now()
      order by proxima_tentativa
      limit lote
      for update skip locked)
  returning f.*;
end;
$$;

revoke execute on function public.enfileirar_datajud() from public, anon, authenticated;
revoke execute on function public.reservar_fila_datajud(integer) from public, anon, authenticated;

-- Membros que devem receber alertas de um escritório (com e-mail)
create or replace function public.destinatarios_alerta(e uuid, permissao text default null)
returns table (user_id uuid, email text, nome text)
language sql stable security definer set search_path = public as $$
  select m.user_id, coalesce(m.email, u.email), m.nome
  from public.membros m join auth.users u on u.id = m.user_id
  where m.escritorio_id = e and m.ativo
    and (permissao is null or m.papel = 'titular' or coalesce((m.permissoes ->> permissao)::boolean, false));
$$;
revoke execute on function public.destinatarios_alerta(uuid, text) from public, anon, authenticated;
