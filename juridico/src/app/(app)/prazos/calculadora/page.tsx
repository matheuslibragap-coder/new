import { Alerta, Cabecalho, Caixa, Campo, Cartao, Grade, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { LISTA_UFS } from "@/lib/tribunais";
import { formatarDataBr, hojeBrasilia, ROTULO_EVENTO, diaSemana, type TipoEvento } from "@/lib/prazos/motor";
import { calcularComBanco } from "@/lib/prazos/servidor";
import { MemoriaCalculo } from "../memoria";
import { salvarPrazoCalculado } from "../acoes";

export const metadata = { title: "Calculadora de prazos" };

type Busca = Record<string, string | undefined>;

export default async function Calculadora({ searchParams }: { searchParams: Promise<Busca> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  const [{ data: regras }, { data: processos }] = await Promise.all([
    ctx.supabase.from("regras_prazo").select("codigo, nome, permite_dobra, validar_com_advogado").eq("ativo", true).order("nome"),
    ctx.supabase.from("processos").select("id, numero_cnj, tribunal_sigla, uf, comarca, rito, clientes(nome)").eq("escritorio_id", ctx.escritorio.id).eq("ativo", true).order("atualizado_em", { ascending: false }).limit(300),
  ]);
  const proc = (processos ?? []).find((p) => p.id === b.processo);
  const v = {
    processo: b.processo ?? "",
    data: b.data ?? hojeBrasilia(),
    evento: (b.evento as TipoEvento) ?? "disponibilizacao_dje",
    dias: b.dias ?? "15",
    regra: b.regra ?? proc?.rito ?? "civel_cpc",
    dobro: b.dobro === "1" || b.dobro === "on",
    // com processo selecionado, tribunal, UF e comarca vêm sempre do cadastro do processo
    tribunal: proc ? proc.tribunal_sigla ?? "" : b.tribunal ?? "",
    uf: proc ? proc.uf ?? "" : b.uf ?? ctx.escritorio.uf ?? "",
    comarca: proc ? proc.comarca ?? "" : b.comarca ?? "",
    titulo: b.titulo ?? "",
  };
  const calcular = b.calcular === "1";

  let resultado: Awaited<ReturnType<typeof calcularComBanco>> | null = null;
  let erro: string | null = null;
  if (calcular) {
    try {
      resultado = await calcularComBanco(ctx.supabase, {
        dataEvento: v.data,
        tipoEvento: v.evento,
        dias: Number(v.dias),
        emDobro: v.dobro,
        regraCodigo: v.regra,
        contexto: { tribunal: v.tribunal || null, uf: v.uf || null, comarca: v.comarca || null },
      });
    } catch (e) {
      erro = (e as Error).message;
    }
  }

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Calculadora de prazos" descricao="Informe a data do evento, o prazo e o rito. O resultado mostra a contagem dia a dia." voltar={{ href: "/prazos", rotulo: "Prazos" }} />
      <Mensagens busca={b} />
      <Cartao>
        <form className="space-y-3">
          <input type="hidden" name="calcular" value="1" />
          {b.intimacao && <input type="hidden" name="intimacao" value={b.intimacao} />}
          <Selecao
            rotulo="Processo (opcional)"
            name="processo"
            defaultValue={v.processo}
            ajuda="Com processo selecionado, tribunal, UF e comarca vêm do cadastro do processo."
            opcoes={[{ valor: "", rotulo: "Cálculo avulso" }, ...(processos ?? []).map((p) => ({ valor: p.id, rotulo: `${formatarCnj(p.numero_cnj)}${(p.clientes as unknown as { nome: string } | null)?.nome ? ` · ${(p.clientes as unknown as { nome: string }).nome}` : ""}` }))]}
          />
          <Grade>
            <Campo rotulo="Data do evento" name="data" type="date" required defaultValue={v.data} />
            <Selecao rotulo="Tipo de evento" name="evento" defaultValue={v.evento} opcoes={Object.entries(ROTULO_EVENTO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
            <Campo rotulo="Prazo em dias" name="dias" type="number" min={1} max={365} required defaultValue={v.dias} />
            <Selecao rotulo="Rito" name="regra" defaultValue={v.regra} opcoes={(regras ?? []).map((r) => ({ valor: r.codigo, rotulo: `${r.nome}${r.validar_com_advogado ? " [VALIDAR COM ADVOGADO]" : ""}` }))} />
            <Campo rotulo="Tribunal" name="tribunal" defaultValue={v.tribunal} placeholder="Ex.: TJRS, TRT4" />
            <Selecao rotulo="UF" name="uf" defaultValue={v.uf} opcoes={[{ valor: "", rotulo: "Selecione" }, ...LISTA_UFS.map((u) => ({ valor: u, rotulo: u }))]} />
            <Campo rotulo="Comarca" name="comarca" defaultValue={v.comarca} />
          </Grade>
          <Caixa name="dobro" value="1" defaultChecked={v.dobro} rotulo="Prazo em dobro (Fazenda Pública, MP, Defensoria ou litisconsortes com procuradores distintos em autos físicos)" />
          <Enviar>Calcular</Enviar>
        </form>
      </Cartao>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {resultado && (
        <>
          <Cartao titulo="Resultado">
            <p className="text-sm text-slate-600">{ROTULO_EVENTO[v.evento]} em {formatarDataBr(v.data)}.</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              Vencimento: {formatarDataBr(resultado.resultado.dataFinal)} <span className="text-base font-normal text-slate-500">({diaSemana(resultado.resultado.dataFinal)})</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Marco considerado: {formatarDataBr(resultado.resultado.dataMarco)} · Início da contagem: {formatarDataBr(resultado.resultado.dataInicioContagem)} · {resultado.resultado.diasConsiderados} dias {resultado.regra.contagem === "uteis" ? "úteis" : "corridos"}
            </p>
          </Cartao>
          <Cartao titulo="Salvar como prazo com alertas (D-5, D-2 e D-0)">
            <form action={salvarPrazoCalculado} className="space-y-3">
              {Object.entries({ processo_id: v.processo, data: v.data, evento: v.evento, dias: v.dias, regra: v.regra, dobro: v.dobro ? "1" : "", tribunal: v.tribunal, uf: v.uf, comarca: v.comarca, intimacao_id: b.intimacao ?? "", origem: b.intimacao ? "intimacao" : "calculadora" }).map(([k, val]) => (
                <input key={k} type="hidden" name={k} value={val} />
              ))}
              <Campo rotulo="Título" name="titulo" required defaultValue={v.titulo || `Prazo de ${v.dias} dias`} placeholder="Ex.: Contestação, Apelação, Manifestação sobre laudo" />
              <Campo rotulo="Observação" name="descricao" />
              {!v.processo && <p className="text-xs text-slate-500">Sem processo vinculado, o prazo fica como tarefa avulsa.</p>}
              <Enviar>Salvar prazo</Enviar>
            </form>
          </Cartao>
          <Cartao titulo="Memória de cálculo">
            <MemoriaCalculo memoria={resultado.resultado.memoria} observacoes={resultado.resultado.observacoes} fundamentacao={resultado.resultado.fundamentacao} />
          </Cartao>
        </>
      )}
    </div>
  );
}
