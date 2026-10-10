import type { Metadata } from "next";
import { exigirUsuarioPronto, obterConta } from "@/lib/sessao";
import { Checador } from "./Checador";

export const metadata: Metadata = { title: "Checar conteúdo" };

export default async function PaginaChecar() {
  const { supabase } = await exigirUsuarioPronto();
  const { conta, plano } = await obterConta(supabase);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Checar conteúdo</h1>
        <p className="text-stone-600">
          {conta.checagens_usadas} de {plano.limite_checagens} checagens usadas neste ciclo.
        </p>
      </div>
      <Checador permiteAnuncio={plano.permite_anuncio} />
    </div>
  );
}
