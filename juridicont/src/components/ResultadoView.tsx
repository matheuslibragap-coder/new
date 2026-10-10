import type { RegraSnapshot, ResultadoChecagem, Severidade } from "@/lib/tipos";
import { segmentarTexto } from "@/lib/ia/validacao";
import { CODIGO_NAO_CATALOGADO } from "@/lib/textos";
import { Semaforo } from "@/components/Semaforo";
import { AvisoLegal } from "@/components/Aviso";
import { BotaoCopiar } from "@/components/BotaoCopiar";

const MARCA: Record<Severidade, string> = {
  vermelho: "bg-red-100 text-red-900 decoration-red-500",
  amarelo: "bg-amber-100 text-amber-900 decoration-amber-500",
  verde: "bg-green-100 text-green-900",
};

const BORDA: Record<Severidade, string> = {
  vermelho: "border-l-red-500",
  amarelo: "border-l-amber-400",
  verde: "border-l-green-500",
};

export function ResultadoView({
  texto,
  resultado,
  regras,
  imagemUrl,
}: {
  texto: string;
  resultado: ResultadoChecagem;
  regras: RegraSnapshot[];
  imagemUrl?: string | null;
}) {
  const porCodigo = new Map(regras.map((r) => [r.codigo, r]));
  const segmentos = segmentarTexto(texto, resultado.achados);

  return (
    <div className="space-y-4">
      <Semaforo valor={resultado.classificacao_geral} />

      {texto.trim() && (
        <section className="cartao">
          <h2 className="mb-2 text-sm font-semibold text-stone-500">Conteúdo analisado</h2>
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {segmentos.map((s, i) =>
              s.severidade ? (
                <mark key={i} className={`rounded px-0.5 underline decoration-2 ${MARCA[s.severidade]}`}>
                  {s.texto}
                </mark>
              ) : (
                <span key={i}>{s.texto}</span>
              ),
            )}
          </p>
        </section>
      )}

      {(imagemUrl || resultado.texto_extraido_imagem || resultado.elementos_visuais?.length) && (
        <section className="cartao space-y-3">
          <h2 className="text-sm font-semibold text-stone-500">Imagem</h2>
          {imagemUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagemUrl} alt="Imagem enviada" className="max-h-80 rounded-xl border border-stone-200" />
          )}
          {resultado.texto_extraido_imagem && (
            <div>
              <p className="text-xs font-semibold uppercase text-stone-500">Texto lido na imagem</p>
              <p className="whitespace-pre-wrap text-sm">{resultado.texto_extraido_imagem}</p>
            </div>
          )}
          {!!resultado.elementos_visuais?.length && (
            <div>
              <p className="text-xs font-semibold uppercase text-stone-500">Elementos visuais observados</p>
              <ul className="list-inside list-disc text-sm">
                {resultado.elementos_visuais.map((el, i) => (
                  <li key={i}>{el}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {resultado.achados.length === 0 ? "Nenhum achado" : `Achados (${resultado.achados.length})`}
        </h2>
        {resultado.achados.length === 0 && (
          <p className="text-sm text-stone-600">Sem riscos identificados pela base de regras.</p>
        )}
        {resultado.achados.map((a, i) => {
          const regra = porCodigo.get(a.regra_codigo);
          const naoCatalogado = a.regra_codigo === CODIGO_NAO_CATALOGADO;
          return (
            <article key={i} className={`cartao border-l-4 ${BORDA[a.severidade]} space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{naoCatalogado ? "Risco não catalogado" : (regra?.titulo ?? a.regra_codigo)}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${MARCA[a.severidade]}`}
                >
                  {a.severidade}
                </span>
              </div>
              {regra && <p className="text-xs text-stone-500">{regra.dispositivo}</p>}
              {a.trecho && (
                <blockquote className={`rounded-lg px-2 py-1 text-sm ${MARCA[a.severidade]}`}>“{a.trecho}”</blockquote>
              )}
              <p className="text-sm">{a.explicacao}</p>
              {a.sugestao_reescrita && (
                <div className="rounded-lg bg-stone-50 p-2 text-sm">
                  <span className="font-semibold text-stone-600">Sugestão: </span>
                  {a.sugestao_reescrita}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {resultado.versao_reescrita_completa && (
        <section className="cartao space-y-3">
          <h2 className="text-lg font-semibold">Versão corrigida</h2>
          <p className="whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-3 leading-relaxed">
            {resultado.versao_reescrita_completa}
          </p>
          <BotaoCopiar texto={resultado.versao_reescrita_completa} />
          <p className="text-xs text-stone-500">Recomendamos checar a versão corrigida novamente antes de publicar.</p>
        </section>
      )}

      <AvisoLegal />
    </div>
  );
}
