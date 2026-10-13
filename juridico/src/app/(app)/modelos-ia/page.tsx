import Link from "next/link";
import { AreaTexto, BloqueioPlano, Cabecalho, Caixa, Campo, Cartao, Etiqueta, Grade, Mensagens, Selecao, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { opcoesProcessos } from "../agenda/opcoes";
import { AREAS } from "../processos/form-processo";
import { criarRascunho, enviarModelo } from "./acoes";

export const metadata = { title: "Banco de modelos" };

export default async function ModelosIa({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const liberado = ctx.temModulo("M8");
  const [{ data: docs }, { data: rascunhos }, processos] = await Promise.all([
    ctx.supabase.from("biblioteca_documentos").select("id, nome, tipo_peca, area, anonimizado, status_indexacao, criado_em").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }),
    ctx.supabase.from("rascunhos").select("id, titulo, criado_em").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }).limit(20),
    opcoesProcessos(ctx),
  ]);
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Banco de modelos com IA" descricao="Suba suas petições e gere rascunhos no seu estilo." />
      <Mensagens busca={await searchParams} />
      <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        Seus documentos ficam isolados no seu escritório. Não são usados para treinar modelos de IA nem compartilhados com outros escritórios. A busca e a geração usam apenas os modelos do seu escritório.
      </p>
      {!liberado && <BloqueioPlano modulo="O banco de modelos com IA" />}
      {liberado && (
        <>
          <Cartao titulo="Gerar rascunho">
            <form action={criarRascunho} className="space-y-3">
              <Grade>
                <Campo rotulo="Título" name="titulo" placeholder="Ex.: Contestação, ação de cobrança" />
                <Selecao rotulo="Processo (opcional)" name="processo_id" opcoes={[{ valor: "", rotulo: "Sem processo" }, ...processos]} />
              </Grade>
              <AreaTexto
                rotulo="Briefing"
                name="briefing"
                rows={6}
                required
                placeholder="Tipo de peça, fatos principais, pedidos, teses que quer usar. Evite dados pessoais desnecessários."
              />
              <Enviar>Gerar rascunho</Enviar>
              <p className="text-xs text-slate-500">A geração pode levar até um minuto. O texto sai marcado como RASCUNHO e sem jurisprudência inventada: onde couber precedente, aparece [INSERIR PRECEDENTE VERIFICADO].</p>
            </form>
          </Cartao>
          <Cartao titulo="Adicionar modelo">
            <form action={enviarModelo} className="space-y-3">
              <input type="file" name="arquivo" accept=".pdf,.docx,.txt" required className="text-sm" />
              <Grade colunas={3}>
                <Campo rotulo="Nome" name="nome" placeholder="Ex.: Inicial de indenização por negativação" />
                <Campo rotulo="Tipo de peça" name="tipo_peca" placeholder="Petição inicial, contestação, recurso..." />
                <Selecao rotulo="Área" name="area" opcoes={AREAS} />
              </Grade>
              <Caixa name="anonimizar" defaultChecked rotulo="Anonimizar nomes, CPF, CNPJ, e-mails e telefones antes de indexar (recomendado)" />
              <Enviar variante="secundario">Enviar</Enviar>
            </form>
          </Cartao>
        </>
      )}
      <Cartao titulo="Rascunhos">
        {!rascunhos?.length ? (
          <Vazio>Nenhum rascunho.</Vazio>
        ) : (
          <ul className="space-y-1 text-sm">
            {rascunhos.map((r) => (
              <li key={r.id}>
                <Link href={`/modelos-ia/rascunhos/${r.id}`} className="underline">
                  {r.titulo}
                </Link>{" "}
                <span className="text-slate-500">· {new Date(r.criado_em).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo={`Modelos do escritório (${docs?.length ?? 0})`}>
        {!docs?.length ? (
          <Vazio>Nenhum modelo enviado.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {docs.map((d) => (
              <li key={d.id} className="py-2">
                <Link href={`/modelos-ia/${d.id}`} className="font-medium underline">
                  {d.nome}
                </Link>{" "}
                <span className="text-xs text-slate-500">{[d.tipo_peca, d.area].filter(Boolean).join(" · ")}</span> {d.anonimizado && <Etiqueta cor="verde">anonimizado</Etiqueta>}{" "}
                <Etiqueta cor={d.status_indexacao === "indexado" ? "azul" : "cinza"}>{d.status_indexacao === "indexado" ? "busca semântica" : "busca por palavras"}</Etiqueta>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
