import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Pagina() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 py-4">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold text-marca">Termos de uso</h1>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Texto provisório. Substitua este conteúdo pela versão final antes do lançamento.
        </p>
        <div className="cartao space-y-3 text-stone-700">
          <h2 className="font-semibold">Sobre o serviço</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Natureza da análise (não constitui parecer jurídico)</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Responsabilidade pela publicação</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Planos, pagamentos e cancelamento</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Uso aceitável</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Limitação de responsabilidade</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Alterações destes termos</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Foro e contato</h2>
          <p>[Preencher]</p>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
