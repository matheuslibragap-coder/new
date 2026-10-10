import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com service_role: ignora RLS. Usar apenas em rotas de servidor
// que não agem em nome do usuário (webhook de pagamento, exclusão de conta).
export function criarClienteAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
