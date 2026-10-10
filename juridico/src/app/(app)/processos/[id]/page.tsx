import { notFound } from "next/navigation";
import Link from "next/link";
import { AreaTexto, Cabecalho, Caixa, Campo, Cartao, Etiqueta, FonteDatajud, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { descreverMovimento } from "@/lib/datajud";
import { formatarDataBr, hojeBrasilia } from "@/lib/prazos/motor";
import { CamposProcesso } from "../form-processo";
import { opcoesProcesso } from "../opcoes";
import { adicionarAndamento, atualizarProcesso, excluirAndamentoManual, excluirProcesso, ressincronizar } from "../acoes";
import { MarcarVistos } from "./marcar-vistos";

const fmtData = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "");
const fmtDataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "");

export default async function Processo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: p } = await ctx.supabase.from("processos").select("*, clientes(id, nome)").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: andamentos }, { data: tarefas }, { data: compromissos }, op] = await Promise.all([
    ctx.supabase.from("andamentos").select("id, data_hora, nome, complementos, origem, visto_em, importacao_inicial, orgao_julgador").eq("processo_id", id).order("data_hora", { ascending: false }).limit(300),
    ctx.supabase.from("tarefas").select("id, titulo, data_vencimento, status").eq("processo_id", id).eq("status", "aberta").order("data_vencimento"),
    ctx.supabase.from("compromissos").select("id, titulo, inicio, tipo").eq("processo_id", id).gte("inicio", new Date().toISOString()).order("inicio"),
    opcoesProcesso(ctx),
  ]);
  const cliente = p.clientes as unknown as { id: string; nome: string } | null;
  const haNovos = (andamentos ?? []).some((a) => !a.visto_em && !a.importacao_inicial);
  const hoje = hojeBrasilia();

  return (
    <div className="space-y-4">
      <MarcarVistos processoId={id} haNovos={haNovos} />
      <Cabecalho
        titulo={formatarCnj(p.numero_cnj)}
        descricao={[p.tribunal_sigla, p.classe, cliente?.nome].filter(Boolean).join(" · ")}
        voltar={{ href: "/processos", rotulo: "Processos" }}
      />
      <Mensagens busca={await searchParams} />

      <div className="flex flex-wrap gap-2">
        <LinkBotao href={`/prazos/calculadora?processo=${id}`}>Calcular prazo</LinkBotao>
        <LinkBotao href={`/agenda/novo?processo=${id}`} variante="secundario">
          Nova audiência
        </LinkBotao>
        <LinkBotao href={`/financeiro/novo?processo=${id}`} variante="secundario">
          Lançamento financeiro
        </LinkBotao>
        {p.datajud_alias && (
          <form action={ressincronizar}>
            <input type="hidden" name="id" value={id} />
            <Enviar variante="secundario">Consultar DataJud agora</Enviar>
          </form>
        )}
      </div>

      <Cartao titulo="Capa do processo">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ["Tribunal", p.tribunal_sigla],
            ["Classe", p.classe],
            ["Assunto", p.assunto],
            ["Órgão julgador", p.orgao_julgador],
            ["Grau", p.grau],
            ["Ajuizamento", fmtData(p.data_ajuizamento)],
            ["Comarca", p.comarca],
            ["Vara", p.vara],
            ["Cliente", cliente ? <Link key="c" href={`/clientes/${cliente.id}`} className="underline">{cliente.nome}</Link> : null],
            ["Sigilo", p.sigiloso ? "Sim" : null],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="text-slate-900">{v}</dd>
              </div>
            ))}
        </dl>
        <div className="mt-3 text-xs text-slate-500">
          {p.datajud_ultima_consulta && <>Última consulta: {fmtDataHora(p.datajud_ultima_consulta)}. </>}
          {p.datajud_erro && <span className="text-amber-700">{p.datajud_erro}</span>}
        </div>
        {p.datajud_status === "ok" && <FonteDatajud />}
      </Cartao>

      <div className="grid gap-4 md:grid-cols-2">
        <Cartao titulo="Prazos abertos" acoes={<Link href={`/prazos/calculadora?processo=${id}`} className="text-sm underline">Novo</Link>}>
          {!tarefas?.length ? (
            <Vazio>Nenhum prazo aberto.</Vazio>
          ) : (
            <ul className="space-y-1 text-sm">
              {tarefas.map((t) => (
                <li key={t.id}>
                  <Link href={`/prazos/${t.id}`} className="hover:underline">
                    {formatarDataBr(t.data_vencimento)} · {t.titulo}
                  </Link>{" "}
                  {t.data_vencimento < hoje && <Etiqueta cor="vermelho">vencido</Etiqueta>}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <Cartao titulo="Próximos compromissos">
          {!compromissos?.length ? (
            <Vazio>Nenhum compromisso futuro.</Vazio>
          ) : (
            <ul className="space-y-1 text-sm">
              {compromissos.map((c) => (
                <li key={c.id}>
                  <Link href={`/agenda/${c.id}`} className="hover:underline">
                    {fmtDataHora(c.inicio)} · {c.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <Cartao titulo={`Andamentos (${andamentos?.length ?? 0})`}>
        {!andamentos?.length ? (
          <Vazio>Nenhum andamento. {p.datajud_status !== "ok" && "Registre manualmente abaixo."}</Vazio>
        ) : (
          <ol className="space-y-3">
            {andamentos.map((a) => (
              <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{fmtDataHora(a.data_hora)}</span>
                  {!a.visto_em && !a.importacao_inicial && <Etiqueta cor="roxo">novo</Etiqueta>}
                  {a.origem === "manual" && <Etiqueta>manual</Etiqueta>}
                  {a.origem === "intimacao" && <Etiqueta cor="azul">intimação</Etiqueta>}
                </div>
                <p className="text-sm text-slate-900">{descreverMovimento({ nome: a.nome, complementosTabelados: a.complementos as never })}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  <Link href={`/mensagens/nova?andamento=${a.id}`} className="text-slate-600 underline">
                    Explicar ao cliente
                  </Link>
                  <Link href={`/prazos/calculadora?processo=${id}&data=${a.data_hora.slice(0, 10)}`} className="text-slate-600 underline">
                    Calcular prazo
                  </Link>
                  {a.origem === "manual" && (
                    <form action={excluirAndamentoManual}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="processo_id" value={id} />
                      <button className="text-red-700 underline">excluir</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {andamentos?.some((a) => a.origem === "datajud") && <FonteDatajud />}
      </Cartao>

      <Cartao titulo="Registrar andamento manual">
        <form action={adicionarAndamento} className="space-y-3">
          <input type="hidden" name="processo_id" value={id} />
          <Campo rotulo="Data" name="data" type="date" required defaultValue={hoje} />
          <AreaTexto rotulo="Descrição" name="descricao" rows={2} required />
          <Enviar variante="secundario">Registrar</Enviar>
        </form>
      </Cartao>

      <Cartao titulo="Dados do processo">
        <form action={atualizarProcesso} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <CamposProcesso processo={p} clientes={op.clientes} ritos={op.ritos} />
          <Caixa name="ativo" defaultChecked={p.ativo} rotulo="Processo ativo (desmarque para arquivar)" />
          <Enviar>Salvar</Enviar>
        </form>
      </Cartao>

      <Cartao titulo="Excluir processo">
        <form action={excluirProcesso}>
          <input type="hidden" name="id" value={id} />
          <p className="mb-3 text-sm text-slate-600">Remove o processo com andamentos, prazos e mensagens. Para manter o histórico, prefira arquivar.</p>
          <Enviar variante="perigo" confirmar="Excluir este processo e todos os dados vinculados?">
            Excluir
          </Enviar>
        </form>
      </Cartao>
    </div>
  );
}
