import { useEffect, useState } from "react";
import { caso, dispositivo, fasesOrdenadas, formulaDe, macetesOrdenados } from "../data";
import { Artigo, BotaoCopiar, Cartao, Rotulo, cx, useLembrado } from "../ui/comum";

/** Tempos do art. 477 do CPP, em minutos: [um acusado, mais de um acusado]. */
const FALAS = [
  { id: "acusacao", nome: "Acusação", min: [90, 150] },
  { id: "defesa", nome: "Defesa", min: [90, 150] },
  { id: "replica", nome: "Réplica", min: [60, 120] },
  { id: "treplica", nome: "Tréplica", min: [60, 120] },
] as const;

interface Relogio {
  fala: (typeof FALAS)[number]["id"];
  variosReus: boolean;
  /** Milissegundos restantes quando pausado. */
  restante: number;
  /** Instante (Date.now) em que o tempo acaba, quando rodando. */
  fimEm: number | null;
}

const total = (r: Pick<Relogio, "fala" | "variosReus">) => FALAS.find((f) => f.id === r.fala)!.min[r.variosReus ? 1 : 0] * 60_000;
const novo = (fala: Relogio["fala"], variosReus: boolean): Relogio => ({ fala, variosReus, restante: total({ fala, variosReus }), fimEm: null });

const duracao = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

function fmt(ms: number) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  const corpo = h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
  return (neg ? "+" : "") + corpo;
}

function Cronometro() {
  const [r, setR] = useLembrado<Relogio>("cronometro", novo("defesa", false));
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (!r.fimEm) return;
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, [r.fimEm]);

  const restante = r.fimEm ? r.fimEm - agora : r.restante;
  const rodando = !!r.fimEm;
  const min = restante / 60_000;

  const alternar = () =>
    setR(rodando ? { ...r, restante: r.fimEm! - Date.now(), fimEm: null } : { ...r, fimEm: Date.now() + r.restante });
  const somar = (ms: number) => setR(rodando ? { ...r, fimEm: r.fimEm! + ms } : { ...r, restante: r.restante + ms });

  return (
    <Cartao>
      <div className="grid grid-cols-4 gap-1">
        {FALAS.map((f) => (
          <button
            key={f.id}
            onClick={() => setR(novo(f.id, r.variosReus))}
            aria-pressed={r.fala === f.id}
            className={cx(
              "rounded-lg border px-1 py-2 text-sm font-medium",
              r.fala === f.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-slate-700",
            )}
          >
            {f.nome}
            <span className="block text-xs font-normal opacity-80">{duracao(f.min[r.variosReus ? 1 : 0])}</span>
          </button>
        ))}
      </div>

      <div
        className={cx(
          "my-4 text-center font-mono text-6xl font-bold tabular-nums sm:text-7xl",
          restante < 0 ? "text-rose-600" : min < 5 ? "text-rose-600" : min < 10 ? "text-amber-600" : "",
        )}
        aria-live="off"
      >
        {fmt(restante)}
      </div>
      {restante < 0 && <p className="-mt-2 mb-3 text-center text-sm font-semibold text-rose-600">Tempo esgotado</p>}

      <div className="grid grid-cols-3 gap-2">
        <button onClick={alternar} className={cx("rounded-lg py-3 font-semibold text-white", rodando ? "bg-amber-600" : "bg-emerald-600")}>
          {rodando ? "Pausar" : "Iniciar"}
        </button>
        <button onClick={() => somar(3 * 60_000)} className="rounded-lg border border-slate-300 py-3 text-sm font-medium dark:border-slate-700">
          + aparte (3 min)
        </button>
        <button onClick={() => setR(novo(r.fala, r.variosReus))} className="rounded-lg border border-slate-300 py-3 text-sm font-medium dark:border-slate-700">
          Zerar
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={r.variosReus} onChange={(e) => setR(novo(r.fala, e.target.checked))} className="h-4 w-4" />
        Mais de um acusado (art. 477, §2º)
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Artigo id="cpp-477" />
        <Artigo id="cpp-497-xii" />
      </div>
    </Cartao>
  );
}

function PlanoDaFala() {
  const teses = [...caso.teses].sort((a, b) => a.prioridade - b.prioridade);
  let acum = 0;
  return (
    <Cartao>
      <Rotulo>Plano da fala da defesa</Rotulo>
      <ol className="mt-1 space-y-1 text-[15px]">
        {teses.map((t) => {
          acum += t.minutos;
          return (
            <li key={t.id} className="flex justify-between gap-2">
              <span>{t.titulo}</span>
              <span className="shrink-0 text-slate-500 tabular-nums">
                {t.minutos} min · até {acum}′
              </span>
            </li>
          );
        })}
      </ol>
    </Cartao>
  );
}

function Checklist() {
  const [feitos, setFeitos] = useLembrado<number[]>("checklist", []);
  return (
    <Cartao>
      <div className="flex items-center justify-between">
        <Rotulo>
          Checklist de bolso ({feitos.length}/{caso.checklist.length})
        </Rotulo>
        <button onClick={() => setFeitos([])} className="text-sm text-slate-500 underline">
          Desmarcar tudo
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {caso.checklist.map((c, i) => (
          <li key={i}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={feitos.includes(i)}
                onChange={(e) => setFeitos(e.target.checked ? [...feitos, i] : feitos.filter((x) => x !== i))}
              />
              <span className={cx(feitos.includes(i) && "text-slate-400 line-through")}>{c}</span>
            </label>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

export default function Plenario() {
  const requerimentos = macetesOrdenados.filter((m) => m.requerimento);
  const [aberto, setAberto] = useState<string | null>(null);
  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">Modo plenário</h1>
      <Cronometro />

      <h2 className="mt-6 mb-2 text-lg font-semibold">Requerimentos, na ordem da sessão</h2>
      {fasesOrdenadas.map((f) => {
        const lista = requerimentos.filter((m) => m.fase === f.id);
        if (!lista.length) return null;
        return (
          <section key={f.id} className="mb-4">
            <div className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">{f.titulo}</div>
            <div className="space-y-2">
              {lista.map((m) => {
                const formula = formulaDe(m.id, m.formula);
                const exp = aberto === m.id;
                return (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 p-3">
                      <button onClick={() => setAberto(exp ? null : m.id)} className="min-w-0 flex-1 text-left" aria-expanded={exp}>
                        <div className="leading-snug font-semibold">{m.titulo}</div>
                        <div className="text-sm text-slate-500">{m.dispositivos.map((d) => dispositivo(d).rotulo).join(" · ")}</div>
                        <div className="text-sm text-indigo-700 dark:text-indigo-300">{exp ? "Fechar" : "Ver fórmula e momento"}</div>
                      </button>
                      <BotaoCopiar texto={formula} rotulo="Copiar" />
                    </div>
                    {exp && (
                      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Quando:</span> {m.momento}
                        </p>
                        <p className="mt-2 font-serif text-[16px] select-all">{formula}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.dispositivos.map((d) => (
                            <Artigo key={d} id={d} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="mt-6 space-y-3">
        <PlanoDaFala />
        <Checklist />
      </div>
    </>
  );
}
