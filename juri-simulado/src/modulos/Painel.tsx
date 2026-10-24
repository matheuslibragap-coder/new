import { caso, macetes } from "../data";
import { Artigos, Campo, Cartao, Etiqueta, Rotulo, Subtitulo, Titulo } from "../ui/comum";

export default function Painel() {
  const p = caso.painel;
  const pendentes = macetes.dispositivos.filter((d) => d.status !== "confirmado").length;
  return (
    <>
      <Titulo sub={caso.meta.premissa}>{caso.meta.titulo}</Titulo>

      <div className="grid gap-3 sm:grid-cols-2">
        <Cartao>
          <Rotulo>Processo</Rotulo>
          <div className="mt-0.5 font-mono text-[15px] break-all">{p.processo}</div>
          <Campo rotulo="Vara">{p.vara}</Campo>
          <Campo rotulo="Fase simulada">
            <Etiqueta tom="azul">{p.faseSimulada}</Etiqueta>
          </Campo>
        </Cartao>
        <Cartao>
          <Rotulo>Imputação atual</Rotulo>
          <p className="mt-0.5">{p.imputacaoAtual.texto}</p>
          <div className="mt-2">
            <Artigos ids={p.imputacaoAtual.dispositivos} />
          </div>
          <Campo rotulo="Local">{p.local}</Campo>
        </Cartao>
      </div>

      <Subtitulo>O caso em cinco linhas</Subtitulo>
      <Cartao>
        <ol className="list-decimal space-y-2 pl-5">
          {p.resumo.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      </Cartao>

      <Subtitulo>Partes e testemunhas</Subtitulo>
      <div className="grid gap-3 sm:grid-cols-2">
        {p.pessoas.map((x) => (
          <Cartao key={x.nome}>
            <Rotulo>{x.papel}</Rotulo>
            <div className="mt-0.5 font-semibold">
              {x.nome}
              {x.alcunha && <span className="font-normal text-slate-600 dark:text-slate-400"> · “{x.alcunha}”</span>}
              {x.idade && <span className="font-normal text-slate-600 dark:text-slate-400"> · {x.idade}</span>}
            </div>
            <p className="mt-1 text-[15px]">{x.descricao}</p>
          </Cartao>
        ))}
      </div>

      <Subtitulo>O princípio antes da tese</Subtitulo>
      <Cartao className="border-indigo-300 dark:border-indigo-800">
        <p>{caso.principio}</p>
        <p className="mt-3 text-[15px] text-slate-700 dark:text-slate-300">{caso.recomendacao}</p>
      </Cartao>

      <Subtitulo>Sobre as fontes</Subtitulo>
      <Cartao>
        <p className="text-[15px]">{caso.meta.avisoFontes}</p>
        <p className="mt-2 text-[15px]">
          <Etiqueta tom="ambar">VERIFICAR</Etiqueta> {pendentes} de {macetes.dispositivos.length} dispositivos legais ainda não foram
          conferidos no texto oficial. Toque em qualquer artigo para ver o resumo, o status e o link oficial.
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Fonte dos fatos: {caso.meta.fonte}</p>
      </Cartao>
    </>
  );
}
