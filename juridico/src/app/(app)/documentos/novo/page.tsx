import { AreaTexto, AvisoResponsabilidade, BloqueioPlano, Cabecalho, Campo, Cartao, Grade, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { opcoesProcesso } from "../../processos/opcoes";
import { opcoesProcessos } from "../../agenda/opcoes";
import { dataPorExtenso, preencherModelo, variaveisDoModelo } from "@/lib/modelos-texto";
import { formatarDocumento } from "@/lib/documento";
import { formatarCnj } from "@/lib/cnj";
import { hojeBrasilia } from "@/lib/prazos/motor";
import { salvarDocumento } from "../acoes";

export const metadata = { title: "Gerar documento" };

const CAMPOS_LIVRES = [
  { nome: "objeto", rotulo: "Objeto / finalidade" },
  { nome: "valor", rotulo: "Valor dos honorários", placeholder: "R$ 5.000,00 (cinco mil reais)" },
  { nome: "forma_pagamento", rotulo: "Forma de pagamento", placeholder: "entrada de R$ 1.000,00 e 4 parcelas mensais de R$ 1.000,00" },
  { nome: "percentual_exito", rotulo: "Percentual de êxito", placeholder: "20%" },
  { nome: "cidade", rotulo: "Cidade de assinatura" },
];

export default async function Novo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  if (!ctx.temModulo("M7")) return <BloqueioPlano modulo="Contratos e procurações" />;
  const [{ data: modelos }, { clientes }, processos] = await Promise.all([
    ctx.supabase.from("modelos_documento").select("id, nome, conteudo").eq("ativo", true).order("nome"),
    opcoesProcesso(ctx),
    opcoesProcessos(ctx),
  ]);
  const modelo = modelos?.find((m) => m.id === b.modelo);
  const vars = modelo ? variaveisDoModelo(modelo.conteudo) : [];

  let previa: { texto: string; faltantes: string[] } | null = null;
  if (modelo && b.gerar === "1") {
    const { data: c } = b.cliente ? await ctx.supabase.from("clientes").select("*").eq("id", b.cliente).maybeSingle() : { data: null };
    const { data: p } = b.processo ? await ctx.supabase.from("processos").select("numero_cnj").eq("id", b.processo).maybeSingle() : { data: null };
    const qualificacao = c ? [c.nacionalidade, c.estado_civil, c.profissao].filter(Boolean).join(", ") : "";
    previa = preencherModelo(modelo.conteudo, {
      cliente_nome: c?.nome,
      cliente_documento: c?.documento ? formatarDocumento(c.documento) : null,
      cliente_qualificacao: qualificacao,
      cliente_endereco: c?.endereco,
      cliente_email: c?.email,
      advogado_nome: ctx.membro.nome,
      advogado_oab: ctx.membro.oab_numero,
      advogado_oab_uf: ctx.membro.oab_uf,
      escritorio_nome: ctx.escritorio.nome,
      processo_numero: p ? formatarCnj(p.numero_cnj) : null,
      data_extenso: dataPorExtenso(hojeBrasilia()),
      ...Object.fromEntries(CAMPOS_LIVRES.map((f) => [f.nome, b[f.nome]])),
    });
  }

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Gerar documento" voltar={{ href: "/documentos", rotulo: "Documentos" }} />
      <Mensagens busca={b} />
      <Cartao titulo="1. Modelo e dados">
        <form className="space-y-3">
          <input type="hidden" name="gerar" value="1" />
          <Grade>
            <Selecao rotulo="Modelo" name="modelo" required defaultValue={b.modelo ?? ""} opcoes={[{ valor: "", rotulo: "Selecione" }, ...(modelos ?? []).map((m) => ({ valor: m.id, rotulo: m.nome }))]} />
            <Selecao rotulo="Cliente" name="cliente" defaultValue={b.cliente ?? ""} opcoes={[{ valor: "", rotulo: "Selecione" }, ...clientes]} />
            <Selecao rotulo="Processo (opcional)" name="processo" defaultValue={b.processo ?? ""} opcoes={[{ valor: "", rotulo: "Sem processo" }, ...processos]} />
            {CAMPOS_LIVRES.filter((f) => !modelo || vars.includes(f.nome)).map((f) => (
              <Campo key={f.nome} rotulo={f.rotulo} name={f.nome} defaultValue={b[f.nome] ?? ""} placeholder={f.placeholder} />
            ))}
          </Grade>
          <Enviar variante="secundario">Montar prévia</Enviar>
        </form>
      </Cartao>
      {previa && modelo && (
        <Cartao titulo="2. Revisar e salvar">
          {previa.faltantes.length > 0 && (
            <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Campos sem dado no cadastro (aparecem entre colchetes): {previa.faltantes.join(", ")}. Complete o cadastro ou edite o texto.
            </p>
          )}
          <form action={salvarDocumento} className="space-y-3">
            <input type="hidden" name="modelo_id" value={modelo.id} />
            <input type="hidden" name="cliente_id" value={b.cliente ?? ""} />
            <input type="hidden" name="processo_id" value={b.processo ?? ""} />
            <Campo rotulo="Título" name="titulo" required defaultValue={`${modelo.nome.replace(" (padrão)", "")}${b.cliente ? ` - ${clientes.find((c) => c.valor === b.cliente)?.rotulo}` : ""}`} />
            <AreaTexto rotulo="Texto final (editável)" name="conteudo" rows={22} required defaultValue={previa.texto} className="font-mono" />
            <AvisoResponsabilidade extra="Documento montado automaticamente a partir do modelo e do cadastro." />
            <Enviar>Salvar documento</Enviar>
          </form>
        </Cartao>
      )}
    </div>
  );
}
