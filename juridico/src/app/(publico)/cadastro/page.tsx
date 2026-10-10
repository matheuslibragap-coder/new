import Link from "next/link";
import { Caixa, Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { cadastrar, entrarComGoogle } from "../acoes-auth";

export const metadata = { title: "Criar conta" };

export default async function Cadastro({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-xl font-semibold">Criar conta</h1>
      <p className="mb-4 text-sm text-slate-600">14 dias de teste, sem cartão.</p>
      <Mensagens busca={busca} />
      <Cartao>
        <form action={cadastrar} className="space-y-3">
          <input type="hidden" name="voltar" value={busca.voltar ?? "/bem-vindo"} />
          <Campo rotulo="Seu nome" name="nome" required autoComplete="name" />
          <Campo rotulo="E-mail" name="email" type="email" required autoComplete="email" />
          <Campo rotulo="Senha" name="senha" type="password" required minLength={8} autoComplete="new-password" ajuda="Mínimo de 8 caracteres." />
          <Caixa
            name="aceite"
            required
            rotulo={
              <>
                Li e aceito os <Link href="/termos" className="underline">termos de uso</Link> e a <Link href="/privacidade" className="underline">política de privacidade</Link>.
              </>
            }
          />
          <Enviar className="w-full">Criar conta</Enviar>
        </form>
        <form action={entrarComGoogle} className="mt-3">
          <input type="hidden" name="voltar" value={busca.voltar ?? "/bem-vindo"} />
          <Enviar variante="secundario" className="w-full">
            Continuar com Google
          </Enviar>
        </form>
      </Cartao>
    </div>
  );
}
