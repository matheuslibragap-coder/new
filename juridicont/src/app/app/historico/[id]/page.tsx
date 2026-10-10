import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirUsuarioPronto } from "@/lib/sessao";
import { ResultadoView } from "@/components/ResultadoView";
import { formatarData } from "@/lib/textos";
import { TIPOS_CONTEUDO, type RegraSnapshot, type ResultadoChecagem, type TipoConteudo } from "@/lib/tipos";

export const metadata: Metadata = { title: "Checagem" };

export default async function DetalheChecagem({ params }: PageProps<"/app/historico/[id]">) {
  const { id } = await params;
  const { supabase } = await exigirUsuarioPronto();
  const { data: c } = await supabase.from("checagens").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  let imagemUrl: string | null = null;
  if (c.imagem_path) {
    const { data } = await supabase.storage.from("conteudos").createSignedUrl(c.imagem_path, 60 * 30);
    imagemUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-4">
      <Link href="/app/historico" className="link text-sm">
        Voltar ao histórico
      </Link>
      <div>
        <h1 className="text-xl font-bold text-marca">{TIPOS_CONTEUDO[c.tipo_conteudo as TipoConteudo]}</h1>
        <p className="text-sm text-stone-500">
          {formatarData(c.criado_em)} · versão das regras {c.regras_versao}
        </p>
      </div>
      <ResultadoView
        texto={c.texto ?? ""}
        resultado={c.resultado as ResultadoChecagem}
        regras={c.regras_snapshot as RegraSnapshot[]}
        imagemUrl={imagemUrl}
      />
      <a href={`/api/historico/${c.id}/pdf`} className="btn-secundario w-full sm:w-auto">
        Baixar registro em PDF
      </a>
    </div>
  );
}
