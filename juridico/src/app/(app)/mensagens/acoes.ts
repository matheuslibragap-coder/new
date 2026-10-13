"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, voltarCom } from "@/lib/acoes";
import { traduzirAndamento } from "@/lib/ia/claude";
import { descreverMovimento } from "@/lib/datajud";
import { enviarWhatsappApi } from "@/lib/whatsapp-api";
import { normalizarWhatsapp } from "@/lib/documento";

/** Cria a mensagem para um andamento. Com IA, gera o rascunho; sem IA, começa em branco. */
export async function criarMensagem(fd: FormData) {
  const ctx = await obterContexto();
  const andamentoId = texto(fd, "andamento_id");
  const usarIa = texto(fd, "ia") !== "0";
  const { data: a } = await ctx.supabase
    .from("andamentos")
    .select("id, nome, complementos, data_hora, processo_id, processos(id, classe, area, polo, cliente_id, clientes(nome))")
    .eq("id", andamentoId)
    .single();
  if (!a) voltarCom("/mensagens", { erro: "Andamento não encontrado." });
  const proc = a.processos as unknown as { id: string; classe: string | null; area: string | null; polo: string | null; cliente_id: string | null; clientes: { nome: string } | null };
  let gerado: string | null = null;
  if (usarIa) {
    try {
      gerado = await traduzirAndamento({
        andamento: descreverMovimento({ nome: a.nome, complementosTabelados: a.complementos as never }),
        data: new Date(a.data_hora).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        classe: proc.classe,
        area: proc.area,
        polo: proc.polo,
        primeiroNomeCliente: proc.clientes?.nome?.split(" ")[0] ?? null,
      });
    } catch (e) {
      voltarCom("/mensagens", { erro: erroAmigavel(e) });
    }
  }
  const { data, error } = await ctx.supabase
    .from("mensagens_cliente")
    .insert({ escritorio_id: ctx.escritorio.id, andamento_id: a.id, processo_id: proc.id, cliente_id: proc.cliente_id, texto_gerado: gerado, texto_final: gerado ?? "", status: "rascunho" })
    .select("id")
    .single();
  if (error) voltarCom("/mensagens", { erro: erroAmigavel(error) });
  revalidatePath("/mensagens");
  redirect(`/mensagens/${data.id}`);
}

/** Salvar texto. Qualquer edição volta a mensagem para rascunho (exige nova aprovação). */
export async function salvarTexto(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase.from("mensagens_cliente").update({ texto_final: texto(fd, "texto"), status: "rascunho", aprovada_em: null, aprovada_por: null }).eq("id", id).neq("status", "enviada");
  if (error) voltarCom(`/mensagens/${id}`, { erro: erroAmigavel(error) });
  revalidatePath(`/mensagens/${id}`);
  voltarCom(`/mensagens/${id}`, { ok: "Texto salvo. Aprove para liberar o envio." });
}

export async function aprovar(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const conteudo = texto(fd, "texto");
  if (!conteudo) voltarCom(`/mensagens/${id}`, { erro: "A mensagem está vazia." });
  if (fd.get("revisei") !== "on") voltarCom(`/mensagens/${id}`, { erro: "Confirme que revisou a mensagem." });
  const { error } = await ctx.supabase
    .from("mensagens_cliente")
    .update({ texto_final: conteudo, status: "aprovada", aprovada_por: ctx.user.id, aprovada_em: new Date().toISOString() })
    .eq("id", id)
    .neq("status", "enviada");
  if (error) voltarCom(`/mensagens/${id}`, { erro: erroAmigavel(error) });
  revalidatePath("/mensagens");
  voltarCom(`/mensagens/${id}`, { ok: "Mensagem aprovada. Agora você pode enviar." });
}

/** Envio manual pelo wa.me: o advogado confirma depois que enviou. */
export async function marcarEnviada(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase.from("mensagens_cliente").update({ status: "enviada", canal: "wa_me", enviada_em: new Date().toISOString() }).eq("id", id).eq("status", "aprovada");
  if (error) voltarCom(`/mensagens/${id}`, { erro: erroAmigavel(error) });
  revalidatePath("/mensagens");
  voltarCom("/mensagens", { ok: "Mensagem registrada como enviada." });
}

/** Envio automático pela API oficial do WhatsApp (plano Pro), somente de mensagem aprovada. */
export async function enviarPelaApi(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  if (!ctx.temModulo("M4_API")) voltarCom(`/mensagens/${id}`, { erro: "O envio automático está disponível no plano Pro." });
  if (!ctx.escritorio.whatsapp_phone_number_id) voltarCom(`/mensagens/${id}`, { erro: "Configure o número do WhatsApp Business em Configurações." });
  const { data: m } = await ctx.supabase.from("mensagens_cliente").select("id, status, texto_final, aprovada_em, clientes(whatsapp)").eq("id", id).single();
  if (!m || m.status !== "aprovada" || !m.aprovada_em) voltarCom(`/mensagens/${id}`, { erro: "Só mensagens aprovadas podem ser enviadas." });
  const destino = normalizarWhatsapp((m.clientes as unknown as { whatsapp: string | null } | null)?.whatsapp);
  if (!destino) voltarCom(`/mensagens/${id}`, { erro: "O cliente não tem WhatsApp válido no cadastro." });
  try {
    await enviarWhatsappApi(ctx.escritorio.whatsapp_phone_number_id!, destino, m.texto_final!);
    await ctx.supabase.from("mensagens_cliente").update({ status: "enviada", canal: "whatsapp_api", enviada_em: new Date().toISOString(), erro: null }).eq("id", id);
  } catch (e) {
    await ctx.supabase.from("mensagens_cliente").update({ erro: (e as Error).message }).eq("id", id);
    voltarCom(`/mensagens/${id}`, { erro: (e as Error).message });
  }
  revalidatePath("/mensagens");
  voltarCom("/mensagens", { ok: "Mensagem enviada pelo WhatsApp." });
}

export async function descartar(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("mensagens_cliente").update({ status: "descartada" }).eq("id", texto(fd, "id")).neq("status", "enviada");
  revalidatePath("/mensagens");
  voltarCom("/mensagens", { ok: "Mensagem descartada." });
}
