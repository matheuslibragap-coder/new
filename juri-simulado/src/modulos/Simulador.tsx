import { useMemo, useState } from "react";
import { caso } from "../data";
import { apurar, ordemDosQuesitos, type Posicao, type Voto } from "../lib/quesitacao";
import { Artigos, Campo, Cartao, Etiqueta, Filtro, Rotulo, Subtitulo, Titulo, cx } from "../ui/comum";

const Q = caso.quesitacao;
const vazio = (): Voto[] => Array(Q.jurados).fill(null);
const inicial = () => Object.fromEntries(Q.quesitos.map((q) => [q.id, vazio()])) as Record<string, Voto[]>;
const proximo = (v: Voto): Voto => (v === null ? "sim" : v === "sim" ? "nao" : null);

export default function Simulador() {
  const [posicao, setPosicao] = useState<Posicao>(Q.posicaoDesclassificacao.padrao);
  const [votos, setVotos] = useState(inicial);

  const ordem = useMemo(() => ordemDosQuesitos(Q, posicao), [posicao]);
  const r = useMemo(() => apurar(Q, posicao, votos), [posicao, votos]);
  const apuracao = new Map(r.etapas.map((e) => [e.quesito.id, e]));
  const prejudicados = new Set(r.prejudicados.map((q) => q.id));
  const res = r.resultado ? Q.resultados[r.resultado] : null;

  const mudar = (qid: string, f: (l: Voto[]) => Voto[]) => setVotos((v) => ({ ...v, [qid]: f(v[qid]) }));

  return (
    <>
      <Titulo sub={Q.aviso}>Simulador de quesitação</Titulo>

      <Cartao>
        <Rotulo>Regras aplicadas</Rotulo>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px]">
          {Q.regras.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div className="mt-4">
          <Filtro
            rotulo="Quesito de desclassificação (excesso culposo)"
            valor={posicao}
            aoMudar={setPosicao}
            opcoes={[
              { valor: "apos-iii", texto: "Após o III" },
              { valor: "apos-ii", texto: "Após o II" },
              { valor: "nenhuma", texto: "Não incluir" },
            ]}
          />
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{Q.posicaoDesclassificacao.nota}</p>
        </div>
        <button onClick={() => setVotos(inicial())} className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-700">
          Limpar todos os votos
        </button>
      </Cartao>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Toque em cada jurado para alternar entre vazio, SIM e NÃO. As cédulas são abertas na ordem e a contagem para ao atingir {Q.maioria} votos.
      </p>

      <div className="mt-3 space-y-3">
        {ordem.map((q, i) => {
          const a = apuracao.get(q.id);
          const prej = prejudicados.has(q.id);
          const lista = votos[q.id];
          return (
            <Cartao key={q.id} className={cx(prej && "opacity-50")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">{i + 1}º</span>
                <h2 className="font-semibold">{q.rotulo}</h2>
                {a?.decisao === "sim" && <Etiqueta tom="verde">SIM por maioria</Etiqueta>}
                {a?.decisao === "nao" && <Etiqueta tom="vermelho">NÃO por maioria</Etiqueta>}
                {prej && <Etiqueta tom="cinza">Prejudicado: votação encerrada</Etiqueta>}
              </div>
              <p className="mt-1 font-serif">{q.texto}</p>
              {q.nota && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{q.nota}</p>}

              <fieldset disabled={prej} className="mt-3">
                <legend className="sr-only">Votos dos jurados</legend>
                <div className="grid grid-cols-7 gap-1">
                  {lista.map((v, j) => {
                    const naoRevelado = a && a.decisao !== "incompleto" && j >= a.apuradas;
                    return (
                      <button
                        key={j}
                        onClick={() => mudar(q.id, (l) => l.map((x, k) => (k === j ? proximo(x) : x)))}
                        aria-label={`Jurado ${j + 1}: ${v ?? "sem voto"}`}
                        className={cx(
                          "flex h-12 flex-col items-center justify-center rounded-lg border text-xs font-bold",
                          v === "sim" && "border-emerald-600 bg-emerald-600 text-white",
                          v === "nao" && "border-rose-600 bg-rose-600 text-white",
                          v === null && "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800",
                          naoRevelado && "opacity-40",
                        )}
                      >
                        <span className="font-normal">J{j + 1}</span>
                        {v === "sim" ? "SIM" : v === "nao" ? "NÃO" : "—"}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button onClick={() => mudar(q.id, () => Array(Q.jurados).fill("sim"))} className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700">
                    Todos SIM
                  </button>
                  <button onClick={() => mudar(q.id, () => Array(Q.jurados).fill("nao"))} className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700">
                    Todos NÃO
                  </button>
                  <button onClick={() => mudar(q.id, vazio)} className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700">
                    Limpar
                  </button>
                </div>
              </fieldset>
              {a && (
                <p className="mt-2 text-sm tabular-nums">
                  Cédulas abertas: {a.apuradas} · SIM {a.sim} · NÃO {a.nao}
                  {a.decisao !== "incompleto" && a.apuradas < Q.jurados && ` · ${Q.jurados - a.apuradas} não reveladas`}
                </p>
              )}
              <div className="mt-2">
                <Artigos ids={q.dispositivos} />
              </div>
            </Cartao>
          );
        })}
      </div>

      <Subtitulo>Resultado</Subtitulo>
      <Cartao className={cx("border-2", res ? (r.resultado === "absolvicao" ? "border-emerald-500" : "border-indigo-500") : "border-dashed")}>
        {res ? (
          <>
            <div className="text-xl font-semibold">{res.rotulo}</div>
            <p className="mt-1">{r.motivo}</p>
            <Campo rotulo="Capitulação">{res.capitulacao}</Campo>
            <Campo rotulo="Pena abstrata (sem dosimetria)">
              <span className="font-semibold">{res.penaAbstrata}</span>
            </Campo>
            {res.nota && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{res.nota}</p>}
            <div className="mt-3">
              <Artigos ids={res.dispositivos} />
            </div>
          </>
        ) : (
          <p>{r.motivo}</p>
        )}
      </Cartao>

      <Subtitulo>Faixas de pena de cada resultado</Subtitulo>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(Q.resultados).map(([k, x]) => (
          <Cartao key={k} className={cx(r.resultado === k && "border-indigo-500 dark:border-indigo-500")}>
            <div className="font-semibold">{x.rotulo}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{x.capitulacao}</div>
            <div className="mt-1">{x.penaAbstrata}</div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
