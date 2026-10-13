import { revalidatePath } from "next/cache";
import { Cabecalho, Campo, Cartao, Mensagens, Tabela } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { exigirAdmin } from "../guarda";

async function salvar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  const { error } = await ctx.supabase.from("leis_referencia").upsert({
    sigla: texto(fd, "sigla").toUpperCase(),
    nome: texto(fd, "nome"),
    apelidos: texto(fd, "apelidos").split("|").map((a) => a.trim()).filter(Boolean),
    ultimo_artigo: Number(texto(fd, "ultimo_artigo")),
    fonte: textoOuNulo(fd, "fonte"),
  });
  if (error) voltarCom("/admin/leis", { erro: erroAmigavel(error) });
  revalidatePath("/admin/leis");
  voltarCom("/admin/leis", { ok: "Salvo." });
}

export default async function Leis({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await exigirAdmin();
  const { data } = await ctx.supabase.from("leis_referencia").select("*").order("sigla");
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Leis de referência" voltar={{ href: "/admin", rotulo: "Admin" }} descricao="Usadas pelo verificador para apontar artigos com numeração inválida." />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Incluir ou alterar (pela sigla)">
        <form action={salvar} className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Sigla" name="sigla" required />
          <Campo rotulo="Nome" name="nome" required />
          <Campo rotulo="Apelidos (separados por |)" name="apelidos" required placeholder="CPC|CPC/15|Código de Processo Civil" />
          <Campo rotulo="Último artigo" name="ultimo_artigo" type="number" required />
          <Campo rotulo="Fonte" name="fonte" type="url" className="sm:col-span-2" />
          <Enviar>Salvar</Enviar>
        </form>
      </Cartao>
      <Cartao>
        <Tabela cabecalho={["Sigla", "Nome", "Apelidos", "Último artigo"]}>
          {(data ?? []).map((l) => (
            <tr key={l.sigla}>
              <td className="px-3 py-1.5 font-medium">{l.sigla}</td>
              <td className="px-3 py-1.5">{l.nome}</td>
              <td className="px-3 py-1.5 text-xs">{l.apelidos.join(" | ")}</td>
              <td className="px-3 py-1.5">{l.ultimo_artigo}</td>
            </tr>
          ))}
        </Tabela>
      </Cartao>
    </div>
  );
}
