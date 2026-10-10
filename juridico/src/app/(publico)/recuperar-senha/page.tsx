import { Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { recuperarSenha } from "../acoes-auth";

export const metadata = { title: "Recuperar senha" };

export default async function Recuperar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">Recuperar senha</h1>
      <Mensagens busca={await searchParams} />
      <Cartao>
        <form action={recuperarSenha} className="space-y-3">
          <Campo rotulo="E-mail" name="email" type="email" required />
          <Enviar className="w-full">Enviar link</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
