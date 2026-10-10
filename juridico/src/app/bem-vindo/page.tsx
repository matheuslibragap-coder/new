import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Campo, Cartao, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { COOKIE_ESCRITORIO, obterUsuario } from "@/lib/contexto";
import { LISTA_UFS } from "@/lib/tribunais";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { NOME_PRODUTO } from "@/lib/textos";

async function criar(fd: FormData) {
  "use server";
  const { supabase } = await obterUsuario();
  let id: string;
  try {
    const { data, error } = await supabase.rpc("criar_escritorio", {
      p_nome: texto(fd, "nome"),
      p_uf: textoOuNulo(fd, "uf"),
      p_nome_usuario: textoOuNulo(fd, "nome_usuario"),
      p_oab_numero: textoOuNulo(fd, "oab_numero"),
      p_oab_uf: textoOuNulo(fd, "oab_uf"),
    });
    if (error) throw error;
    id = data as string;
  } catch (e) {
    voltarCom("/bem-vindo", { erro: erroAmigavel(e) });
  }
  (await cookies()).set(COOKIE_ESCRITORIO, id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/painel?ok=Escrit%C3%B3rio%20criado.%20Cadastre%20seu%20primeiro%20processo.");
}

export default async function BemVindo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await obterUsuario();
  const { data: membro } = await supabase.from("membros").select("escritorio_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (membro) redirect("/painel");
  const ufs = [{ valor: "", rotulo: "Selecione" }, ...LISTA_UFS.map((u) => ({ valor: u, rotulo: u }))];
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold">Bem-vindo(a) ao {NOME_PRODUTO}</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">Só falta criar o seu escritório. Se você recebeu um convite, abra o link do convite.</p>
      <Mensagens busca={await searchParams} />
      <Cartao>
        <form action={criar} className="space-y-3">
          <Campo rotulo="Nome do escritório" name="nome" required placeholder="Ex.: Silva Advocacia" />
          <Selecao rotulo="UF principal" name="uf" opcoes={ufs} />
          <Campo rotulo="Seu nome" name="nome_usuario" defaultValue={(user.user_metadata?.nome as string) ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Número da OAB" name="oab_numero" inputMode="numeric" />
            <Selecao rotulo="UF da OAB" name="oab_uf" opcoes={ufs} />
          </div>
          <Enviar className="w-full">Criar escritório</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
