import Link from "next/link";
import { BloqueioPlano, Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { TIPOS_MODELO } from "@/components/form-modelo";
import { copiarModeloPadrao } from "./acoes";

export const metadata = { title: "Contratos e procurações" };

const COR = { nao_enviado: "cinza", aguardando: "amarelo", assinado: "verde", recusado: "vermelho", erro: "vermelho" } as const;

export default async function Documentos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const [{ data: docs }, { data: modelos }] = await Promise.all([
    ctx.supabase.from("documentos_gerados").select("id, titulo, assinatura_status, criado_em, clientes(nome)").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }).limit(100),
    ctx.supabase.from("modelos_documento").select("id, nome, tipo, escritorio_id").eq("ativo", true).order("nome"),
  ]);
  const liberado = ctx.temModulo("M7");
  const tipo = (t: string) => TIPOS_MODELO.find((x) => x.valor === t)?.rotulo ?? t;
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Contratos e procurações" descricao="Modelos com variáveis preenchidas pelo cadastro, PDF e assinatura eletrônica." acoes={liberado ? <LinkBotao href="/documentos/novo">Gerar documento</LinkBotao> : undefined} />
      <Mensagens busca={await searchParams} />
      {!liberado && <BloqueioPlano modulo="Contratos, procurações e assinatura eletrônica" />}
      <Cartao titulo="Documentos gerados">
        {!docs?.length ? (
          <Vazio>Nenhum documento.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map((d) => (
              <li key={d.id} className="py-2">
                <Link href={`/documentos/${d.id}`} className="flex flex-wrap items-center gap-2 text-sm hover:underline">
                  <span className="font-medium">{d.titulo}</span>
                  <Etiqueta cor={COR[d.assinatura_status as keyof typeof COR]}>{d.assinatura_status.replace("_", " ")}</Etiqueta>
                  <span className="text-xs text-slate-500">{(d.clientes as unknown as { nome: string } | null)?.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Modelos" acoes={<Link href="/documentos/modelos/novo" className="text-sm underline">Novo modelo</Link>}>
        <ul className="divide-y divide-slate-100 text-sm">
          {(modelos ?? []).map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {m.escritorio_id ? (
                  <Link href={`/documentos/modelos/${m.id}`} className="underline">
                    {m.nome}
                  </Link>
                ) : (
                  m.nome
                )}{" "}
                <span className="text-xs text-slate-500">· {tipo(m.tipo)}</span> {!m.escritorio_id && <Etiqueta>padrão</Etiqueta>}
              </span>
              <span className="flex gap-2">
                {liberado && (
                  <LinkBotao href={`/documentos/novo?modelo=${m.id}`} pequeno variante="secundario">
                    Usar
                  </LinkBotao>
                )}
                {!m.escritorio_id && (
                  <form action={copiarModeloPadrao}>
                    <input type="hidden" name="id" value={m.id} />
                    <Enviar pequeno variante="fantasma">
                      Copiar e editar
                    </Enviar>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Os modelos padrão são sugestões [VALIDAR COM ADVOGADO]. Adapte à sua prática antes de usar.</p>
      </Cartao>
    </div>
  );
}
