import type { Metadata } from "next";
import { exigirUsuarioPronto, listarPlanos, obterConta } from "@/lib/sessao";
import { formatarData, formatarReais } from "@/lib/textos";
import type { Plano } from "@/lib/tipos";
import { Assinar, CancelarAssinatura } from "./Assinar";

export const metadata: Metadata = { title: "Planos" };

function itens(p: Plano) {
  const lista = [`${p.limite_checagens} checagens por mês`];
  if (p.limite_posts > 0) lista.push(`${p.limite_posts} posts gerados por mês`);
  if (p.limite_auditorias > 0) lista.push(`${p.limite_auditorias} auditoria de perfil por mês`);
  if (p.permite_reels) lista.push("Roteiros de reels");
  if (p.permite_anuncio) lista.push("Checagem de anúncios pagos");
  lista.push("Histórico com exportação em PDF");
  return lista;
}

const STATUS = {
  nenhuma: "",
  pendente: "Aguardando confirmação do pagamento.",
  ativa: "Assinatura ativa.",
  atrasada: "Pagamento em atraso.",
  cancelada: "Assinatura cancelada. O plano vale até o fim do ciclo atual.",
} as const;

export default async function PaginaPlanos({ searchParams }: PageProps<"/app/planos">) {
  const { supabase, perfil } = await exigirUsuarioPronto();
  const [{ conta }, planos] = await Promise.all([obterConta(supabase), listarPlanos(supabase)]);
  const retorno = (await searchParams).retorno;
  const podeAssinar = !(conta.assinatura_status === "ativa" && conta.plano !== "gratuito");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Planos</h1>
        <p className="text-stone-600">Pagamento mensal por Pix ou cartão de crédito. Cancele quando quiser.</p>
      </div>

      {retorno && conta.assinatura_status === "pendente" && (
        <p className="sucesso">Recebemos seu pedido. O plano é liberado assim que o pagamento for confirmado.</p>
      )}
      {STATUS[conta.assinatura_status] && (
        <p className="cartao text-sm">
          {STATUS[conta.assinatura_status]} Ciclo atual até {formatarData(conta.ciclo_fim, false)}.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {planos.map((p) => {
          const atual = p.codigo === conta.plano;
          return (
            <section key={p.codigo} className={`cartao flex flex-col gap-3 ${atual ? "border-marca ring-1 ring-marca" : ""}`}>
              <div>
                <h2 className="text-lg font-semibold">{p.nome}</h2>
                <p className="text-2xl font-bold">
                  {p.preco_centavos === 0 ? "Grátis" : formatarReais(p.preco_centavos)}
                  {p.preco_centavos > 0 && <span className="text-sm font-normal text-stone-500">/mês</span>}
                </p>
              </div>
              <ul className="flex-1 space-y-1 text-sm text-stone-700">
                {itens(p).map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-green-600">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              {atual ? (
                <p className="text-center text-sm font-medium text-stone-500">Seu plano atual</p>
              ) : p.codigo !== "gratuito" && podeAssinar ? (
                <Assinar plano={p.codigo as "essencial" | "pro"} nomePlano={p.nome} nomeSugerido={perfil.nome_profissional ?? ""} />
              ) : null}
            </section>
          );
        })}
      </div>

      {conta.asaas_subscription_id && ["ativa", "atrasada", "pendente"].includes(conta.assinatura_status) && (
        <CancelarAssinatura />
      )}
      {!podeAssinar && (
        <p className="text-xs text-stone-500">Para trocar de plano, cancele a assinatura atual e assine o novo plano.</p>
      )}
    </div>
  );
}
