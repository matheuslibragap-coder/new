import Link from "next/link";
import { AreaTexto, BloqueioPlano, Cabecalho, Campo, Cartao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { verificar } from "./acoes";

export const metadata = { title: "Verificador de petição" };

export default async function Verificador({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  const liberado = ctx.temModulo("M9");
  const [{ data: anteriores }, { data: rascunho }] = await Promise.all([
    ctx.supabase.from("verificacoes").select("id, titulo, criado_em, resultado").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }).limit(20),
    b.rascunho ? ctx.supabase.from("rascunhos").select("titulo, texto").eq("id", b.rascunho).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Verificador de petição" descricao="Confere números de processo no DataJud, aponta citações sem fonte verificável, artigos com numeração inválida, datas impossíveis e divergências de nomes." />
      <Mensagens busca={b} />
      {!liberado ? (
        <BloqueioPlano modulo="O verificador de petição" />
      ) : (
        <Cartao>
          <form action={verificar} className="space-y-3">
            <Campo rotulo="Título" name="titulo" defaultValue={rascunho ? `Rascunho: ${rascunho.titulo}` : ""} />
            <input type="file" name="arquivo" accept=".pdf,.docx,.txt" className="text-sm" />
            <AreaTexto rotulo="Ou cole o texto" name="texto" rows={10} defaultValue={rascunho?.texto ?? ""} />
            <Enviar>Verificar</Enviar>
            <p className="text-xs text-slate-500">O sistema nunca afirma que uma citação existe sem ter encontrado a fonte. Ementas e acórdãos sem número verificável aparecem como NÃO VERIFICADO, com link de busca no site do tribunal.</p>
          </form>
        </Cartao>
      )}
      <Cartao titulo="Verificações anteriores">
        {!anteriores?.length ? (
          <Vazio>Nenhuma verificação.</Vazio>
        ) : (
          <ul className="space-y-1 text-sm">
            {anteriores.map((v) => {
              const r = (v.resultado as { resumo?: Record<string, number> }).resumo ?? {};
              return (
                <li key={v.id}>
                  <Link href={`/verificador/${v.id}`} className="underline">
                    {v.titulo}
                  </Link>{" "}
                  <span className="text-xs text-slate-500">
                    · {new Date(v.criado_em).toLocaleDateString("pt-BR")} · {r.erro ?? 0} erro(s), {r.alerta ?? 0} alerta(s), {r.nao_verificado ?? 0} não verificado(s)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
