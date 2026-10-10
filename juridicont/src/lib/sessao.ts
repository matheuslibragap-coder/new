import "server-only";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Conta, Perfil, Plano } from "@/lib/tipos";

/** Usuário autenticado + perfil. Redireciona para o login se não houver sessão. */
export async function exigirUsuario() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/entrar");
  const { data: perfil } = await supabase.from("perfis").select("*").eq("id", data.user.id).single();
  if (!perfil) redirect("/entrar");
  return { supabase, user: data.user, perfil: perfil as Perfil };
}

/** Igual a exigirUsuario, mas também exige onboarding concluído. */
export async function exigirUsuarioPronto() {
  const sessao = await exigirUsuario();
  if (!sessao.perfil.onboarding_concluido) redirect("/onboarding");
  return sessao;
}

export async function exigirAdmin() {
  const sessao = await exigirUsuario();
  if (sessao.perfil.papel !== "admin") redirect("/app");
  return sessao;
}

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/** Conta com ciclo já normalizado (zera contadores se a data de renovação passou). */
export async function obterConta(supabase: Cliente) {
  const { data, error } = await supabase.rpc("minha_conta");
  if (error || !data) throw new Error("Falha ao carregar a conta: " + (error?.message ?? ""));
  const conta = data as Conta;
  const { data: plano } = await supabase.from("planos").select("*").eq("codigo", conta.plano).single();
  return { conta, plano: plano as Plano };
}

export async function listarPlanos(supabase: Cliente) {
  const { data } = await supabase.from("planos").select("*").order("ordem");
  return (data ?? []) as Plano[];
}

/** Para rotas de API: devolve null em vez de redirecionar. */
export async function usuarioDaApi() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: perfil } = await supabase.from("perfis").select("*").eq("id", data.user.id).single();
  if (!perfil) return null;
  return { supabase, user: data.user, perfil: perfil as Perfil };
}
