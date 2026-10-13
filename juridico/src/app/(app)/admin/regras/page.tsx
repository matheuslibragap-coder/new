import { revalidatePath } from "next/cache";
import { AreaTexto, Cabecalho, Caixa, Campo, Cartao, Grade, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { exigirAdmin } from "../guarda";

async function salvar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  const codigo = texto(fd, "codigo");
  const novo = fd.get("novo") === "1";
  const md = (v: string | null) => (v && /^\d{2}-\d{2}$/.test(v) ? v : null);
  const dados = {
    nome: texto(fd, "nome"),
    rito: texto(fd, "rito"),
    contagem: texto(fd, "contagem"),
    exclui_dia_inicio: fd.get("exclui_dia_inicio") === "on",
    suspensao_inicio: md(textoOuNulo(fd, "suspensao_inicio")),
    suspensao_fim: md(textoOuNulo(fd, "suspensao_fim")),
    dje_publicacao_dia_util_seguinte: fd.get("dje") === "on",
    portal_dias_ciencia_ficta: Number(texto(fd, "portal")) || 10,
    inicio_e_fim_em_dia_util: fd.get("dia_util") === "on",
    permite_dobra: fd.get("dobra") === "on",
    fundamentacao: texto(fd, "fundamentacao"),
    validar_com_advogado: fd.get("validar") === "on",
    ativo: fd.get("ativo") === "on",
    atualizado_em: new Date().toISOString(),
  };
  try {
    const { error } = novo ? await ctx.supabase.from("regras_prazo").insert({ codigo, ...dados }) : await ctx.supabase.from("regras_prazo").update(dados).eq("codigo", codigo);
    if (error) throw error;
  } catch (e) {
    voltarCom("/admin/regras", { erro: erroAmigavel(e) });
  }
  revalidatePath("/admin/regras");
  voltarCom("/admin/regras", { ok: `Regra ${codigo} salva.` });
}

type Regra = Record<string, string | number | boolean | null>;

function FormRegra({ r, novo }: { r: Regra; novo?: boolean }) {
  return (
    <form action={salvar} className="space-y-3">
      {novo ? <input type="hidden" name="novo" value="1" /> : <input type="hidden" name="codigo" value={String(r.codigo)} />}
      <Grade colunas={3}>
        {novo && <Campo rotulo="Código" name="codigo" required pattern="[a-z0-9_]+" />}
        <Campo rotulo="Nome" name="nome" required defaultValue={String(r.nome ?? "")} />
        <Campo rotulo="Rito" name="rito" required defaultValue={String(r.rito ?? "")} />
        <Selecao rotulo="Contagem" name="contagem" defaultValue={String(r.contagem ?? "uteis")} opcoes={[{ valor: "uteis", rotulo: "Dias úteis" }, { valor: "corridos", rotulo: "Dias corridos" }]} />
        <Campo rotulo="Suspensão anual: início (MM-DD)" name="suspensao_inicio" defaultValue={String(r.suspensao_inicio ?? "")} placeholder="12-20" />
        <Campo rotulo="Suspensão anual: fim (MM-DD)" name="suspensao_fim" defaultValue={String(r.suspensao_fim ?? "")} placeholder="01-20" />
        <Campo rotulo="Ciência ficta no portal (dias corridos)" name="portal" type="number" defaultValue={String(r.portal_dias_ciencia_ficta ?? 10)} />
      </Grade>
      <div className="grid gap-1 sm:grid-cols-2">
        <Caixa name="exclui_dia_inicio" defaultChecked={r.exclui_dia_inicio !== false} rotulo="Exclui o dia do começo" />
        <Caixa name="dje" defaultChecked={r.dje_publicacao_dia_util_seguinte !== false} rotulo="DJe: publicação no 1º dia útil após a disponibilização" />
        <Caixa name="dia_util" defaultChecked={r.inicio_e_fim_em_dia_util !== false} rotulo="Início e vencimento só em dia útil" />
        <Caixa name="dobra" defaultChecked={r.permite_dobra !== false} rotulo="Permite prazo em dobro" />
        <Caixa name="validar" defaultChecked={r.validar_com_advogado !== false} rotulo="Exibir [VALIDAR COM ADVOGADO]" />
        <Caixa name="ativo" defaultChecked={r.ativo !== false} rotulo="Ativa" />
      </div>
      <AreaTexto rotulo="Fundamentação" name="fundamentacao" rows={3} required defaultValue={String(r.fundamentacao ?? "")} />
      <Enviar>Salvar</Enviar>
    </form>
  );
}

export default async function Regras({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await exigirAdmin();
  const { data: regras } = await ctx.supabase.from("regras_prazo").select("*").order("nome");
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Regras de prazo" voltar={{ href: "/admin", rotulo: "Admin" }} descricao="Os padrões iniciais estão marcados [VALIDAR COM ADVOGADO]." />
      <Mensagens busca={await searchParams} />
      {(regras ?? []).map((r) => (
        <Cartao key={r.codigo} titulo={`${r.nome} (${r.codigo})`}>
          <FormRegra r={r} />
        </Cartao>
      ))}
      <Cartao titulo="Nova regra">
        <FormRegra r={{}} novo />
      </Cartao>
    </div>
  );
}
