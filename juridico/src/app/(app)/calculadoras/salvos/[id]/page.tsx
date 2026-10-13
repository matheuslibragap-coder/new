import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Cartao } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { ResultadoQualquer } from "../../resultados";

export default async function Salvo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: c } = await ctx.supabase.from("calculos_salvos").select("*, processos(id, numero_cnj)").eq("id", id).maybeSingle();
  if (!c) notFound();
  const proc = c.processos as unknown as { id: string; numero_cnj: string } | null;
  return (
    <div className="space-y-4">
      <Cabecalho
        titulo={c.titulo}
        descricao={`Salvo em ${new Date(c.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}
        voltar={{ href: "/calculadoras", rotulo: "Calculadoras" }}
        acoes={
          <a href={`/api/calculos/${id}/pdf`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Baixar PDF
          </a>
        }
      />
      {proc && (
        <Link href={`/processos/${proc.id}`} className="text-sm underline">
          Ver processo
        </Link>
      )}
      <Cartao>
        <ResultadoQualquer tipo={c.tipo} r={c.resultado} />
      </Cartao>
    </div>
  );
}
