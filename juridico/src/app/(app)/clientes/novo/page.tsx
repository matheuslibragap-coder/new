import { Cabecalho, Cartao, Mensagens } from "@/components/ui";
import { FormCliente } from "../form-cliente";

export const metadata = { title: "Novo cliente" };

export default async function NovoCliente({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  return (
    <div>
      <Cabecalho titulo="Novo cliente" voltar={{ href: "/clientes", rotulo: "Clientes" }} />
      <Mensagens busca={busca} />
      <Cartao>
        <FormCliente voltar={busca.voltar} />
      </Cartao>
    </div>
  );
}
