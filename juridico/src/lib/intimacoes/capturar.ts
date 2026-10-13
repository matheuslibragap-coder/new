import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obterProvedor, diasSugeridos } from "./provedor";
import { calcularComBanco } from "../prazos/servidor";
import { hojeBrasilia, somarDias } from "../prazos/motor";
import { identificarTribunal } from "../tribunais";
import { avisar } from "../notificar";

export type ConfigIntimacoes = { id: string; escritorio_id: string; provedor: string; oab_numero: string; oab_uf: string };

/**
 * Captura intimações de um número de OAB e sugere o prazo pelo motor (M2).
 * A sugestão NÃO vira tarefa: o advogado precisa confirmar.
 */
export async function capturarIntimacoes(admin: SupabaseClient, cfg: ConfigIntimacoes, diasAtras = 3): Promise<number> {
  const fim = hojeBrasilia();
  const inicio = somarDias(fim, -diasAtras);
  const provedor = obterProvedor(cfg.provedor);
  let itens;
  try {
    itens = await provedor.buscar({ oabNumero: cfg.oab_numero, oabUf: cfg.oab_uf, inicio, fim });
  } catch (e) {
    await admin.from("config_intimacoes").update({ ultimo_erro: (e as Error).message, ultima_captura: new Date().toISOString() }).eq("id", cfg.id);
    throw e;
  }
  let novas = 0;
  for (const it of itens) {
    const { data: existente } = await admin.from("intimacoes").select("id").eq("escritorio_id", cfg.escritorio_id).eq("provedor", provedor.nome).eq("id_externo", it.idExterno).maybeSingle();
    if (existente) continue;
    const { data: proc } = it.numeroCnj
      ? await admin.from("processos").select("id, rito, tribunal_sigla, uf, comarca").eq("escritorio_id", cfg.escritorio_id).eq("numero_cnj", it.numeroCnj).maybeSingle()
      : { data: null };
    const trib = it.numeroCnj?.length === 20 ? identificarTribunal(it.numeroCnj.slice(13, 14), it.numeroCnj.slice(14, 16)) : null;
    const sugestaoDias = diasSugeridos(it.texto);
    const regra = proc?.rito ?? (trib?.sigla.startsWith("TRT") ? "trabalhista_clt" : "civel_cpc");
    let prazo: Record<string, unknown> | null = null;
    try {
      const { resultado } = await calcularComBanco(admin, {
        dataEvento: it.dataDisponibilizacao,
        tipoEvento: "disponibilizacao_dje",
        dias: sugestaoDias.dias,
        emDobro: false,
        regraCodigo: regra,
        contexto: { tribunal: proc?.tribunal_sigla ?? trib?.sigla ?? it.tribunal, uf: proc?.uf ?? trib?.uf, comarca: proc?.comarca },
      });
      prazo = { dias: sugestaoDias.dias, diasEncontradosNoTexto: sugestaoDias.encontrado, regra, dataFinal: resultado.dataFinal, dataMarco: resultado.dataMarco };
    } catch {
      prazo = { dias: sugestaoDias.dias, diasEncontradosNoTexto: sugestaoDias.encontrado, regra, dataFinal: null };
    }
    const { error } = await admin.from("intimacoes").insert({
      escritorio_id: cfg.escritorio_id,
      provedor: provedor.nome,
      id_externo: it.idExterno,
      numero_cnj: it.numeroCnj,
      processo_id: proc?.id ?? null,
      tribunal: it.tribunal,
      orgao: it.orgao,
      tipo_comunicacao: it.tipoComunicacao,
      data_disponibilizacao: it.dataDisponibilizacao,
      texto: it.texto,
      link: it.link,
      prazo_sugerido: prazo,
    });
    if (!error) novas++;
  }
  await admin.from("config_intimacoes").update({ ultima_captura: new Date().toISOString(), ultimo_erro: null }).eq("id", cfg.id);
  if (novas > 0) {
    await avisar(admin, {
      escritorioId: cfg.escritorio_id,
      tipo: "intimacao",
      titulo: `${novas} nova(s) intimação(ões) para OAB ${cfg.oab_numero}/${cfg.oab_uf}`,
      corpo: "Confira e confirme os prazos sugeridos. Nenhum prazo é criado sem a sua confirmação.",
      link: "/intimacoes",
    });
  }
  return novas;
}
