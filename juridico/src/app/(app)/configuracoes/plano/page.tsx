import { Cabecalho, Cartao, Etiqueta, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { centavosParaReais, moeda } from "@/lib/documento";
import { assinarPlano, cancelarAssinatura } from "./acoes";

export const metadata = { title: "Plano" };

const NOMES_MODULOS: Record<string, string> = {
  M1: "Clientes, processos e DataJud",
  M2: "Prazos e feriados",
  M3: "Agenda",
  M4: "Mensagens ao cliente (envio manual)",
  M4_API: "Envio automático pelo WhatsApp",
  M5: "Calculadoras",
  M6: "Financeiro",
  M7: "Contratos, procurações e assinatura eletrônica",
  M8: "Banco de modelos com IA",
  M9: "Verificador de petição",
  M10: "Monitor de intimações",
};

function Barra({ atual, max }: { atual: number; max: number }) {
  const pct = Math.min(100, Math.round((atual / Math.max(1, max)) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-600" : pct >= 80 ? "bg-amber-500" : "bg-slate-800"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function Plano({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const [{ data: resumo }, { data: planos }] = await Promise.all([
    ctx.supabase.rpc("resumo_plano", { e: ctx.escritorio.id }),
    ctx.supabase.from("planos").select("*").eq("ativo", true).order("ordem"),
  ]);
  const r = resumo as { processos_monitorados: number; usuarios: number; assinaturas_mes: number } | null;
  const status = ctx.escritorio.assinatura_status;
  const titular = ctx.membro.papel === "titular";

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Plano e pagamento" voltar={{ href: "/configuracoes", rotulo: "Configurações" }} />
      <Mensagens busca={await searchParams} />
      <Cartao titulo={`Plano atual: ${ctx.plano.nome}`} acoes={<Etiqueta cor={ctx.assinaturaValida ? "verde" : "vermelho"}>{status === "trial" ? `teste até ${new Date(ctx.escritorio.trial_ate).toLocaleDateString("pt-BR")}` : status}</Etiqueta>}>
        <div className="space-y-3 text-sm">
          <div>
            Processos monitorados: {r?.processos_monitorados ?? 0} de {ctx.plano.max_processos}
            <Barra atual={r?.processos_monitorados ?? 0} max={ctx.plano.max_processos} />
          </div>
          <div>
            Usuários: {r?.usuarios ?? 1} de {ctx.plano.max_usuarios}
            <Barra atual={r?.usuarios ?? 1} max={ctx.plano.max_usuarios} />
          </div>
          {ctx.plano.cota_assinaturas_mes > 0 && (
            <div>
              Assinaturas eletrônicas neste mês: {r?.assinaturas_mes ?? 0} de {ctx.plano.cota_assinaturas_mes}
              <Barra atual={r?.assinaturas_mes ?? 0} max={ctx.plano.cota_assinaturas_mes} />
            </div>
          )}
          <p className="text-xs text-slate-500">Exceder uma cota bloqueia apenas a ação nova. Nada do que já foi cadastrado fica inacessível.</p>
        </div>
      </Cartao>
      <div className="grid gap-3 md:grid-cols-3">
        {(planos ?? []).map((p) => (
          <Cartao key={p.codigo} titulo={p.nome}>
            <p className="text-2xl font-semibold">
              {moeda(centavosParaReais(p.preco_centavos))}
              <span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {p.max_usuarios} usuário(s) · {p.max_processos} processos
              {p.cota_assinaturas_mes > 0 && ` · ${p.cota_assinaturas_mes} assinaturas/mês`}
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
              {(p.modulos as string[]).map((m) => (
                <li key={m}>• {NOMES_MODULOS[m] ?? m}</li>
              ))}
            </ul>
            {titular && (
              <form action={assinarPlano} className="mt-3">
                <input type="hidden" name="plano" value={p.codigo} />
                <Enviar variante={p.codigo === ctx.plano.codigo ? "secundario" : "primario"} className="w-full">
                  {p.codigo === ctx.plano.codigo ? (status === "ativa" ? "Ver fatura" : "Assinar") : "Mudar para este plano"}
                </Enviar>
              </form>
            )}
          </Cartao>
        ))}
      </div>
      <p className="text-xs text-slate-500">Pagamento recorrente por cartão, Pix ou boleto, processado pelo Asaas. A mudança de plano vale após a confirmação do pagamento.</p>
      {titular && ctx.escritorio.gateway_assinatura_id && status !== "cancelada" && (
        <form action={cancelarAssinatura}>
          <Enviar variante="fantasma" pequeno confirmar="Cancelar a assinatura? Seus dados continuam acessíveis.">
            Cancelar assinatura
          </Enviar>
        </form>
      )}
    </div>
  );
}
