import { notFound } from "next/navigation";
import { Cabecalho, Cartao } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { opcoesProcessos } from "../../agenda/opcoes";
import { CALCULADORAS } from "../lista";
import { FormAtualizacao, FormCumprimento, FormPensao, FormRescisao } from "../formularios";

export default async function Calculadora({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const calc = CALCULADORAS.find((c) => c.tipo === tipo);
  if (!calc) notFound();
  const ctx = await obterContexto();
  const processos = await opcoesProcessos(ctx);
  const { count } = await ctx.supabase.from("indices").select("indice", { count: "exact", head: true });
  return (
    <div className="space-y-4">
      <Cabecalho titulo={calc.titulo} descricao={calc.desc} voltar={{ href: "/calculadoras", rotulo: "Calculadoras" }} />
      {tipo !== "rescisao" && !count && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Nenhum índice econômico cadastrado ainda. O administrador da plataforma precisa importar as séries no painel admin.</p>
      )}
      <Cartao>
        {tipo === "atualizacao" && <FormAtualizacao processos={processos} />}
        {tipo === "rescisao" && <FormRescisao processos={processos} />}
        {tipo === "pensao" && <FormPensao processos={processos} />}
        {tipo === "cumprimento_sentenca" && <FormCumprimento processos={processos} />}
      </Cartao>
    </div>
  );
}
