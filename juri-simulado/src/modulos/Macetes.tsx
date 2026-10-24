import { useState } from "react";
import { caso, fasesOrdenadas, formulaDe, macetes, macetesOrdenados } from "../data";
import type { TMacete } from "../schema/macetes";
import { Artigos, Campo, Cartao, Formula, Rotulo, Subtitulo, Titulo, cx } from "../ui/comum";

function CardMacete({ m, n }: { m: TMacete; n: number }) {
  return (
    <Cartao>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{n}</span>
        <h3 className="text-lg leading-snug font-semibold">{m.titulo}</h3>
      </div>
      <div className="mt-2">
        <Artigos ids={m.dispositivos} />
      </div>
      <Campo rotulo="Quando usar">{m.momento}</Campo>
      <Campo rotulo="O que pedir">{m.pedido}</Campo>
      <Campo rotulo="Fórmula">
        <Formula texto={formulaDe(m.id, m.formula)} />
      </Campo>
      <div className="mt-3 rounded-lg bg-rose-50 p-3 dark:bg-rose-950/40">
        <div className="text-xs font-semibold tracking-wide text-rose-800 uppercase dark:text-rose-300">Se não fizer</div>
        <p className="mt-0.5">{m.seNaoFizer}</p>
      </div>
      <div className="mt-3 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/40">
        <div className="text-xs font-semibold tracking-wide text-indigo-800 uppercase dark:text-indigo-300">No caso</div>
        <p className="mt-0.5">{caso.macetes[m.id].aplicacao}</p>
      </div>
      {m.alerta && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-[15px] dark:bg-amber-950/40">
          <span className="font-semibold">Alerta: </span>
          {m.alerta}
        </p>
      )}
      {m.divergencia && (
        <p className="mt-3 rounded-lg border border-amber-300 p-3 text-[15px] dark:border-amber-800">
          <span className="font-semibold">Divergência: </span>
          {m.divergencia}
        </p>
      )}
    </Cartao>
  );
}

/** Conteúdo do caso que acompanha cada fase da sessão. */
function ExtrasDaFase({ fase }: { fase: string }) {
  if (fase === "abertura" && caso.criteriosJurados.length)
    return (
      <Cartao className="border-dashed">
        <Rotulo>Critérios de recusa para este caso</Rotulo>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {caso.criteriosJurados.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Cartao>
    );
  if (fase === "instrucao" && caso.roteiros.length)
    return (
      <>
        {caso.roteiros.map((r) => (
          <Cartao key={r.id} className="border-dashed">
            <Rotulo>Roteiro de perguntas</Rotulo>
            <h3 className="mt-0.5 font-semibold">{r.testemunha}</h3>
            <p className="text-[15px] text-slate-700 dark:text-slate-300">{r.objetivo}</p>
            <ol className="mt-2 space-y-2">
              {r.perguntas.map((p, i) => (
                <li key={i} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <div className="text-xs font-semibold text-slate-500 uppercase">{p.etapa}</div>
                  <div className="font-medium">“{p.pergunta}”</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Resposta esperada: {p.alvo}</div>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Cuidado: </span>
              {r.cuidado}
            </p>
          </Cartao>
        ))}
      </>
    );
  if (fase === "debates" && caso.falasMP.length)
    return (
      <Cartao className="border-dashed">
        <Rotulo>Falas prováveis da acusação e respostas</Rotulo>
        <div className="mt-2 space-y-3">
          {caso.falasMP.map((f) => (
            <div key={f.id} className="border-t border-slate-200 pt-3 first:border-0 first:pt-0 dark:border-slate-800">
              <div className="font-semibold">{f.fala}</div>
              <p className="mt-1">{f.resposta}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Como reagir:</span> {f.reacao}
              </p>
              {f.dispositivos.length > 0 && (
                <div className="mt-1">
                  <Artigos ids={f.dispositivos} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Cartao>
    );
  return null;
}

export default function Macetes() {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const filtrados = macetesOrdenados.filter(
    (m) => !termo || [m.titulo, m.pedido, m.momento, caso.macetes[m.id].aplicacao].join(" ").toLowerCase().includes(termo),
  );

  return (
    <>
      <Titulo sub="Na ordem cronológica da sessão. Cada card traz a fórmula pronta para copiar.">Macetes de plenário</Titulo>

      <Cartao className="border-indigo-300 dark:border-indigo-800">
        <Rotulo>Regra de ouro</Rotulo>
        <p className="mt-0.5 font-medium">{macetes.meta.regraDeOuro}</p>
        <Campo rotulo="Fórmula-padrão de protesto">
          <Formula texto={macetes.meta.formulaPadrao} />
        </Campo>
        <Campo rotulo="“Pela ordem” ou aparte?">{macetes.meta.pelaOrdemOuAparte}</Campo>
      </Cartao>

      <nav className="mt-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Fases da sessão">
        {fasesOrdenadas.map((f) => (
          <a key={f.id} href={`#/macetes`} onClick={(e) => { e.preventDefault(); document.getElementById(`fase-${f.id}`)?.scrollIntoView(); }}
            className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm whitespace-nowrap dark:border-slate-700 dark:bg-slate-900">
            {f.ordem}. {f.titulo}
          </a>
        ))}
      </nav>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar macete (ex.: algemas, ata, quesito)"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />

      {fasesOrdenadas.map((f) => {
        const lista = filtrados.filter((m) => m.fase === f.id);
        if (!lista.length) return null;
        return (
          <section key={f.id} id={`fase-${f.id}`} className="scroll-mt-16">
            <Subtitulo>
              {f.ordem}. {f.titulo}
            </Subtitulo>
            <p className="-mt-2 mb-3 text-[15px] text-slate-600 dark:text-slate-400">{f.descricao}</p>
            <div className={cx("space-y-3")}>
              {lista.map((m) => (
                <CardMacete key={m.id} m={m} n={macetesOrdenados.indexOf(m) + 1} />
              ))}
              {!termo && <ExtrasDaFase fase={f.id} />}
            </div>
          </section>
        );
      })}
      {!filtrados.length && <p className="mt-6 text-slate-500">Nenhum macete encontrado.</p>}
    </>
  );
}
