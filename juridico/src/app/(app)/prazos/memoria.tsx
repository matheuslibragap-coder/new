import { AvisoResponsabilidade } from "@/components/ui";
import { formatarDataBr, type DiaMemoria } from "@/lib/prazos/motor";

const COR: Record<string, string> = {
  evento: "bg-sky-50 text-sky-900",
  publicacao: "bg-sky-50 text-sky-900",
  ciencia: "bg-sky-50 text-sky-900",
  contado: "",
  pulado: "bg-slate-50 text-slate-500",
  vencimento: "bg-emerald-50 font-semibold text-emerald-900",
};

export function MemoriaCalculo({ memoria, observacoes, fundamentacao }: { memoria: DiaMemoria[]; observacoes?: string[]; fundamentacao?: string }) {
  return (
    <div className="space-y-3">
      <AvisoResponsabilidade />
      {!!observacoes?.length && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
          {observacoes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-1.5">Data</th>
              <th className="px-3 py-1.5">Dia</th>
              <th className="px-3 py-1.5">Contagem</th>
              <th className="px-3 py-1.5">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {memoria.map((m, i) => (
              <tr key={`${m.data}-${i}`} className={`border-t border-slate-100 ${COR[m.situacao]}`}>
                <td className="whitespace-nowrap px-3 py-1.5">{formatarDataBr(m.data)}</td>
                <td className="whitespace-nowrap px-3 py-1.5">{m.diaSemana}</td>
                <td className="px-3 py-1.5">{m.situacao === "pulado" ? "não conta" : m.contagem ?? ""}</td>
                <td className="px-3 py-1.5">{m.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fundamentacao && <p className="text-xs text-slate-500">Fundamentação da regra: {fundamentacao}</p>}
    </div>
  );
}
