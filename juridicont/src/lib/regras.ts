import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Regra, RegraSnapshot } from "@/lib/tipos";

export type BaseDeRegras = {
  versao: number;
  regras: Regra[];
  snapshot: RegraSnapshot[];
};

/** Carrega as regras ativas e a versão atual da base. */
export async function carregarRegrasAtivas(supabase: SupabaseClient): Promise<BaseDeRegras> {
  const [{ data: regras, error }, { data: versao }] = await Promise.all([
    supabase.from("regras").select("*").eq("ativa", true).order("codigo"),
    supabase.from("regras_versao").select("versao").eq("id", 1).single(),
  ]);
  if (error) throw new Error("Falha ao carregar a base de regras: " + error.message);
  const lista = (regras ?? []) as Regra[];
  return {
    versao: versao?.versao ?? 0,
    regras: lista,
    snapshot: lista.map(({ codigo, titulo, dispositivo, severidade_padrao }) => ({
      codigo,
      titulo,
      dispositivo,
      severidade_padrao,
    })),
  };
}

/** Formata as regras para o prompt. Ordem estável para aproveitar cache. */
export function regrasParaPrompt(regras: Regra[]) {
  return regras
    .map((r) =>
      [
        `<regra codigo="${r.codigo}">`,
        `Título: ${r.titulo}`,
        `Dispositivo: ${r.dispositivo}`,
        `Severidade padrão: ${r.severidade_padrao}`,
        `Descrição: ${r.descricao}`,
        r.exemplos_vedados.length ? `Exemplos vedados:\n${r.exemplos_vedados.map((e) => `- ${e}`).join("\n")}` : "",
        r.exemplos_conformes.length
          ? `Exemplos conformes:\n${r.exemplos_conformes.map((e) => `- ${e}`).join("\n")}`
          : "",
        `</regra>`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
