import Link from "next/link";
import { Cabecalho } from "@/components/ui";
import { exigirAdmin } from "./guarda";

export const metadata = { title: "Admin" };

const SECOES = [
  { href: "/admin/feriados", titulo: "Feriados e suspensões", desc: "Feriados nacionais, estaduais e de comarca; portarias de suspensão de expediente." },
  { href: "/admin/regras", titulo: "Regras de prazo", desc: "Contagem por rito: dias úteis ou corridos, suspensões, publicação no DJe, ciência ficta." },
  { href: "/admin/indices", titulo: "Índices econômicos", desc: "IPCA, IPCA-E, INPC, Selic e TR. Importação por CSV." },
  { href: "/admin/modelos", titulo: "Modelos de documento padrão", desc: "Contratos de honorários e procurações oferecidos a todos os escritórios." },
  { href: "/admin/leis", titulo: "Leis de referência", desc: "Último artigo de cada lei, usado pelo verificador de petição." },
];

export default async function Admin() {
  await exigirAdmin();
  return (
    <div>
      <Cabecalho titulo="Admin da plataforma" descricao="Nenhuma regra jurídica fica fixa no código: tudo é editado aqui. Alterações valem para todos os escritórios." />
      <div className="grid gap-3 sm:grid-cols-2">
        {SECOES.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400">
            <div className="font-medium">{s.titulo}</div>
            <div className="text-sm text-slate-600">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
