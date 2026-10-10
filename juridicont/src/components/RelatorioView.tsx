import Link from "next/link";
import type { RelatorioAuditoria } from "@/lib/auditoria";
import { Semaforo } from "@/components/Semaforo";
import { AvisoLegal } from "@/components/Aviso";

function corNota(n: number) {
  if (n >= 85) return "text-green-700";
  if (n >= 60) return "text-amber-600";
  return "text-red-700";
}

export function RelatorioView({ relatorio, mostrarConvite }: { relatorio: RelatorioAuditoria; mostrarConvite: boolean }) {
  return (
    <div className="space-y-4">
      <section className="cartao flex items-center gap-4">
        <div className="text-center">
          <p className={`text-5xl font-bold ${corNota(relatorio.nota)}`}>{relatorio.nota}</p>
          <p className="text-xs text-stone-500">de 100</p>
        </div>
        <div className="text-sm text-stone-600">
          <p className="font-semibold text-stone-800">Nota geral do perfil</p>
          <p>A nota começa em 100 e diminui a cada risco encontrado: mais para riscos vermelhos, menos para amarelos.</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Principais riscos</h2>
        {relatorio.principais_riscos.length === 0 && (
          <p className="cartao text-sm text-stone-600">Sem riscos identificados pela base de regras.</p>
        )}
        {relatorio.principais_riscos.map((r, i) => (
          <article key={r.regra_codigo} className="cartao space-y-1">
            <div className="flex items-center gap-2">
              <Semaforo valor={r.severidade} tamanho="pequeno" />
              <h3 className="font-semibold">
                {i + 1}. {r.titulo}
              </h3>
            </div>
            {r.dispositivo && <p className="text-xs text-stone-500">{r.dispositivo}</p>}
            <p className="text-sm">{r.explicacao}</p>
            {r.exemplo_trecho && <p className="text-sm text-stone-600">Exemplo: “{r.exemplo_trecho}”</p>}
            <p className="text-xs text-stone-500">
              {r.ocorrencias} {r.ocorrencias === 1 ? "ocorrência" : "ocorrências"}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Resultado por item</h2>
        {relatorio.itens.map((item) => (
          <details key={item.rotulo} className="cartao p-3 sm:p-4">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Semaforo valor={item.resultado.classificacao_geral} tamanho="pequeno" />
              {item.rotulo}
              <span className="ml-auto text-xs font-normal text-stone-500">
                {item.resultado.achados.length} {item.resultado.achados.length === 1 ? "achado" : "achados"}
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">{item.texto}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {item.resultado.achados.map((a, i) => (
                <li key={i} className="rounded-lg bg-stone-50 p-2">
                  {a.trecho && <span className="font-medium">“{a.trecho}”: </span>}
                  {a.explicacao}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>

      {mostrarConvite && (
        <section className="cartao space-y-2 border-marca">
          <h2 className="font-semibold">Quer checar cada post antes de publicar?</h2>
          <p className="text-sm text-stone-600">
            No plano Essencial você faz até 100 checagens por mês e recebe 12 posts informativos já checados.
          </p>
          <Link href="/app/planos" className="btn-primario w-full sm:w-auto">
            Conhecer os planos
          </Link>
        </section>
      )}

      <AvisoLegal />
    </div>
  );
}
