import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Cabecalho, Cartao, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { BotaoPush } from "./botao-push";

async function marcarTodas() {
  "use server";
  const ctx = await obterContexto();
  await ctx.supabase.from("notificacoes").update({ lida_em: new Date().toISOString() }).eq("escritorio_id", ctx.escritorio.id).is("lida_em", null).or(`user_id.is.null,user_id.eq.${ctx.user.id}`);
  revalidatePath("/", "layout");
}

export const metadata = { title: "Avisos" };

export default async function Notificacoes() {
  const ctx = await obterContexto();
  const { data } = await ctx.supabase
    .from("notificacoes")
    .select("id, titulo, corpo, link, lida_em, criado_em")
    .eq("escritorio_id", ctx.escritorio.id)
    .or(`user_id.is.null,user_id.eq.${ctx.user.id}`)
    .order("criado_em", { ascending: false })
    .limit(100);
  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Avisos"
        acoes={
          <form action={marcarTodas}>
            <Enviar variante="secundario">Marcar todos como lidos</Enviar>
          </form>
        }
      />
      <Cartao titulo="Notificações no celular">
        <p className="mb-2 text-sm text-slate-600">Receba alertas de prazos (D-5, D-2 e D-0), audiências e novos andamentos neste aparelho.</p>
        <BotaoPush chavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </Cartao>
      {!data?.length ? (
        <Vazio>Nenhum aviso.</Vazio>
      ) : (
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((n) => (
              <li key={n.id} className={`px-4 py-3 text-sm ${n.lida_em ? "" : "bg-sky-50/50"}`}>
                <div className="text-xs text-slate-500">{new Date(n.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</div>
                {n.link ? (
                  <Link href={n.link} className="font-medium hover:underline">
                    {n.titulo}
                  </Link>
                ) : (
                  <span className="font-medium">{n.titulo}</span>
                )}
                {n.corpo && <p className="whitespace-pre-line text-slate-600">{n.corpo}</p>}
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
