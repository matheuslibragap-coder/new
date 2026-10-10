import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Pagina() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 py-4">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold text-marca">Política de privacidade</h1>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Texto provisório. Substitua este conteúdo pela versão final antes do lançamento.
        </p>
        <div className="cartao space-y-3 text-stone-700">
          <h2 className="font-semibold">Quem é o controlador dos dados</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Quais dados coletamos</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Para que usamos os dados</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Com quem compartilhamos (Supabase, Anthropic, Asaas, Vercel)</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Uso de inteligência artificial e não treinamento de modelos</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Por quanto tempo guardamos</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Seus direitos como titular (LGPD)</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Exclusão da conta e dos dados</h2>
          <p>[Preencher]</p>
          <h2 className="font-semibold">Contato do encarregado (DPO)</h2>
          <p>[Preencher]</p>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
