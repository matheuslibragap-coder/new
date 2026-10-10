"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";

const linhas = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const regraZ = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, "O código deve ter só letras maiúsculas, números e sublinhado, começando por letra.")
    .refine((c) => c !== "NAO_CATALOGADO", "Este código é reservado."),
  titulo: z.string().trim().min(3, "Informe o título."),
  dispositivo: z.string().trim().min(1, "Informe o dispositivo."),
  descricao: z.string().trim().min(10, "Descreva a regra."),
  exemplos_vedados: z.array(z.string()),
  exemplos_conformes: z.array(z.string()),
  severidade_padrao: z.enum(["vermelho", "amarelo"]),
  ativa: z.boolean(),
  revisao_pendente: z.boolean(),
});

export type EstadoRegra = { erro?: string };

export async function salvarRegra(_anterior: EstadoRegra, form: FormData): Promise<EstadoRegra> {
  const { supabase } = await exigirAdmin();
  const id = String(form.get("id") ?? "");
  const parse = regraZ.safeParse({
    codigo: form.get("codigo"),
    titulo: form.get("titulo"),
    dispositivo: form.get("dispositivo"),
    descricao: form.get("descricao"),
    exemplos_vedados: linhas(form.get("exemplos_vedados")),
    exemplos_conformes: linhas(form.get("exemplos_conformes")),
    severidade_padrao: form.get("severidade_padrao"),
    ativa: form.get("ativa") === "on",
    revisao_pendente: form.get("revisao_pendente") === "on",
  });
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? "Confira os campos." };

  const { error } = id
    ? await supabase.from("regras").update(parse.data).eq("id", id)
    : await supabase.from("regras").insert(parse.data);
  if (error) {
    return { erro: error.code === "23505" ? "Já existe uma regra com esse código." : "Erro ao salvar: " + error.message };
  }
  revalidatePath("/admin/regras");
  redirect("/admin/regras");
}

export async function alternarRegra(form: FormData) {
  const { supabase } = await exigirAdmin();
  const id = String(form.get("id"));
  const ativa = form.get("ativa") === "true";
  await supabase.from("regras").update({ ativa: !ativa }).eq("id", id);
  revalidatePath("/admin/regras");
}
