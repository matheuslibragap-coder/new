import Link from "next/link";
import { LinkBotao } from "@/components/ui";
import { NOME_PRODUTO } from "@/lib/textos";

const PLANOS = [
  { nome: "Essencial", preco: "19,90", itens: ["1 usuário", "Até 30 processos monitorados", "Clientes, processos e andamentos do DataJud", "Prazos com memória de cálculo", "Agenda de audiências", "Mensagem ao cliente com envio manual", "Calculadoras e financeiro"] },
  { nome: "Pro", preco: "49,90", itens: ["1 usuário", "Até 150 processos", "Tudo do Essencial", "Contratos e procurações com assinatura eletrônica", "Banco de modelos com IA", "Verificador de petição", "Monitor de intimações", "Envio automático pelo WhatsApp"] },
  { nome: "Escritório", preco: "99,90", itens: ["Até 5 usuários com permissões", "Até 400 processos", "Tudo do Pro"] },
];

export default function Inicio() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Gestão simples para advocacia autônoma</h1>
        <p className="mx-auto max-w-2xl text-slate-600">
          Processos com andamentos automáticos do DataJud, prazos com memória de cálculo, agenda, mensagens ao cliente em linguagem simples e
          calculadoras. Feito para usar no celular, sem treinamento.
        </p>
        <div className="flex justify-center gap-3">
          <LinkBotao href="/cadastro">Testar grátis por 14 dias</LinkBotao>
          <LinkBotao href="/entrar" variante="secundario">
            Entrar
          </LinkBotao>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {PLANOS.map((p) => (
          <div key={p.nome} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{p.nome}</h2>
            <p className="mt-1 text-2xl font-semibold">
              R$ {p.preco}
              <span className="text-sm font-normal text-slate-500">/mês</span>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {p.itens.map((i) => (
                <li key={i}>• {i}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <p className="text-center text-xs text-slate-500">
        {NOME_PRODUTO} auxilia; não decide. Prazos e cálculos devem ser conferidos pelo(a) advogado(a). <Link href="/privacidade" className="underline">Privacidade</Link>
      </p>
    </div>
  );
}
