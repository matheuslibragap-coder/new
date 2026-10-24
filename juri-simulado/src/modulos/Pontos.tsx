import { caso } from "../data";
import { Artigos, Campo, Cartao, Etiqueta, Titulo } from "../ui/comum";

const ORDEM = { alto: 0, medio: 1, baixo: 2 };

export default function Pontos() {
  const pontos = [...caso.pontosAtencao].sort((a, b) => ORDEM[a.gravidade] - ORDEM[b.gravidade]);
  return (
    <>
      <Titulo sub="Riscos que podem derrubar a defesa: o que é, por que acontece e como neutralizar.">Pontos de atenção</Titulo>
      <div className="space-y-3">
        {pontos.map((p, i) => (
          <Cartao key={p.id} className={p.gravidade === "alto" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-400"}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">{i + 1}.</span>
              <h2 className="text-lg font-semibold">{p.titulo}</h2>
              <Etiqueta tom={p.gravidade === "alto" ? "vermelho" : "ambar"}>{p.gravidade === "alto" ? "Risco alto" : "Risco médio"}</Etiqueta>
            </div>
            <Campo rotulo="Risco">{p.risco}</Campo>
            <Campo rotulo="Por quê">{p.motivo}</Campo>
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
              <div className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">Como neutralizar</div>
              <p className="mt-0.5">{p.neutralizar}</p>
            </div>
            {p.dispositivos.length > 0 && (
              <div className="mt-3">
                <Artigos ids={p.dispositivos} />
              </div>
            )}
          </Cartao>
        ))}
      </div>
    </>
  );
}
