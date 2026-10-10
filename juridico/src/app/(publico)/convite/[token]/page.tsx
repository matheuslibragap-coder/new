import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Campo, Cartao, LinkBotao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { COOKIE_ESCRITORIO } from "@/lib/contexto";
import { erroAmigavel, texto, voltarCom } from "@/lib/acoes";

async function aceitar(fd: FormData) {
  "use server";
  const token = texto(fd, "token");
  const supabase = await criarClienteServidor();
  let escritorioId: string;
  try {
    const { data, error } = await supabase.rpc("aceitar_convite", { p_token: token, p_nome: texto(fd, "nome") || null });
    if (error) throw error;
    escritorioId = data as string;
  } catch (e) {
    voltarCom(`/convite/${token}`, { erro: erroAmigavel(e) });
  }
  (await cookies()).set(COOKIE_ESCRITORIO, escritorioId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/painel");
}

export default async function Convite({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { token } = await params;
  const admin = criarClienteAdmin();
  const { data: convite } = await admin.from("convites").select("email, papel, aceito_em, expira_em, escritorios(nome)").eq("token", token).maybeSingle();
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  const valido = convite && !convite.aceito_em && new Date(convite.expira_em) > new Date();
  const nomeEscritorio = (convite?.escritorios as unknown as { nome: string } | null)?.nome;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">Convite</h1>
      <Mensagens busca={await searchParams} />
      <Cartao>
        {!valido ? (
          <p className="text-sm text-slate-700">Este convite é inválido, já foi usado ou expirou. Peça um novo ao titular do escritório.</p>
        ) : !data.user ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Você foi convidado(a) para o escritório <strong>{nomeEscritorio}</strong> com o e-mail <strong>{convite.email}</strong>.
            </p>
            <div className="flex gap-2">
              <LinkBotao href={`/cadastro?voltar=/convite/${token}`}>Criar conta</LinkBotao>
              <LinkBotao href={`/entrar?voltar=/convite/${token}`} variante="secundario">
                Já tenho conta
              </LinkBotao>
            </div>
          </div>
        ) : (
          <form action={aceitar} className="space-y-3">
            <p className="text-sm text-slate-700">
              Entrar no escritório <strong>{nomeEscritorio}</strong> como {convite.papel}.
            </p>
            <input type="hidden" name="token" value={token} />
            <Campo rotulo="Seu nome" name="nome" />
            <Enviar>Aceitar convite</Enviar>
          </form>
        )}
      </Cartao>
    </div>
  );
}
