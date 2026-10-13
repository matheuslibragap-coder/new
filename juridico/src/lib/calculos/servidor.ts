import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { atualizar, indicesNecessarios, type EntradaAtualizacao, type PeriodoCriterio, type ValorIndice } from "./atualizacao";
import { calcularRescisao, type EntradaRescisao } from "./rescisao";
import { debitoPensao, pensaoMensal, type EntradaDebitoPensao, type EntradaPensaoMensal } from "./pensao";
import { calcularCumprimento, type EntradaCumprimento } from "./cumprimento";

export type TipoCalculo = "atualizacao" | "rescisao" | "pensao" | "cumprimento_sentenca";

async function carregarIndices(supabase: SupabaseClient, criterios: PeriodoCriterio[], de: string, ate: string): Promise<ValorIndice[]> {
  const nomes = indicesNecessarios(criterios);
  if (!nomes.length) return [];
  const { data } = await supabase.from("indices").select("indice, competencia, valor").in("indice", nomes).gte("competencia", `${de.slice(0, 7)}-01`).lte("competencia", `${ate.slice(0, 7)}-01`);
  return (data ?? []).map((d) => ({ indice: d.indice, competencia: String(d.competencia).slice(0, 7), valor: Number(d.valor) }));
}

/** Executa qualquer calculadora no servidor, com os índices do banco (nunca do navegador). */
export async function executar(supabase: SupabaseClient, tipo: TipoCalculo, entrada: Record<string, unknown>) {
  switch (tipo) {
    case "atualizacao": {
      const e = entrada as unknown as Omit<EntradaAtualizacao, "indices">;
      return atualizar({ ...e, indices: await carregarIndices(supabase, e.periodos, e.dataInicial, e.dataFinal) });
    }
    case "rescisao":
      return calcularRescisao(entrada as unknown as EntradaRescisao);
    case "pensao": {
      const e = entrada as unknown as { mensal?: EntradaPensaoMensal; debito?: Omit<EntradaDebitoPensao, "indices"> };
      const mensal = e.mensal ? pensaoMensal(e.mensal) : null;
      let debito = null;
      if (e.debito?.parcelas?.length) {
        const primeira = e.debito.parcelas.map((p) => p.vencimento).sort()[0];
        debito = debitoPensao({ ...e.debito, indices: await carregarIndices(supabase, e.debito.criterios, primeira, e.debito.dataCalculo) });
      }
      return { mensal, debito };
    }
    case "cumprimento_sentenca": {
      const e = entrada as unknown as Omit<EntradaCumprimento, "indices">;
      return calcularCumprimento({ ...e, indices: await carregarIndices(supabase, e.criterios, e.dataBase, e.dataCalculo) });
    }
  }
}
