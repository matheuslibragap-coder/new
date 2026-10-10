import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "./supabase/server";

export type Plano = {
  codigo: string;
  nome: string;
  preco_centavos: number;
  max_usuarios: number;
  max_processos: number;
  modulos: string[];
  cota_assinaturas_mes: number;
};

export type Escritorio = {
  id: string;
  nome: string;
  documento: string | null;
  uf: string | null;
  plano_codigo: string;
  assinatura_status: "trial" | "ativa" | "inadimplente" | "cancelada";
  trial_ate: string;
  gateway_cliente_id: string | null;
  gateway_assinatura_id: string | null;
  whatsapp_phone_number_id: string | null;
  planos: Plano;
};

export type Membro = {
  escritorio_id: string;
  user_id: string;
  papel: "titular" | "advogado" | "assistente";
  permissoes: Record<string, boolean>;
  nome: string | null;
  email: string | null;
  oab_numero: string | null;
  oab_uf: string | null;
};

export const COOKIE_ESCRITORIO = "escritorio_atual";

/** Usuário autenticado (ou redireciona para o login). */
export const obterUsuario = cache(async () => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  return { supabase, user: data.user };
});

/**
 * Contexto do escritório atual: membro, escritório, plano e permissões.
 * Sem escritório, leva ao onboarding.
 */
export const obterContexto = cache(async () => {
  const { supabase, user } = await obterUsuario();
  const { data: membros } = await supabase
    .from("membros")
    .select("escritorio_id, user_id, papel, permissoes, nome, email, oab_numero, oab_uf")
    .eq("user_id", user.id)
    .eq("ativo", true);
  if (!membros || membros.length === 0) redirect("/bem-vindo");
  const preferido = (await cookies()).get(COOKIE_ESCRITORIO)?.value;
  const membro = (membros.find((m) => m.escritorio_id === preferido) ?? membros[0]) as Membro;

  const { data: escritorio } = await supabase.from("escritorios").select("*, planos(*)").eq("id", membro.escritorio_id).single();
  if (!escritorio) redirect("/bem-vindo");
  const esc = escritorio as Escritorio;
  const { data: admin } = await supabase.from("admins_plataforma").select("user_id").eq("user_id", user.id).maybeSingle();

  const assinaturaValida = esc.assinatura_status === "ativa" || (esc.assinatura_status === "trial" && new Date(esc.trial_ate) > new Date());
  const pode = (permissao: string) => membro.papel === "titular" || !!membro.permissoes?.[permissao];
  const temModulo = (modulo: string) => assinaturaValida && esc.planos.modulos.includes(modulo);
  const planoInclui = (modulo: string) => esc.planos.modulos.includes(modulo);

  return {
    supabase,
    user,
    membro,
    escritorio: esc,
    plano: esc.planos,
    outrosEscritorios: membros.length > 1 ? membros.map((m) => m.escritorio_id) : [],
    assinaturaValida,
    isAdmin: !!admin,
    pode,
    temModulo,
    planoInclui,
  };
});

export type Contexto = Awaited<ReturnType<typeof obterContexto>>;

/** Registra um evento de acesso relevante (LGPD). */
export async function registrarAcesso(ctx: Contexto, acao: string, detalhes?: Record<string, unknown>) {
  await ctx.supabase.from("logs_acesso").insert({ escritorio_id: ctx.escritorio.id, user_id: ctx.user.id, acao, detalhes: detalhes ?? null });
}
