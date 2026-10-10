import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service role: ignora RLS. Usar SOMENTE em jobs agendados, webhooks e
 * rotinas do servidor que já validaram a autorização do usuário.
 */
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
