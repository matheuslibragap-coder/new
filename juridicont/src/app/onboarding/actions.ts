"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirUsuario } from "@/lib/sessao";

const perfilZ = z.object({
  nome_profissional: z.string().trim().min(3, "Informe seu nome profissional.").max(120),
  areas: z.array(z.string().trim().min(1).max(80)).min(1, "Escolha pelo menos uma área.").max(10),
  cidade: z.string().trim().min(2, "Informe sua cidade.").max(120),
  tom: z.enum(["formal", "acessivel"], { message: "Escolha o tom." }),
});

export type EstadoPerfil = { erro?: string; ok?: boolean };

export async function salvarPerfil(_anterior: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const { supabase, user } = await exigirUsuario();
  const outras = String(form.get("outras_areas") ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const parse = perfilZ.safeParse({
    nome_profissional: form.get("nome_profissional"),
    areas: [...new Set([...form.getAll("areas").map(String), ...outras])],
    cidade: form.get("cidade"),
    tom: form.get("tom"),
  });
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? "Confira os campos." };

  const { error } = await supabase
    .from("perfis")
    .update({ ...parse.data, onboarding_concluido: true })
    .eq("id", user.id);
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/app", "layout");
  if (form.get("origem") === "onboarding") redirect("/app");
  return { ok: true };
}
