import { Cabecalho, Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { CamposProcesso } from "../form-processo";
import { opcoesProcesso } from "../opcoes";
import { criarProcesso } from "../acoes";

export const metadata = { title: "Novo processo" };

export default async function NovoProcesso({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  const ctx = await obterContexto();
  const op = await opcoesProcesso(ctx);
  return (
    <div>
      <Cabecalho titulo="Novo processo" voltar={{ href: "/processos", rotulo: "Processos" }} />
      <Mensagens busca={busca} />
      <Cartao>
        <form action={criarProcesso} className="space-y-3">
          <Campo
            rotulo="Número CNJ"
            name="numero_cnj"
            required
            inputMode="numeric"
            placeholder="0000000-00.0000.0.00.0000"
            ajuda="20 dígitos. O tribunal é identificado pelo número e a capa e as movimentações são importadas do DataJud."
          />
          <CamposProcesso clientes={op.clientes} ritos={op.ritos} processo={{ cliente_id: busca.cliente }} />
          <p className="text-xs text-slate-500">
            Não encontrou o cliente? <a href="/clientes/novo?voltar=/processos/novo" className="underline">Cadastre antes</a>.
          </p>
          <Enviar>Cadastrar e importar</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
