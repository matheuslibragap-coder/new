import Link from "next/link";
import { Cabecalho } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";

export const metadata = { title: "Configurações" };

export default async function Config() {
  const ctx = await obterContexto();
  const titular = ctx.membro.papel === "titular";
  const itens = [
    { href: "/configuracoes/escritorio", titulo: "Escritório e perfil", desc: "Dados do escritório, seus dados e OAB, WhatsApp Business." },
    { href: "/configuracoes/plano", titulo: "Plano e pagamento", desc: `Plano ${ctx.plano.nome}. Uso das cotas e assinatura.` },
    { href: "/configuracoes/usuarios", titulo: "Usuários e permissões", desc: `Até ${ctx.plano.max_usuarios} usuário(s) no plano atual.` },
    { href: "/notificacoes", titulo: "Notificações", desc: "Ativar alertas no celular." },
    { href: "/configuracoes/privacidade", titulo: "Privacidade e dados (LGPD)", desc: "Exportar dados, excluir conta e dados." },
    ...(titular ? [{ href: "/configuracoes/logs", titulo: "Registro de acessos", desc: "Quem fez o quê e quando." }] : []),
  ];
  return (
    <div>
      <Cabecalho titulo="Configurações" />
      <div className="grid gap-3 sm:grid-cols-2">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400">
            <div className="font-medium">{i.titulo}</div>
            <div className="text-sm text-slate-600">{i.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
