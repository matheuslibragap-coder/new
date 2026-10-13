import "server-only";
import { notFound } from "next/navigation";
import { obterContexto } from "@/lib/contexto";

export async function exigirAdmin() {
  const ctx = await obterContexto();
  if (!ctx.isAdmin) notFound();
  return ctx;
}
