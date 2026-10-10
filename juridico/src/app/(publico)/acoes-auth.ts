"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { voltarCom, texto } from "@/lib/acoes";

async function origem() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_URL_APP || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

function caminhoSeguro(v: string): string {
  return v.startsWith("/") && !v.startsWith("//") ? v : "/painel";
}

export async function entrar(fd: FormData) {
  const supabase = await criarClienteServidor();
  const voltar = caminhoSeguro(texto(fd, "voltar") || "/painel");
  const { error } = await supabase.auth.signInWithPassword({ email: texto(fd, "email"), password: String(fd.get("senha") ?? "") });
  if (error) voltarCom("/entrar", { erro: "E-mail ou senha incorretos, ou e-mail ainda não confirmado." });
  redirect(voltar);
}

export async function entrarComGoogle(fd: FormData) {
  const supabase = await criarClienteServidor();
  const voltar = caminhoSeguro(texto(fd, "voltar") || "/painel");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origem()}/auth/callback?proximo=${encodeURIComponent(voltar)}` },
  });
  if (error || !data.url) voltarCom("/entrar", { erro: "Não foi possível iniciar o login com Google." });
  redirect(data.url);
}

export async function cadastrar(fd: FormData) {
  const supabase = await criarClienteServidor();
  const senha = String(fd.get("senha") ?? "");
  if (senha.length < 8) voltarCom("/cadastro", { erro: "A senha deve ter pelo menos 8 caracteres." });
  if (!fd.get("aceite")) voltarCom("/cadastro", { erro: "É preciso aceitar os termos de uso e a política de privacidade." });
  const proximo = caminhoSeguro(texto(fd, "voltar") || "/bem-vindo");
  const { data, error } = await supabase.auth.signUp({
    email: texto(fd, "email"),
    password: senha,
    options: { emailRedirectTo: `${await origem()}/auth/callback?proximo=${encodeURIComponent(proximo)}`, data: { nome: texto(fd, "nome") } },
  });
  if (error) voltarCom("/cadastro", { erro: "Não foi possível criar a conta. Verifique o e-mail informado." });
  if (data.session) redirect(proximo);
  voltarCom("/entrar", { ok: "Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre." });
}

export async function recuperarSenha(fd: FormData) {
  const supabase = await criarClienteServidor();
  await supabase.auth.resetPasswordForEmail(texto(fd, "email"), { redirectTo: `${await origem()}/auth/callback?proximo=/auth/nova-senha` });
  voltarCom("/recuperar-senha", { ok: "Se o e-mail estiver cadastrado, você receberá um link para criar nova senha." });
}

export async function definirNovaSenha(fd: FormData) {
  const supabase = await criarClienteServidor();
  const senha = String(fd.get("senha") ?? "");
  if (senha.length < 8) voltarCom("/auth/nova-senha", { erro: "A senha deve ter pelo menos 8 caracteres." });
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) voltarCom("/auth/nova-senha", { erro: "Não foi possível alterar a senha. Solicite um novo link." });
  voltarCom("/painel", { ok: "Senha alterada." });
}
