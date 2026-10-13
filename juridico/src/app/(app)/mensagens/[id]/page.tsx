import { notFound } from "next/navigation";
import { AreaTexto, AvisoResponsabilidade, Cabecalho, Caixa, Cartao, Etiqueta, Mensagens } from "@/components/ui";
import { Copiar, Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { linkWaMe, normalizarWhatsapp } from "@/lib/documento";
import { aprovar, descartar, enviarPelaApi, marcarEnviada, salvarTexto } from "../acoes";

export default async function Mensagem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: m } = await ctx.supabase
    .from("mensagens_cliente")
    .select("*, clientes(id, nome, whatsapp), processos(id, numero_cnj), andamentos(nome, data_hora)")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();
  const cliente = m.clientes as unknown as { id: string; nome: string; whatsapp: string | null } | null;
  const proc = m.processos as unknown as { id: string; numero_cnj: string } | null;
  const and = m.andamentos as unknown as { nome: string; data_hora: string } | null;
  const telefone = normalizarWhatsapp(cliente?.whatsapp);
  const aprovada = m.status === "aprovada" && !!m.aprovada_em;
  const enviada = m.status === "enviada";
  const podeApi = ctx.temModulo("M4_API") && !!ctx.escritorio.whatsapp_phone_number_id;

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo={`Mensagem para ${cliente?.nome ?? "cliente"}`}
        descricao={proc ? `Processo ${formatarCnj(proc.numero_cnj)}` : undefined}
        voltar={{ href: "/mensagens", rotulo: "Mensagens" }}
        acoes={<Etiqueta cor={enviada ? "verde" : aprovada ? "azul" : "amarelo"}>{m.status}</Etiqueta>}
      />
      <Mensagens busca={await searchParams} />
      {and && (
        <Cartao titulo="Andamento original">
          <p className="text-sm">{and.nome}</p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(and.data_hora).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · Fonte: CNJ / DataJud
          </p>
        </Cartao>
      )}
      {m.texto_gerado && <AvisoResponsabilidade extra="Texto gerado por IA. Revise o conteúdo, confirme que não há dados de outras partes e que nada promete resultado." />}

      {enviada ? (
        <Cartao titulo="Texto enviado">
          <p className="whitespace-pre-line text-sm">{m.texto_final}</p>
          <p className="mt-2 text-xs text-slate-500">
            Enviada em {new Date(m.enviada_em!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} por {m.canal === "whatsapp_api" ? "API do WhatsApp" : "WhatsApp (wa.me)"}.
          </p>
        </Cartao>
      ) : (
        <Cartao titulo="Revisar e aprovar">
          <form className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <AreaTexto rotulo="Mensagem" name="texto" rows={9} defaultValue={m.texto_final ?? ""} required />
            <Caixa name="revisei" rotulo="Revisei o texto e autorizo o envio ao cliente." />
            <div className="flex flex-wrap gap-2">
              <Enviar formAction={aprovar} variante="sucesso">
                Aprovar
              </Enviar>
              <Enviar formAction={salvarTexto} variante="secundario">
                Salvar rascunho
              </Enviar>
              <Enviar formAction={descartar} variante="fantasma" confirmar="Descartar esta mensagem?">
                Descartar
              </Enviar>
            </div>
          </form>
        </Cartao>
      )}

      {aprovada && (
        <Cartao titulo="Enviar">
          {!telefone ? (
            <p className="text-sm text-amber-800">O cliente não tem WhatsApp válido no cadastro. Copie o texto ou atualize o cadastro.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <a href={linkWaMe(telefone, m.texto_final!)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600">
                  Abrir no WhatsApp
                </a>
                <Copiar texto={m.texto_final!}>Copiar texto</Copiar>
                {podeApi && (
                  <form action={enviarPelaApi}>
                    <input type="hidden" name="id" value={id} />
                    <Enviar variante="secundario" confirmar="Enviar agora pela API oficial do WhatsApp?">
                      Enviar automaticamente
                    </Enviar>
                  </form>
                )}
              </div>
              <p className="text-xs text-slate-500">O botão abre o seu WhatsApp com o texto pronto. Depois de enviar, registre abaixo.</p>
              <form action={marcarEnviada}>
                <input type="hidden" name="id" value={id} />
                <Enviar variante="secundario" pequeno>
                  Já enviei
                </Enviar>
              </form>
              {!ctx.planoInclui("M4_API") && <p className="text-xs text-slate-500">Envio automático pela API oficial: disponível no plano Pro.</p>}
            </div>
          )}
          {m.erro && <p className="mt-2 text-sm text-red-700">Último erro: {m.erro}</p>}
        </Cartao>
      )}
    </div>
  );
}
