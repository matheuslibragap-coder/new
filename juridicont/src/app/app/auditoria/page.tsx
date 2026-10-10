import type { Metadata } from "next";
import { exigirUsuarioPronto, obterConta } from "@/lib/sessao";
import { RelatorioView } from "@/components/RelatorioView";
import type { RelatorioAuditoria } from "@/lib/auditoria";
import { formatarData } from "@/lib/textos";
import { Auditoria } from "./Auditoria";

export const metadata: Metadata = { title: "Auditoria do perfil" };

export default async function PaginaAuditoria() {
  const { supabase } = await exigirUsuarioPronto();
  const [{ conta, plano }, { data: anteriores }] = await Promise.all([
    obterConta(supabase),
    supabase.from("auditorias").select("id, nota, resultado, criado_em").order("criado_em", { ascending: false }).limit(5),
  ]);
  const disponivel = conta.auditorias_usadas < plano.limite_auditorias;
  const gratuito = conta.plano === "gratuito";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Auditoria do perfil</h1>
        <p className="text-stone-600">
          Cole a bio e o texto de até 5 posts recentes. Não acessamos o seu Instagram: você escolhe o que enviar.
        </p>
      </div>

      {disponivel ? (
        <Auditoria mostrarConvite={gratuito} />
      ) : (
        <p className="cartao text-sm text-stone-600">
          Você já usou a auditoria deste ciclo. Ela renova em {formatarData(conta.ciclo_fim, false)}.
        </p>
      )}

      {!!anteriores?.length && (
        <section className="space-y-2 pt-4">
          <h2 className="font-semibold">Auditorias anteriores</h2>
          {anteriores.map((a) => (
            <details key={a.id} className="cartao p-3 sm:p-4">
              <summary className="cursor-pointer text-sm">
                Nota <strong>{a.nota}</strong> · {formatarData(a.criado_em)}
              </summary>
              <div className="mt-3">
                <RelatorioView relatorio={a.resultado as RelatorioAuditoria} mostrarConvite={false} />
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
