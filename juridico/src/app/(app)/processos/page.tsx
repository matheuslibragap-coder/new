import Link from "next/link";
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj, somenteDigitos } from "@/lib/cnj";

export const metadata = { title: "Processos" };

const STATUS: Record<string, { rotulo: string; cor: "verde" | "amarelo" | "vermelho" | "cinza" | "azul" }> = {
  ok: { rotulo: "DataJud", cor: "verde" },
  pendente: { rotulo: "Aguardando consulta", cor: "azul" },
  nao_encontrado: { rotulo: "Não localizado", cor: "amarelo" },
  erro: { rotulo: "Erro na consulta", cor: "vermelho" },
  manual: { rotulo: "Manual", cor: "cinza" },
};

export default async function Processos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  const ctx = await obterContexto();
  const arquivados = busca.arquivados === "1";
  let q = ctx.supabase
    .from("processos")
    .select("id, numero_cnj, tribunal_sigla, classe, comarca, monitorado, datajud_status, clientes(nome)")
    .eq("escritorio_id", ctx.escritorio.id)
    .eq("ativo", !arquivados)
    .order("atualizado_em", { ascending: false })
    .limit(300);
  if (busca.q) {
    const d = somenteDigitos(busca.q);
    q = d.length >= 4 ? q.like("numero_cnj", `%${d}%`) : q.ilike("classe", `%${busca.q.replace(/[%_,()]/g, "")}%`);
  }
  const [{ data: processos }, { data: novos }] = await Promise.all([
    q,
    ctx.supabase.from("andamentos").select("processo_id").eq("escritorio_id", ctx.escritorio.id).is("visto_em", null).eq("importacao_inicial", false).limit(1000),
  ]);
  const contagemNovos = new Map<string, number>();
  for (const a of novos ?? []) contagemNovos.set(a.processo_id, (contagemNovos.get(a.processo_id) ?? 0) + 1);
  const monitorados = (processos ?? []).filter((p) => p.monitorado).length;

  return (
    <div>
      <Cabecalho
        titulo="Processos"
        descricao={!arquivados ? `${monitorados} monitorado(s) de ${ctx.plano.max_processos} do plano ${ctx.plano.nome}` : "Arquivados"}
        acoes={<LinkBotao href="/processos/novo">Novo processo</LinkBotao>}
      />
      <Mensagens busca={busca} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={busca.q} placeholder="Número ou classe" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {arquivados && <input type="hidden" name="arquivados" value="1" />}
      </form>
      <div className="mb-3 text-sm">
        <Link href={arquivados ? "/processos" : "/processos?arquivados=1"} className="text-slate-600 underline">
          {arquivados ? "Ver ativos" : "Ver arquivados"}
        </Link>
      </div>
      {!processos?.length ? (
        <Vazio acao={<LinkBotao href="/processos/novo">Cadastrar processo</LinkBotao>}>Nenhum processo encontrado.</Vazio>
      ) : (
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {processos.map((p) => {
              const st = STATUS[p.datajud_status] ?? STATUS.manual;
              const n = contagemNovos.get(p.id);
              return (
                <li key={p.id}>
                  <Link href={`/processos/${p.id}`} className="block px-4 py-3 hover:bg-slate-50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-900">{formatarCnj(p.numero_cnj)}</span>
                      {n ? <Etiqueta cor="roxo">{n} novo(s)</Etiqueta> : null}
                      <Etiqueta cor={st.cor}>{st.rotulo}</Etiqueta>
                      {!p.monitorado && <Etiqueta>não monitorado</Etiqueta>}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {[p.tribunal_sigla, p.classe, p.comarca, (p.clientes as unknown as { nome: string } | null)?.nome].filter(Boolean).join(" · ")}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
