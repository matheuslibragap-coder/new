import { Cabecalho, Cartao, Mensagens } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { FormCompromisso } from "../form-compromisso";
import { opcoesProcessos } from "../opcoes";

export const metadata = { title: "Novo compromisso" };

export default async function Novo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  const ctx = await obterContexto();
  return (
    <div>
      <Cabecalho titulo="Novo compromisso" voltar={{ href: "/agenda", rotulo: "Agenda" }} />
      <Mensagens busca={busca} />
      <Cartao>
        <FormCompromisso processos={await opcoesProcessos(ctx)} c={{ processo_id: busca.processo }} />
      </Cartao>
    </div>
  );
}
