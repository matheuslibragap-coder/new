import { useEffect, useState, type ReactNode } from "react";
import { dispositivo } from "../data";
import { NAO_CONSTA } from "../schema/caso";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}

export function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-slate-600 dark:text-slate-400">{sub}</p>}
    </header>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 mb-3 text-lg font-semibold">{children}</h2>;
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{children}</div>;
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <Rotulo>{rotulo}</Rotulo>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

const TONS = {
  verde: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  vermelho: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  cinza: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ambar: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  azul: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
};
export type Tom = keyof typeof TONS;

export function Etiqueta({ tom, children }: { tom: Tom; children: ReactNode }) {
  return <span className={cx("inline-block rounded px-1.5 py-0.5 text-xs font-semibold", TONS[tom])}>{children}</span>;
}

export const VERIFICAR = () => <Etiqueta tom="ambar">VERIFICAR</Etiqueta>;

export function EtiquetaImpacto({ impacto }: { impacto: "favorece" | "prejudica" | "neutro" }) {
  const m = { favorece: ["verde", "Favorece a defesa"], prejudica: ["vermelho", "Prejudica"], neutro: ["cinza", "Neutro"] } as const;
  return <Etiqueta tom={m[impacto][0]}>{m[impacto][1]}</Etiqueta>;
}

export function EtiquetaPeso({ peso }: { peso: "alto" | "medio" | "baixo" }) {
  const m = { alto: ["Peso alto", "azul"], medio: ["Peso médio", "cinza"], baixo: ["Peso baixo", "cinza"] } as const;
  return <Etiqueta tom={m[peso][1]}>{m[peso][0]}</Etiqueta>;
}

export function Fonte({ fonte }: { fonte: { peca: string; folha: string | null } }) {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      <span className="font-medium">Fonte:</span> {fonte.peca} ·{" "}
      {fonte.folha ?? <span className="italic">folha: {NAO_CONSTA}</span>}
    </p>
  );
}

export function Modal({ aberto, aoFechar, titulo, children }: { aberto: boolean; aoFechar: () => void; titulo: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aberto, aoFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={aoFechar} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Chip de artigo de lei: mostra VERIFICAR se não confirmado e abre o resumo ao clicar. */
export function Artigo({ id }: { id: string }) {
  const [aberto, setAberto] = useState(false);
  const d = dispositivo(id);
  const pendente = d.status !== "confirmado";
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className={cx(
          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
          pendente
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
            : "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
        )}
      >
        {d.rotulo}
        {pendente && <span className="font-bold">· VERIFICAR</span>}
      </button>
      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo={d.rotulo}>
        <p>{d.resumo}</p>
        {d.observacao && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d.observacao}</p>}
        <Campo rotulo="Status">
          {pendente ? <VERIFICAR /> : <Etiqueta tom="verde">CONFIRMADO</Etiqueta>}{" "}
          {d.status === "fonte_secundaria" && <span className="text-sm">conferido só em fonte secundária</span>}
        </Campo>
        <Campo rotulo="Fonte consultada">
          <p className="text-sm">{d.fonteConsultada}</p>
        </Campo>
        <a className="mt-3 inline-block text-sm font-medium text-indigo-700 underline dark:text-indigo-300" href={d.fonteOficial} target="_blank" rel="noreferrer">
          Abrir texto oficial
        </a>
      </Modal>
    </>
  );
}

export function Artigos({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <Artigo key={id} id={id} />
      ))}
    </div>
  );
}

/** Copia texto. O fallback cobre o celular acessando pela rede local (http), onde a API de clipboard não existe. */
export async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* tenta o fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = texto;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, texto.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export function BotaoCopiar({ texto, rotulo = "Copiar fórmula" }: { texto: string; rotulo?: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("");
  useEffect(() => {
    if (!estado) return;
    const t = setTimeout(() => setEstado(""), 1800);
    return () => clearTimeout(t);
  }, [estado]);
  return (
    <button
      onClick={async () => setEstado((await copiar(texto)) ? "ok" : "erro")}
      className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      {estado === "ok" ? "Copiado ✓" : estado === "erro" ? "Selecione e copie" : rotulo}
    </button>
  );
}

export function Formula({ texto }: { texto: string }) {
  return (
    <div className="mt-1 flex flex-col gap-2 rounded-lg border-l-4 border-indigo-500 bg-indigo-50/60 p-3 sm:flex-row sm:items-start dark:bg-indigo-950/30">
      <p className="flex-1 font-serif text-[15px] select-all">{texto}</p>
      <BotaoCopiar texto={texto} />
    </div>
  );
}

export function Filtro<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; texto: string }[];
  aoMudar: (v: T) => void;
}) {
  return (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button
            key={o.valor}
            onClick={() => aoMudar(o.valor)}
            aria-pressed={valor === o.valor}
            className={cx(
              "rounded-full border px-3 py-1 text-sm",
              valor === o.valor
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
            )}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Estado lembrado no navegador (aba, filtro, checklist). Falha em silêncio se o armazenamento estiver bloqueado. */
export function useLembrado<T>(chave: string, inicial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(chave);
      return s ? (JSON.parse(s) as T) : inicial;
    } catch {
      return inicial;
    }
  });
  const salvar = (nv: T) => {
    setV(nv);
    try {
      localStorage.setItem(chave, JSON.stringify(nv));
    } catch {
      /* sem armazenamento */
    }
  };
  return [v, salvar];
}
