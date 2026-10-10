import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AVISO_RESPONSABILIDADE, FONTE_DATAJUD } from "@/lib/textos";

export function Cabecalho({ titulo, descricao, acoes, voltar }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <div className="mb-5">
      {voltar && (
        <Link href={voltar.href} className="mb-2 inline-block text-sm text-slate-500 hover:text-slate-800">
          ‹ {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-slate-600">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
    </div>
  );
}

export function Cartao({ titulo, children, acoes, className = "" }: { titulo?: ReactNode; children: ReactNode; acoes?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(titulo || acoes) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {titulo && <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>}
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}

const estilosBotao = {
  primario: "bg-slate-900 text-white hover:bg-slate-700",
  secundario: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  perigo: "bg-red-700 text-white hover:bg-red-600",
  sucesso: "bg-emerald-700 text-white hover:bg-emerald-600",
  fantasma: "text-slate-700 hover:bg-slate-100",
};
export type VarianteBotao = keyof typeof estilosBotao;

export function classeBotao(v: VarianteBotao = "primario", pequeno = false) {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 ${pequeno ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${estilosBotao[v]}`;
}

export function Botao({ variante = "primario", pequeno, className = "", ...props }: ComponentProps<"button"> & { variante?: VarianteBotao; pequeno?: boolean }) {
  return <button {...props} className={`${classeBotao(variante, pequeno)} ${className}`} />;
}

export function LinkBotao({ variante = "primario", pequeno, className = "", ...props }: ComponentProps<typeof Link> & { variante?: VarianteBotao; pequeno?: boolean }) {
  return <Link {...props} className={`${classeBotao(variante, pequeno)} ${className}`} />;
}

const classeCampo = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export function Campo({ rotulo, ajuda, className = "", ...props }: ComponentProps<"input"> & { rotulo: string; ajuda?: ReactNode }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="font-medium text-slate-700">
        {rotulo}
        {props.required && <span className="text-red-600"> *</span>}
      </span>
      <input {...props} className={classeCampo} />
      {ajuda && <span className="mt-1 block text-xs text-slate-500">{ajuda}</span>}
    </label>
  );
}

export function Selecao({ rotulo, ajuda, opcoes, className = "", ...props }: ComponentProps<"select"> & { rotulo: string; ajuda?: ReactNode; opcoes: { valor: string; rotulo: string }[] }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="font-medium text-slate-700">
        {rotulo}
        {props.required && <span className="text-red-600"> *</span>}
      </span>
      <select {...props} className={classeCampo}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ajuda && <span className="mt-1 block text-xs text-slate-500">{ajuda}</span>}
    </label>
  );
}

export function AreaTexto({ rotulo, ajuda, className = "", ...props }: ComponentProps<"textarea"> & { rotulo: string; ajuda?: ReactNode }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="font-medium text-slate-700">
        {rotulo}
        {props.required && <span className="text-red-600"> *</span>}
      </span>
      <textarea {...props} className={classeCampo} />
      {ajuda && <span className="mt-1 block text-xs text-slate-500">{ajuda}</span>}
    </label>
  );
}

export function Caixa({ rotulo, ...props }: ComponentProps<"input"> & { rotulo: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input type="checkbox" {...props} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
      <span>{rotulo}</span>
    </label>
  );
}

const cores = {
  cinza: "bg-slate-100 text-slate-700",
  azul: "bg-sky-100 text-sky-800",
  verde: "bg-emerald-100 text-emerald-800",
  amarelo: "bg-amber-100 text-amber-900",
  vermelho: "bg-red-100 text-red-800",
  roxo: "bg-violet-100 text-violet-800",
};
export function Etiqueta({ cor = "cinza", children }: { cor?: keyof typeof cores; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cores[cor]}`}>{children}</span>;
}

export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      <p>{children}</p>
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

/** Aviso obrigatório em prazos, cálculos e textos gerados. */
export function AvisoResponsabilidade({ extra }: { extra?: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="note">
      <strong>{AVISO_RESPONSABILIDADE}</strong>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}

export function FonteDatajud() {
  return <p className="mt-2 text-xs text-slate-500">{FONTE_DATAJUD}</p>;
}

export function Alerta({ tipo = "info", children }: { tipo?: "info" | "erro" | "ok" | "atencao"; children: ReactNode }) {
  const c = { info: "border-sky-200 bg-sky-50 text-sky-900", erro: "border-red-200 bg-red-50 text-red-800", ok: "border-emerald-200 bg-emerald-50 text-emerald-900", atencao: "border-amber-300 bg-amber-50 text-amber-900" }[tipo];
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${c}`} role={tipo === "erro" ? "alert" : "status"}>
      {children}
    </div>
  );
}

type Busca = Record<string, string | string[] | undefined>;
/** Exibe ?erro= e ?ok= vindos das Server Actions. */
export function Mensagens({ busca }: { busca: Busca }) {
  const erro = typeof busca.erro === "string" ? busca.erro : null;
  const ok = typeof busca.ok === "string" ? busca.ok : null;
  if (!erro && !ok) return null;
  return <div className="mb-4">{erro ? <Alerta tipo="erro">{erro}</Alerta> : <Alerta tipo="ok">{ok}</Alerta>}</div>;
}

export function BloqueioPlano({ modulo, nomePlano = "Pro" }: { modulo: string; nomePlano?: string }) {
  return (
    <Cartao>
      <p className="text-sm text-slate-700">
        {modulo} está disponível a partir do plano {nomePlano}. Os dados que você já cadastrou continuam acessíveis.
      </p>
      <div className="mt-3">
        <LinkBotao href="/configuracoes/plano">Ver planos</LinkBotao>
      </div>
    </Cartao>
  );
}

export function Grade({ children, colunas = 2 }: { children: ReactNode; colunas?: 2 | 3 | 4 }) {
  const c = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[colunas];
  return <div className={`grid grid-cols-1 gap-3 ${c}`}>{children}</div>;
}

export function Tabela({ cabecalho, children }: { cabecalho: string[]; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {cabecalho.map((c) => (
              <th key={c} className="px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
