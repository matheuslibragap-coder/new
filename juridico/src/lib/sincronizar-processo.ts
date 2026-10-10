import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { consultarProcesso, dataDatajud, descreverMovimento, ErroDatajud, nomesAssuntos } from "./datajud";
import { formatarCnj } from "./cnj";
import { avisar } from "./notificar";

export type ProcessoParaSincronizar = {
  id: string;
  escritorio_id: string;
  numero_cnj: string;
  datajud_alias: string | null;
  datajud_status: string;
};

export type ResultadoSincronizacao = { status: "ok" | "nao_encontrado" | "sem_alias"; novos: number };

/**
 * Consulta o DataJud e grava capa e andamentos. Deve ser chamada com o cliente admin,
 * depois de validada a autorização (cadastro feito pelo próprio usuário ou job agendado).
 */
export async function sincronizarProcesso(admin: SupabaseClient, p: ProcessoParaSincronizar, opcoes: { notificar?: boolean } = {}): Promise<ResultadoSincronizacao> {
  if (!p.datajud_alias) {
    await admin.from("processos").update({ datajud_status: "manual", datajud_erro: "Tribunal sem endpoint na API Pública do DataJud." }).eq("id", p.id);
    return { status: "sem_alias", novos: 0 };
  }

  let r;
  try {
    r = await consultarProcesso(p.datajud_alias, p.numero_cnj);
  } catch (e) {
    const msg = e instanceof ErroDatajud ? e.message : "Erro inesperado ao consultar o DataJud.";
    await admin.from("processos").update({ datajud_status: p.datajud_status === "ok" ? "ok" : "erro", datajud_erro: msg, datajud_ultima_consulta: new Date().toISOString() }).eq("id", p.id);
    throw e;
  }

  const agora = new Date().toISOString();
  if (!r.encontrado) {
    await admin
      .from("processos")
      .update({
        datajud_status: "nao_encontrado",
        datajud_erro: "Processo não localizado na API Pública. Pode ser sigiloso, recente ou de sistema ainda não integrado. Cadastre os andamentos manualmente, se necessário.",
        datajud_ultima_consulta: agora,
      })
      .eq("id", p.id);
    return { status: "nao_encontrado", novos: 0 };
  }

  const capa = r.capa!;
  const primeiraImportacao = p.datajud_status !== "ok";
  await admin
    .from("processos")
    .update({
      classe: capa.classe?.nome ?? null,
      assunto: nomesAssuntos(capa) || null,
      orgao_julgador: capa.orgaoJulgador?.nome ?? null,
      grau: r.graus.join(", ") || null,
      data_ajuizamento: dataDatajud(capa.dataAjuizamento),
      sigiloso: (capa.nivelSigilo ?? 0) > 0,
      dados_capa: capa,
      datajud_status: "ok",
      datajud_erro: null,
      datajud_ultima_consulta: agora,
      datajud_ultima_atualizacao: dataDatajud(capa.dataHoraUltimaAtualizacao),
    })
    .eq("id", p.id);

  const linhas = r.movimentos
    .map((m) => ({
      escritorio_id: p.escritorio_id,
      processo_id: p.id,
      data_hora: dataDatajud(m.dataHora),
      codigo: m.codigo ?? null,
      nome: m.nome,
      complementos: m.complementosTabelados ?? null,
      orgao_julgador: m.orgaoJulgador?.nomeOrgao ?? null,
      origem: "datajud",
      hash: m.hash,
      importacao_inicial: primeiraImportacao,
    }))
    .filter((l) => l.data_hora);

  let novos: { id: string; nome: string; complementos: unknown }[] = [];
  for (let i = 0; i < linhas.length; i += 500) {
    const { data, error } = await admin
      .from("andamentos")
      .upsert(linhas.slice(i, i + 500), { onConflict: "processo_id,hash", ignoreDuplicates: true })
      .select("id, nome, complementos");
    if (error) throw new Error(`Falha ao gravar andamentos: ${error.message}`);
    novos = novos.concat(data ?? []);
  }

  if (!primeiraImportacao && novos.length > 0 && opcoes.notificar !== false) {
    const resumo = novos
      .slice(0, 3)
      .map((n) => descreverMovimento({ nome: n.nome, complementosTabelados: n.complementos as never }))
      .join("; ");
    await avisar(admin, {
      escritorioId: p.escritorio_id,
      tipo: "andamento",
      titulo: `${novos.length} novo(s) andamento(s) no processo ${formatarCnj(p.numero_cnj)}`,
      corpo: `${resumo}${novos.length > 3 ? "..." : ""}\nFonte: CNJ / DataJud`,
      link: `/processos/${p.id}`,
    });
  }
  return { status: "ok", novos: primeiraImportacao ? 0 : novos.length };
}
