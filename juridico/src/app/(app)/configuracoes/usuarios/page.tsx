import { revalidatePath } from "next/cache";
import { Cabecalho, Caixa, Campo, Cartao, Etiqueta, Mensagens, Selecao } from "@/components/ui";
import { Copiar, Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, voltarCom } from "@/lib/acoes";
import { enviarEmail } from "@/lib/notificar";

const PAPEIS = [
  { valor: "advogado", rotulo: "Advogado(a)" },
  { valor: "assistente", rotulo: "Assistente / estagiário(a)" },
];

async function convidar(fd: FormData) {
  "use server";
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") voltarCom("/configuracoes/usuarios", { erro: "Somente o titular convida usuários." });
  const email = texto(fd, "email").toLowerCase();
  const { data, error } = await ctx.supabase
    .from("convites")
    .insert({
      escritorio_id: ctx.escritorio.id,
      email,
      papel: texto(fd, "papel") === "assistente" ? "assistente" : "advogado",
      permissoes: { financeiro: fd.get("financeiro") === "on", configuracoes: fd.get("configuracoes") === "on" },
      criado_por: ctx.user.id,
    })
    .select("token")
    .single();
  if (error) voltarCom("/configuracoes/usuarios", { erro: erroAmigavel(error) });
  const link = `${process.env.NEXT_PUBLIC_URL_APP ?? ""}/convite/${data.token}`;
  await enviarEmail(email, `Convite para ${ctx.escritorio.nome}`, `Você foi convidado(a) para o escritório ${ctx.escritorio.nome}.\nAceite pelo link (válido por 7 dias):\n${link}`).catch(() => false);
  revalidatePath("/configuracoes/usuarios");
  voltarCom("/configuracoes/usuarios", { ok: "Convite criado. Se o e-mail não chegar, copie o link abaixo e envie." });
}

async function atualizarMembro(fd: FormData) {
  "use server";
  const ctx = await obterContexto();
  const userId = texto(fd, "user_id");
  const { error } = await ctx.supabase
    .from("membros")
    .update({
      papel: texto(fd, "papel") === "assistente" ? "assistente" : "advogado",
      permissoes: { financeiro: fd.get("financeiro") === "on", configuracoes: fd.get("configuracoes") === "on" },
      ativo: fd.get("ativo") === "on",
    })
    .eq("escritorio_id", ctx.escritorio.id)
    .eq("user_id", userId)
    .neq("papel", "titular");
  if (error) voltarCom("/configuracoes/usuarios", { erro: erroAmigavel(error) });
  revalidatePath("/configuracoes/usuarios");
  voltarCom("/configuracoes/usuarios", { ok: "Permissões atualizadas." });
}

async function revogarConvite(fd: FormData) {
  "use server";
  const ctx = await obterContexto();
  await ctx.supabase.from("convites").delete().eq("id", texto(fd, "id"));
  revalidatePath("/configuracoes/usuarios");
}

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const titular = ctx.membro.papel === "titular";
  const [{ data: membros }, { data: convites }] = await Promise.all([
    ctx.supabase.from("membros").select("user_id, nome, email, papel, permissoes, ativo").eq("escritorio_id", ctx.escritorio.id).order("criado_em"),
    titular ? ctx.supabase.from("convites").select("id, email, papel, token, expira_em").eq("escritorio_id", ctx.escritorio.id).is("aceito_em", null) : Promise.resolve({ data: [] }),
  ]);
  const ativos = (membros ?? []).filter((m) => m.ativo).length;
  const base = process.env.NEXT_PUBLIC_URL_APP ?? "";
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Usuários e permissões" descricao={`${ativos} de ${ctx.plano.max_usuarios} usuário(s) do plano ${ctx.plano.nome}.`} voltar={{ href: "/configuracoes", rotulo: "Configurações" }} />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Equipe">
        <ul className="divide-y divide-slate-100">
          {(membros ?? []).map((m) => (
            <li key={m.user_id} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{m.nome || m.email}</span>
                <span className="text-slate-500">{m.email}</span>
                <Etiqueta cor={m.papel === "titular" ? "roxo" : "cinza"}>{m.papel}</Etiqueta>
                {!m.ativo && <Etiqueta cor="vermelho">inativo</Etiqueta>}
              </div>
              {titular && m.papel !== "titular" && (
                <form action={atualizarMembro} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <Selecao rotulo="Papel" name="papel" opcoes={PAPEIS} defaultValue={m.papel} />
                  <Caixa name="financeiro" defaultChecked={!!(m.permissoes as Record<string, boolean>)?.financeiro} rotulo="Financeiro" />
                  <Caixa name="configuracoes" defaultChecked={!!(m.permissoes as Record<string, boolean>)?.configuracoes} rotulo="Configurações" />
                  <Caixa name="ativo" defaultChecked={m.ativo} rotulo="Ativo" />
                  <Enviar pequeno variante="secundario">Salvar</Enviar>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Cartao>
      {titular && (
        <>
          <Cartao titulo="Convidar usuário">
            {ativos >= ctx.plano.max_usuarios ? (
              <p className="text-sm text-slate-600">O plano atual não permite mais usuários. O plano Escritório permite até 5.</p>
            ) : (
              <form action={convidar} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo rotulo="E-mail" name="email" type="email" required />
                  <Selecao rotulo="Papel" name="papel" opcoes={PAPEIS} />
                </div>
                <div className="flex flex-wrap gap-4">
                  <Caixa name="financeiro" rotulo="Acesso ao financeiro" />
                  <Caixa name="configuracoes" rotulo="Pode alterar configurações" />
                </div>
                <Enviar>Criar convite</Enviar>
              </form>
            )}
          </Cartao>
          {!!convites?.length && (
            <Cartao titulo="Convites pendentes">
              <ul className="space-y-2 text-sm">
                {convites.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    <span>{c.email}</span>
                    <Copiar texto={`${base}/convite/${c.token}`}>Copiar link</Copiar>
                    <form action={revogarConvite}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-red-700 underline">revogar</button>
                    </form>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </>
      )}
    </div>
  );
}
