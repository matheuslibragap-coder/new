import { useState } from "react";
import { caso } from "../data";
import { NAO_CONSTA } from "../schema/caso";
import { Artigos, Campo, Cartao, EtiquetaImpacto, Filtro, Fonte, Modal, Subtitulo, Titulo, cx, useLembrado } from "../ui/comum";

const FASES = {
  inquerito: "Inquérito",
  instrucao: "Instrução",
  "primeira-fase": "1ª fase do júri",
  recursos: "Recursos",
  plenario: "Plenário",
  execucao: "Execução",
} as const;

type Fase = keyof typeof FASES;
type Impacto = "favorece" | "prejudica" | "neutro";
type Evento = (typeof caso.linhaFato)[number] | (typeof caso.linhaProcesso)[number];

const COR = { favorece: "bg-emerald-500", prejudica: "bg-rose-500", neutro: "bg-slate-400" };

function Trilha({ eventos, rotulo, aoAbrir }: { eventos: Evento[]; rotulo: (e: Evento) => string; aoAbrir: (e: Evento) => void }) {
  if (!eventos.length) return <p className="text-slate-500">Nenhum evento com esses filtros.</p>;
  return (
    <ol className="relative ml-2 border-l-2 border-slate-200 dark:border-slate-800">
      {eventos.map((e) => (
        <li key={e.id} className="relative mb-3 pl-5">
          <span className={cx("absolute top-4 -left-[7px] h-3 w-3 rounded-full ring-4 ring-slate-50 dark:ring-slate-950", COR[e.impacto])} />
          <button
            onClick={() => aoAbrir(e)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
          >
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{rotulo(e)}</div>
            <div className="font-semibold">{e.titulo}</div>
            <div className="mt-1">
              <EtiquetaImpacto impacto={e.impacto} />
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function LinhaTempo() {
  const [fase, setFase] = useLembrado<Fase | "todas">("lt-fase", "todas");
  const [impacto, setImpacto] = useLembrado<Impacto | "todos">("lt-impacto", "todos");
  const [aberto, setAberto] = useState<Evento | null>(null);

  const passaImpacto = (e: Evento) => impacto === "todos" || e.impacto === impacto;
  const fato = [...caso.linhaFato].sort((a, b) => a.ordem - b.ordem).filter(passaImpacto);
  const processo = [...caso.linhaProcesso]
    .sort((a, b) => a.ordem - b.ordem)
    .filter(passaImpacto)
    .filter((e) => fase === "todas" || e.fase === fase);

  return (
    <>
      <Titulo sub="Toque em um evento para ver o detalhe e a fonte nos autos.">Linha do tempo</Titulo>

      <Cartao className="space-y-3">
        <Filtro
          rotulo="Impacto"
          valor={impacto}
          aoMudar={setImpacto}
          opcoes={[
            { valor: "todos", texto: "Todos" },
            { valor: "favorece", texto: "Favorece" },
            { valor: "prejudica", texto: "Prejudica" },
            { valor: "neutro", texto: "Neutro" },
          ]}
        />
        <Filtro
          rotulo="Fase (linha do processo)"
          valor={fase}
          aoMudar={setFase}
          opcoes={[{ valor: "todas" as const, texto: "Todas" }, ...Object.entries(FASES).map(([v, t]) => ({ valor: v as Fase, texto: t }))]}
        />
      </Cartao>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <Subtitulo>Linha do fato: a manhã na cela</Subtitulo>
          <p className="-mt-2 mb-3 text-sm text-slate-600 dark:text-slate-400">Conforme os relatos; quem conta está no detalhe.</p>
          <Trilha eventos={fato} rotulo={(e) => ("momento" in e ? e.momento : "")} aoAbrir={setAberto} />
        </section>
        <section>
          <Subtitulo>Linha do processo</Subtitulo>
          <p className="-mt-2 mb-3 text-sm text-slate-600 dark:text-slate-400">Do inquérito à execução.</p>
          <Trilha
            eventos={processo}
            rotulo={(e) => ("fase" in e ? `${e.data ?? `data: ${NAO_CONSTA}`} · ${FASES[e.fase]}` : "")}
            aoAbrir={setAberto}
          />
        </section>
      </div>

      <Modal aberto={!!aberto} aoFechar={() => setAberto(null)} titulo={aberto?.titulo}>
        {aberto && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              {"momento" in aberto ? aberto.momento : `${aberto.data ?? `data: ${NAO_CONSTA}`} · ${FASES[aberto.fase]}`}
              <EtiquetaImpacto impacto={aberto.impacto} />
            </div>
            <p className="mt-3">{aberto.descricao}</p>
            {"relatoDe" in aberto && <Campo rotulo="Relato de">{aberto.relatoDe}</Campo>}
            <div className="mt-3">
              <Fonte fonte={aberto.fonte} />
            </div>
            {"dispositivos" in aberto && aberto.dispositivos.length > 0 && (
              <Campo rotulo="Dispositivos">
                <Artigos ids={aberto.dispositivos} />
              </Campo>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
