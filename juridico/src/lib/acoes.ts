import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { mensagemErro } from "./textos";

/** Redireciona de volta com mensagem de erro ou sucesso na URL (lida por <Mensagens/>). */
export function voltarCom(caminho: string, msg: { erro?: string; ok?: string }): never {
  const url = new URL(caminho, "http://x");
  if (msg.erro) url.searchParams.set("erro", msg.erro);
  if (msg.ok) url.searchParams.set("ok", msg.ok);
  redirect(`${url.pathname}${url.search}`);
}

export function erroAmigavel(e: unknown): string {
  unstable_rethrow(e);
  if (e instanceof Error && !("code" in e) && e.message && !e.message.includes("violates")) return e.message;
  return mensagemErro(e);
}

export function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}
export function textoOuNulo(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo);
  return v === "" ? null : v;
}
