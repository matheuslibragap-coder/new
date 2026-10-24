import { useState } from "react";
import { caso, prova, provaFavorece } from "../data";
import { Artigos, Campo, Cartao, Etiqueta, Modal, Rotulo, Subtitulo, Titulo, cx } from "../ui/comum";

type Tese = (typeof caso.teses)[number];

const total = caso.teses.reduce((s, t) => s + t.minutos, 0);
const principais = caso.teses.filter((t) => t.prioridade === 1);
const minPrincipais = principais.reduce((s, t) => s + t.minutos, 0);
const raizes = caso.teses.filter((t) => !t.pai).sort((a, b) => a.prioridade - b.prioridade);
const filhos = (id: string) => caso.teses.filter((t) => t.pai === id);

function No({ t, aoAbrir, destaque }: { t: Tese; aoAbrir: (t: Tese) => void; destaque?: boolean }) {
  return (
    <button
      onClick={() => aoAbrir(t)}
      className={cx(
        "w-full rounded-xl border p-3 text-left hover:border-indigo-500",
        destaque
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/50"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{t.rotulo}</span>
        <span className="text-sm font-medium tabular-nums">{t.minutos} min</span>
      </div>
      <div className="mt-0.5 font-semibold">{t.titulo}</div>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.quesito}</div>
    </button>
  );
}

function Seta({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center py-1 text-sm text-slate-500">
      <span className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
      <span className="rounded-full border border-slate-300 px-2 py-0.5 dark:border-slate-700">{texto}</span>
      <span className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
    </div>
  );
}

export default function Teses() {
  const [aberta, setAberta] = useState<Tese | null>(null);
  const [revisada, setRevisada] = useState(true);
  const pct = Math.round((minPrincipais / total) * 100);

  return (
    <>
      <Titulo sub="Em ordem de prioridade. Toque em uma tese para ver fundamento, provas e quesito.">Árvore de teses</Titulo>

      <Cartao>
        <Rotulo>Distribuição do tempo de fala ({total} min)</Rotulo>
        <div className="mt-2 flex h-6 overflow-hidden rounded-md text-xs font-semibold text-white">
          <div className="flex items-center justify-center bg-indigo-600" style={{ width: `${pct}%` }}>
            Principais {pct}%
          </div>
          <div className="flex flex-1 items-center justify-center bg-slate-500">Subsidiárias {100 - pct}%</div>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{caso.recomendacao}</p>
      </Cartao>

      <div className="mx-auto mt-6 max-w-xl">
        {raizes.map((t, i) => {
          const sub = filhos(t.id);
          return (
            <div key={t.id}>
              {i > 0 && <Seta texto={i === 1 ? "se houver condenação" : "e ainda"} />}
              {sub.length ? (
                <div className="rounded-2xl border-2 border-dashed border-indigo-300 p-2 dark:border-indigo-800">
                  <div className="mb-1 px-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Mesma votação: {t.quesito}</div>
                  <No t={t} aoAbrir={setAberta} destaque />
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {sub.map((f) => (
                      <No key={f.id} t={f} aoAbrir={setAberta} destaque />
                    ))}
                  </div>
                </div>
              ) : (
                <No t={t} aoAbrir={setAberta} />
              )}
            </div>
          );
        })}
      </div>

      <Modal aberto={!!aberta} aoFechar={() => setAberta(null)} titulo={aberta?.titulo}>
        {aberta && (
          <>
            <div className="flex flex-wrap gap-2">
              <Etiqueta tom="azul">{aberta.rotulo}</Etiqueta>
              <Etiqueta tom="cinza">{aberta.minutos} min de fala</Etiqueta>
            </div>
            <Campo rotulo="Fundamento">{aberta.fundamento}</Campo>
            <Campo rotulo="Dispositivos">
              <Artigos ids={aberta.dispositivos} />
            </Campo>
            <Campo rotulo="Quesito">{aberta.quesito}</Campo>
            <Campo rotulo="Provas que sustentam (ou que precisam ser enfrentadas)">
              <ul className="space-y-1">
                {aberta.provas.map((id) => (
                  <li key={id} className="flex gap-2">
                    <span className={cx("mt-2 h-2 w-2 shrink-0 rounded-full", provaFavorece(id) ? "bg-emerald-500" : "bg-rose-500")} />
                    <span>{prova(id).titulo}</span>
                  </li>
                ))}
              </ul>
            </Campo>
            {aberta.observacao && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950/40">{aberta.observacao}</p>}
          </>
        )}
      </Modal>

      <Subtitulo>Sustentação-modelo</Subtitulo>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRevisada(!revisada)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-700"
        >
          {revisada ? "Mostrar texto original" : "Mostrar versão revisada"}
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {revisada ? "Parágrafos com risco substituídos pela versão apoiada na prova." : "Texto original do estudo, com os alertas."}
        </span>
      </div>
      <div className="space-y-3">
        {caso.sustentacao.map((s) => {
          const usaRevisada = revisada && s.versaoRevisada;
          return (
            <Cartao key={s.id}>
              <p className="font-serif text-[16px] leading-relaxed">{usaRevisada ? s.versaoRevisada : s.texto}</p>
              {usaRevisada && <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Versão revisada</p>}
              {s.alerta && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm dark:bg-amber-950/40">
                  <span className="font-semibold">Alerta: </span>
                  {s.alerta}
                </p>
              )}
            </Cartao>
          );
        })}
      </div>
    </>
  );
}
