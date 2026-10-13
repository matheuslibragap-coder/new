import { notFound } from "next/navigation";
import { AreaTexto, Cabecalho, Caixa, Campo, Cartao, Etiqueta, Mensagens } from "@/components/ui";
import { Copiar, Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { AVISO_ASSINATURA } from "@/lib/textos";
import { atualizarDocumento, enviarParaAssinatura, excluirDocumento } from "../acoes";

export default async function Documento({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: d } = await ctx.supabase.from("documentos_gerados").select("*, clientes(nome, email)").eq("id", id).maybeSingle();
  if (!d) notFound();
  const cliente = d.clientes as unknown as { nome: string; email: string | null } | null;
  const links = (d.assinatura_links as { nome: string; url: string }[] | null) ?? [];
  const editavel = d.assinatura_status === "nao_enviado";
  return (
    <div className="space-y-4">
      <Cabecalho
        titulo={d.titulo}
        descricao={cliente?.nome}
        voltar={{ href: "/documentos", rotulo: "Documentos" }}
        acoes={
          <a href={`/api/documentos/${id}/pdf`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Baixar PDF
          </a>
        }
      />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Assinatura eletrônica" acoes={<Etiqueta cor={d.assinatura_status === "assinado" ? "verde" : d.assinatura_status === "aguardando" ? "amarelo" : "cinza"}>{d.assinatura_status.replace("_", " ")}</Etiqueta>}>
        {editavel ? (
          ctx.temModulo("M7") ? (
            <form action={enviarParaAssinatura} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{AVISO_ASSINATURA}</p>
              <Caixa name="conferi_validade" rotulo="Conferi os requisitos de validade da assinatura eletrônica para o uso pretendido." />
              <div className="flex flex-wrap gap-4">
                <Caixa name="assina_cliente" defaultChecked={!!cliente} rotulo={`Cliente${cliente ? ` (${cliente.nome})` : ""}`} />
                <Caixa name="assina_advogado" defaultChecked rotulo="Eu (advogado/a)" />
              </div>
              <p className="text-xs text-slate-500">
                O provedor não envia nada automaticamente: você recebe os links e decide quando compartilhar. Usa 1 assinatura da cota mensal ({ctx.plano.cota_assinaturas_mes} no plano {ctx.plano.nome}).
              </p>
              <Enviar>Preparar para assinatura</Enviar>
            </form>
          ) : (
            <p className="text-sm text-slate-600">Assinatura eletrônica disponível no plano Pro.</p>
          )
        ) : (
          <div className="space-y-2 text-sm">
            <p>Provedor: {d.assinatura_provedor}. Confirmação automática quando todos assinarem.</p>
            {links.map((l) => (
              <div key={l.url} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{l.nome}:</span>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="max-w-xs truncate underline">
                  {l.url}
                </a>
                <Copiar texto={l.url}>Copiar link</Copiar>
              </div>
            ))}
          </div>
        )}
      </Cartao>
      <Cartao titulo="Texto">
        {editavel ? (
          <form action={atualizarDocumento} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <Campo rotulo="Título" name="titulo" defaultValue={d.titulo} required />
            <AreaTexto rotulo="Conteúdo" name="conteudo" rows={22} defaultValue={d.conteudo} className="font-mono" required />
            <Enviar variante="secundario">Salvar alterações</Enviar>
          </form>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm">{d.conteudo}</pre>
        )}
      </Cartao>
      <form action={excluirDocumento}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir este documento?">
          Excluir documento
        </Enviar>
      </form>
    </div>
  );
}
