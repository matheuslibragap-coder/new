import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Cabecalho, Campo, Cartao, Grade, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { COOKIE_ESCRITORIO, obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { LISTA_UFS } from "@/lib/tribunais";
import { somenteDigitos } from "@/lib/cnj";
import { formatarDocumento, validarCnpj, validarCpf } from "@/lib/documento";

async function salvarEscritorio(fd: FormData) {
  "use server";
  const ctx = await obterContexto();
  if (!ctx.pode("configuracoes")) voltarCom("/configuracoes/escritorio", { erro: "Sem permissão para alterar o escritório." });
  const doc = somenteDigitos(texto(fd, "documento")) || null;
  if (doc && !(doc.length === 11 ? validarCpf(doc) : validarCnpj(doc))) voltarCom("/configuracoes/escritorio", { erro: "CPF ou CNPJ inválido." });
  const { error } = await ctx.supabase
    .from("escritorios")
    .update({ nome: texto(fd, "nome"), documento: doc, uf: textoOuNulo(fd, "uf"), whatsapp_phone_number_id: textoOuNulo(fd, "whatsapp_phone_number_id") })
    .eq("id", ctx.escritorio.id);
  if (error) voltarCom("/configuracoes/escritorio", { erro: erroAmigavel(error) });
  revalidatePath("/", "layout");
  voltarCom("/configuracoes/escritorio", { ok: "Dados do escritório salvos." });
}

async function salvarPerfil(fd: FormData) {
  "use server";
  const ctx = await obterContexto();
  const { error } = await ctx.supabase
    .from("membros")
    .update({ nome: textoOuNulo(fd, "nome"), oab_numero: textoOuNulo(fd, "oab_numero"), oab_uf: textoOuNulo(fd, "oab_uf") })
    .eq("escritorio_id", ctx.escritorio.id)
    .eq("user_id", ctx.user.id);
  if (error) voltarCom("/configuracoes/escritorio", { erro: erroAmigavel(error) });
  revalidatePath("/", "layout");
  voltarCom("/configuracoes/escritorio", { ok: "Perfil salvo." });
}

async function trocarEscritorio(fd: FormData) {
  "use server";
  (await cookies()).set(COOKIE_ESCRITORIO, texto(fd, "escritorio_id"), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  voltarCom("/painel", { ok: "Escritório alterado." });
}

export default async function Escritorio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const ufs = [{ valor: "", rotulo: "Selecione" }, ...LISTA_UFS.map((u) => ({ valor: u, rotulo: u }))];
  const { data: outros } = ctx.outrosEscritorios.length ? await ctx.supabase.from("escritorios").select("id, nome").in("id", ctx.outrosEscritorios) : { data: [] };
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Escritório e perfil" voltar={{ href: "/configuracoes", rotulo: "Configurações" }} />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Escritório">
        <form action={salvarEscritorio} className="space-y-3">
          <Grade>
            <Campo rotulo="Nome" name="nome" required defaultValue={ctx.escritorio.nome} />
            <Campo rotulo="CPF ou CNPJ (para cobrança)" name="documento" defaultValue={formatarDocumento(ctx.escritorio.documento)} />
            <Selecao rotulo="UF" name="uf" opcoes={ufs} defaultValue={ctx.escritorio.uf ?? ""} />
            <Campo
              rotulo="WhatsApp Business: Phone Number ID"
              name="whatsapp_phone_number_id"
              defaultValue={ctx.escritorio.whatsapp_phone_number_id ?? ""}
              ajuda="Só para envio automático (plano Pro). Obtido no painel da Meta para a API oficial."
            />
          </Grade>
          <Enviar disabled={!ctx.pode("configuracoes")}>Salvar</Enviar>
        </form>
      </Cartao>
      <Cartao titulo="Meu perfil">
        <form action={salvarPerfil} className="space-y-3">
          <Grade colunas={3}>
            <Campo rotulo="Nome" name="nome" defaultValue={ctx.membro.nome ?? ""} />
            <Campo rotulo="Número da OAB" name="oab_numero" defaultValue={ctx.membro.oab_numero ?? ""} />
            <Selecao rotulo="UF da OAB" name="oab_uf" opcoes={ufs} defaultValue={ctx.membro.oab_uf ?? ""} />
          </Grade>
          <Enviar variante="secundario">Salvar perfil</Enviar>
        </form>
      </Cartao>
      {!!outros?.length && (
        <Cartao titulo="Trocar de escritório">
          <form action={trocarEscritorio} className="flex gap-2">
            <select name="escritorio_id" defaultValue={ctx.escritorio.id} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {outros.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <Enviar variante="secundario">Trocar</Enviar>
          </form>
        </Cartao>
      )}
    </div>
  );
}
