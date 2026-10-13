import Link from "next/link";
import { Cabecalho, Cartao, Etiqueta, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { criarMensagem } from "./acoes";
import { instanteEmDias } from "@/lib/prazos/motor";

export const metadata = { title: "Mensagens ao cliente" };

const COR = { rascunho: "amarelo", aprovada: "azul", enviada: "verde", descartada: "cinza", erro_envio: "vermelho" } as const;

export default async function MensagensPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const desde = instanteEmDias(-30);
  const [{ data: andamentos }, { data: msgs }] = await Promise.all([
    ctx.supabase
      .from("andamentos")
      .select("id, nome, data_hora, processos!inner(id, numero_cnj, cliente_id, clientes(nome)), mensagens_cliente(id)")
      .eq("escritorio_id", ctx.escritorio.id)
      .eq("importacao_inicial", false)
      .gte("criado_em", desde)
      .not("processos.cliente_id", "is", null)
      .order("data_hora", { ascending: false })
      .limit(50),
    ctx.supabase
      .from("mensagens_cliente")
      .select("id, status, texto_final, criado_em, enviada_em, clientes(nome), processos(numero_cnj)")
      .eq("escritorio_id", ctx.escritorio.id)
      .neq("status", "descartada")
      .order("criado_em", { ascending: false })
      .limit(100),
  ]);
  const pendentes = (andamentos ?? []).filter((a) => !(a.mensagens_cliente as unknown as unknown[])?.length);
  const iaDisponivel = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Mensagens ao cliente"
        descricao="A IA explica o andamento em linguagem simples. Você revisa, edita e aprova. Nada é enviado sem a sua aprovação."
      />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Andamentos recentes sem mensagem">
        {!pendentes.length ? (
          <Vazio>Nenhum andamento novo de processos com cliente vinculado nos últimos 30 dias.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendentes.map((a) => {
              const p = a.processos as unknown as { id: string; numero_cnj: string; clientes: { nome: string } | null };
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0 text-sm">
                    <div className="text-xs text-slate-500">
                      {new Date(a.data_hora).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {formatarCnj(p.numero_cnj)} · {p.clientes?.nome}
                    </div>
                    <div>{a.nome}</div>
                  </div>
                  <div className="flex gap-2">
                    {iaDisponivel && (
                      <form action={criarMensagem}>
                        <input type="hidden" name="andamento_id" value={a.id} />
                        <Enviar pequeno>Gerar com IA</Enviar>
                      </form>
                    )}
                    <form action={criarMensagem}>
                      <input type="hidden" name="andamento_id" value={a.id} />
                      <input type="hidden" name="ia" value="0" />
                      <Enviar pequeno variante="secundario">
                        Escrever
                      </Enviar>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">Fonte dos andamentos: CNJ / DataJud</p>
      </Cartao>
      <Cartao titulo="Mensagens">
        {!msgs?.length ? (
          <Vazio>Nenhuma mensagem ainda.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100">
            {msgs.map((m) => (
              <li key={m.id}>
                <Link href={`/mensagens/${m.id}`} className="block py-2 hover:bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Etiqueta cor={COR[m.status as keyof typeof COR]}>{m.status}</Etiqueta>
                    {(m.clientes as unknown as { nome: string } | null)?.nome} · {formatarCnj((m.processos as unknown as { numero_cnj: string } | null)?.numero_cnj ?? "")}
                  </div>
                  <p className="line-clamp-2 text-sm">{m.texto_final || "(sem texto)"}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
