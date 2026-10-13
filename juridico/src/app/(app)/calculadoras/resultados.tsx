import { AvisoResponsabilidade } from "@/components/ui";
import { moeda } from "@/lib/documento";
import { formatarDataBr } from "@/lib/prazos/motor";
import { ROTULO_JUROS, type ResultadoAtualizacao } from "@/lib/calculos/atualizacao";
import type { ResultadoRescisao } from "@/lib/calculos/rescisao";
import type { LinhaDebito } from "@/lib/calculos/pensao";
import type { ResultadoCumprimento } from "@/lib/calculos/cumprimento";

const pct = (v: number | null) => (v === null ? "-" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`);

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm ${forte ? "font-semibold" : ""}`}>
      <span>{rotulo}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function Obs({ itens }: { itens?: string[] }) {
  if (!itens?.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
      {itens.map((o) => (
        <li key={o}>{o}</li>
      ))}
    </ul>
  );
}

export function ResultadoAtualizacaoView({ r }: { r: ResultadoAtualizacao }) {
  return (
    <div className="space-y-3">
      <AvisoResponsabilidade />
      <div>
        <Linha rotulo="Valor original" valor={moeda(r.valorOriginal)} />
        <Linha rotulo={`Fator de correção`} valor={r.fatorCorrecao.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} />
        <Linha rotulo="Valor corrigido" valor={moeda(r.valorCorrigido)} />
        <Linha rotulo={`Juros (${pct(r.percentualJuros)})`} valor={moeda(r.valorJuros)} />
        <Linha rotulo="Total atualizado" valor={moeda(r.total)} forte />
      </div>
      <Obs itens={r.observacoes} />
      <details>
        <summary className="cursor-pointer text-sm text-slate-700">Memória mês a mês ({r.memoria.length} competências)</summary>
        <div className="-mx-4 mt-2 overflow-x-auto sm:mx-0">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-1">Competência</th>
                <th className="px-2 py-1">Índice</th>
                <th className="px-2 py-1">Variação</th>
                <th className="px-2 py-1">Fator acumulado</th>
                <th className="px-2 py-1">Juros do mês</th>
                <th className="px-2 py-1">Juros acumulados</th>
              </tr>
            </thead>
            <tbody>
              {r.memoria.map((m) => (
                <tr key={m.competencia} className="border-t border-slate-100">
                  <td className="px-2 py-1">{m.competencia.split("-").reverse().join("/")}</td>
                  <td className="px-2 py-1">{m.correcao}</td>
                  <td className="px-2 py-1">{pct(m.variacao)}</td>
                  <td className="px-2 py-1">{m.fatorAcumulado.toFixed(6)}</td>
                  <td className="px-2 py-1" title={ROTULO_JUROS[m.juros]}>{pct(m.taxaJuros)}</td>
                  <td className="px-2 py-1">{pct(m.jurosAcumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function ResultadoRescisaoView({ r }: { r: ResultadoRescisao }) {
  return (
    <div className="space-y-3">
      <AvisoResponsabilidade />
      <p className="text-sm text-slate-600">
        Aviso prévio: {r.diasAviso} dias · Data projetada do término: {formatarDataBr(r.dataProjetada)}
      </p>
      <div>
        {r.itens.map((i) => (
          <div key={i.descricao} className="border-b border-slate-100 py-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <span>
                {i.descricao} {i.detalhe && <span className="text-xs text-slate-500">({i.detalhe})</span>}
              </span>
              <span className={i.informativo ? "text-slate-400" : ""}>{moeda(i.valor)}</span>
            </div>
            <div className="text-xs text-slate-500">{i.fundamento}</div>
          </div>
        ))}
        <Linha rotulo="Total estimado (bruto)" valor={moeda(r.total)} forte />
      </div>
      <Obs itens={r.observacoes} />
    </div>
  );
}

export function ResultadoPensaoView({ r }: { r: { mensal: { baseCalculo: number; valor: number; descricao: string } | null; debito: { linhas: LinhaDebito[]; totalOriginal: number; total: number; observacoes: string[] } | null } }) {
  return (
    <div className="space-y-3">
      <AvisoResponsabilidade />
      {r.mensal && (
        <div>
          <Linha rotulo="Base de cálculo" valor={moeda(r.mensal.baseCalculo)} />
          <Linha rotulo={`Pensão mensal (${r.mensal.descricao})`} valor={moeda(r.mensal.valor)} forte />
        </div>
      )}
      {r.debito && (
        <div>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-1">Vencimento</th>
                  <th className="px-2 py-1">Devido</th>
                  <th className="px-2 py-1">Pago</th>
                  <th className="px-2 py-1">Saldo</th>
                  <th className="px-2 py-1">Corrigido</th>
                  <th className="px-2 py-1">Juros</th>
                  <th className="px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {r.debito.linhas.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1">{formatarDataBr(l.vencimento)}</td>
                    <td className="px-2 py-1">{moeda(l.devido)}</td>
                    <td className="px-2 py-1">{moeda(l.pago)}</td>
                    <td className="px-2 py-1">{moeda(l.saldo)}</td>
                    <td className="px-2 py-1">{moeda(l.corrigido)}</td>
                    <td className="px-2 py-1">{moeda(l.juros)}</td>
                    <td className="px-2 py-1 font-medium">{moeda(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Linha rotulo="Saldo original em atraso" valor={moeda(r.debito.totalOriginal)} />
          <Linha rotulo="Débito atualizado" valor={moeda(r.debito.total)} forte />
          <Obs itens={r.debito.observacoes} />
        </div>
      )}
    </div>
  );
}

export function ResultadoCumprimentoView({ r }: { r: ResultadoCumprimento }) {
  return (
    <div className="space-y-3">
      <AvisoResponsabilidade />
      <div>
        <Linha rotulo="Condenação atualizada (correção e juros)" valor={moeda(r.principalAtualizado)} />
        {r.honorariosConhecimento > 0 && <Linha rotulo="Honorários da fase de conhecimento" valor={moeda(r.honorariosConhecimento)} />}
        <Linha rotulo="Subtotal" valor={moeda(r.subtotal)} />
        {r.subtotal !== r.baseMultaHonorarios && <Linha rotulo="Saldo após pagamento parcial" valor={moeda(r.baseMultaHonorarios)} />}
        {r.multa > 0 && <Linha rotulo="Multa de 10% (CPC art. 523 §1º)" valor={moeda(r.multa)} />}
        {r.honorarios523 > 0 && <Linha rotulo="Honorários de 10% (CPC art. 523 §1º)" valor={moeda(r.honorarios523)} />}
        {r.custas > 0 && <Linha rotulo="Custas" valor={moeda(r.custas)} />}
        <Linha rotulo="Total devido" valor={moeda(r.total)} forte />
      </div>
      <Obs itens={r.observacoes} />
      <details>
        <summary className="cursor-pointer text-sm text-slate-700">Memória da atualização</summary>
        <div className="mt-2">
          <ResultadoAtualizacaoView r={r.atualizacao} />
        </div>
      </details>
    </div>
  );
}

export function ResultadoQualquer({ tipo, r }: { tipo: string; r: unknown }) {
  if (tipo === "atualizacao") return <ResultadoAtualizacaoView r={r as ResultadoAtualizacao} />;
  if (tipo === "rescisao") return <ResultadoRescisaoView r={r as ResultadoRescisao} />;
  if (tipo === "pensao") return <ResultadoPensaoView r={r as Parameters<typeof ResultadoPensaoView>[0]["r"]} />;
  return <ResultadoCumprimentoView r={r as ResultadoCumprimento} />;
}
