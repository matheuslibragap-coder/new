import { caso } from "../data";
import { NAO_CONSTA } from "../schema/caso";
import { Cartao, Etiqueta, EtiquetaPeso, Fonte, Rotulo, Subtitulo, Titulo, cx, type Tom } from "../ui/comum";

const ORDEM_PESO = { alto: 0, medio: 1, baixo: 2 };
const porPeso = <T extends { peso: keyof typeof ORDEM_PESO }>(l: T[]) => [...l].sort((a, b) => ORDEM_PESO[a.peso] - ORDEM_PESO[b.peso]);

const CATEGORIA: Record<string, [Tom, string]> = {
  viu: ["verde", "O que ele VIU"],
  "nao-viu": ["ambar", "O que ele NÃO VIU"],
  contra: ["vermelho", "Contra o réu"],
  contexto: ["cinza", "Contexto"],
};

const FASES = [
  ["policia", "Polícia"],
  ["juizo", "Juízo"],
  ["plenario", "Plenário"],
] as const;

function Celula({ texto }: { texto: string | null }) {
  return texto ? <span>{texto}</span> : <span className="text-sm text-slate-400 italic dark:text-slate-500">{NAO_CONSTA}</span>;
}

export default function MapaProvas() {
  const t = caso.testemunhaChave;
  return (
    <>
      <Titulo sub="Ordenado por peso. Nos itens negativos, a resposta da defesa vem logo abaixo.">Mapa de provas</Titulo>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="h-3 w-3 rounded-full bg-emerald-500" /> Favorece a defesa
          </h2>
          <div className="space-y-3">
            {porPeso(caso.provas.favorece).map((p) => (
              <Cartao key={p.id} className="border-l-4 border-l-emerald-500">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <EtiquetaPeso peso={p.peso} />
                </div>
                <p className="mt-1 text-[15px]">{p.descricao}</p>
                <div className="mt-2">
                  <Fonte fonte={p.fonte} />
                </div>
              </Cartao>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="h-3 w-3 rounded-full bg-rose-500" /> Dificulta a defesa
          </h2>
          <div className="space-y-3">
            {porPeso(caso.provas.dificulta).map((p) => (
              <Cartao key={p.id} className="border-l-4 border-l-rose-500">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <EtiquetaPeso peso={p.peso} />
                </div>
                <p className="mt-1 text-[15px]">{p.descricao}</p>
                <div className="mt-2">
                  <Fonte fonte={p.fonte} />
                </div>
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
                  <Rotulo>Resposta da defesa</Rotulo>
                  <p className="mt-0.5 text-[15px]">{p.respostaDefesa}</p>
                </div>
              </Cartao>
            ))}
          </div>
        </section>
      </div>

      <Subtitulo>{t.nome}: o relato fase a fase</Subtitulo>
      <p className="-mt-1 mb-3 text-[15px] text-slate-700 dark:text-slate-300">{t.introducao}</p>

      {/* Tabela em telas largas */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block dark:border-slate-800">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-3 font-semibold">Tema</th>
              {FASES.map(([, n]) => (
                <th key={n} className="p-3 font-semibold">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.linhas.map((l) => (
              <tr key={l.id} className={cx("border-t border-slate-200 align-top dark:border-slate-800", l.cresceu && "bg-amber-50/60 dark:bg-amber-950/20")}>
                <td className="w-1/4 p-3">
                  <div className="font-semibold">{l.tema}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Etiqueta tom={CATEGORIA[l.categoria][0]}>{CATEGORIA[l.categoria][1]}</Etiqueta>
                    {l.cresceu && <Etiqueta tom="ambar">Relato cresceu</Etiqueta>}
                  </div>
                </td>
                {l.semFase ? (
                  <td colSpan={3} className="p-3">
                    {l.semFase} <span className="text-sm text-slate-500 italic">(fase do depoimento: {NAO_CONSTA})</span>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{l.nota}</p>
                  </td>
                ) : (
                  <>
                    {FASES.map(([k]) => (
                      <td key={k} className="p-3">
                        <Celula texto={l[k]} />
                      </td>
                    ))}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 border-t border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {t.linhas
            .filter((l) => !l.semFase)
            .map((l) => (
              <p key={l.id}>
                <span className="font-medium">{l.tema}:</span> {l.nota}
              </p>
            ))}
        </div>
      </div>

      {/* Cartões no celular */}
      <div className="space-y-3 md:hidden">
        {t.linhas.map((l) => (
          <Cartao key={l.id} className={cx(l.cresceu && "border-amber-400 dark:border-amber-700")}>
            <div className="font-semibold">{l.tema}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <Etiqueta tom={CATEGORIA[l.categoria][0]}>{CATEGORIA[l.categoria][1]}</Etiqueta>
              {l.cresceu && <Etiqueta tom="ambar">Relato cresceu</Etiqueta>}
            </div>
            {l.semFase ? (
              <p className="mt-2 text-[15px]">
                {l.semFase} <span className="text-sm text-slate-500 italic">(fase: {NAO_CONSTA})</span>
              </p>
            ) : (
              <dl className="mt-2 space-y-1.5 text-[15px]">
                {FASES.map(([k, n]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-slate-500 uppercase">{n}</dt>
                    <dd>
                      <Celula texto={l[k]} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{l.nota}</p>
          </Cartao>
        ))}
      </div>
    </>
  );
}
