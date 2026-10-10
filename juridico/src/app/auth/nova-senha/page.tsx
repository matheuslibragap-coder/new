import { Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { definirNovaSenha } from "../../(publico)/acoes-auth";

export default async function NovaSenha({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <div className="mx-auto mt-10 max-w-sm px-4">
      <h1 className="mb-4 text-xl font-semibold">Nova senha</h1>
      <Mensagens busca={await searchParams} />
      <Cartao>
        <form action={definirNovaSenha} className="space-y-3">
          <Campo rotulo="Nova senha" name="senha" type="password" minLength={8} required />
          <Enviar className="w-full">Salvar</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
