import Link from "next/link";
import { Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { entrar, entrarComGoogle } from "../acoes-auth";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">Entrar</h1>
      <Mensagens busca={busca} />
      <Cartao>
        <form action={entrar} className="space-y-3">
          <input type="hidden" name="voltar" value={busca.voltar ?? "/painel"} />
          <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" required />
          <Campo rotulo="Senha" name="senha" type="password" autoComplete="current-password" required />
          <Enviar className="w-full">Entrar</Enviar>
        </form>
        <form action={entrarComGoogle} className="mt-3">
          <input type="hidden" name="voltar" value={busca.voltar ?? "/painel"} />
          <Enviar variante="secundario" className="w-full">
            Entrar com Google
          </Enviar>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/recuperar-senha" className="text-slate-600 underline">
            Esqueci a senha
          </Link>
          <Link href="/cadastro" className="text-slate-600 underline">
            Criar conta
          </Link>
        </div>
      </Cartao>
    </div>
  );
}
