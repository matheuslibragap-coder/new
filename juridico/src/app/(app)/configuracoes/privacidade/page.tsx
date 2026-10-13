import { Cabecalho, Campo, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { excluirTudo, sairDoEscritorio } from "./acoes";

export const metadata = { title: "Privacidade e dados" };

export default async function Privacidade({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const titular = ctx.membro.papel === "titular";
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Privacidade e dados (LGPD)" voltar={{ href: "/configuracoes", rotulo: "Configurações" }} />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Exportar dados do escritório">
        <p className="mb-3 text-sm text-slate-600">Baixe um arquivo JSON com clientes, processos, andamentos, prazos, agenda, mensagens, cálculos, financeiro, documentos e intimações.</p>
        {titular ? (
          <a href="/api/lgpd/exportar" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Baixar meus dados
          </a>
        ) : (
          <p className="text-sm text-slate-500">Somente o titular pode exportar os dados do escritório.</p>
        )}
      </Cartao>
      {titular ? (
        <Cartao titulo="Excluir conta e todos os dados">
          <p className="mb-3 text-sm text-slate-600">
            Apaga definitivamente o escritório, todos os dados e arquivos, cancela a assinatura e remove sua conta de acesso. Os demais usuários perdem o acesso. Esta ação não pode ser desfeita. Recomendamos exportar antes.
          </p>
          <form action={excluirTudo} className="space-y-3">
            <Campo rotulo={`Para confirmar, digite o nome do escritório: ${ctx.escritorio.nome}`} name="confirmacao" required autoComplete="off" />
            <Enviar variante="perigo" confirmar="Excluir definitivamente o escritório e todos os dados?">
              Excluir tudo
            </Enviar>
          </form>
        </Cartao>
      ) : (
        <Cartao titulo="Sair do escritório e excluir minha conta">
          <p className="mb-3 text-sm text-slate-600">Remove seu acesso. Os dados do escritório pertencem ao titular e são mantidos.</p>
          <form action={sairDoEscritorio}>
            <Enviar variante="perigo" confirmar="Sair do escritório e excluir sua conta?">
              Sair e excluir minha conta
            </Enviar>
          </form>
        </Cartao>
      )}
    </div>
  );
}
