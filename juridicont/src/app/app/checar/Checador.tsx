"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ResultadoView } from "@/components/ResultadoView";
import { prepararImagem } from "@/lib/imagem-cliente";
import { TIPOS_CONTEUDO, type RegraSnapshot, type ResultadoChecagem, type TipoConteudo } from "@/lib/tipos";

type Resposta = { id: string; resultado: ResultadoChecagem; regras: RegraSnapshot[] };

export function Checador({ permiteAnuncio }: { permiteAnuncio: boolean }) {
  const [tipo, setTipo] = useState<TipoConteudo>("legenda");
  const [texto, setTexto] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<{ msg: string; planos?: boolean } | null>(null);
  const [resposta, setResposta] = useState<(Resposta & { texto: string; previa: string | null }) | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  async function escolherImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!["image/jpeg", "image/png"].includes(arquivo.type)) {
      setErro({ msg: "Envie uma imagem JPG ou PNG." });
      return;
    }
    setErro(null);
    const pronta = await prepararImagem(arquivo);
    setImagem(pronta);
    setPrevia(URL.createObjectURL(pronta));
  }

  function removerImagem() {
    setImagem(null);
    setPrevia(null);
    if (inputArquivo.current) inputArquivo.current.value = "";
  }

  async function checar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!texto.trim() && !imagem) {
      setErro({ msg: "Cole um texto ou envie uma imagem." });
      return;
    }
    setCarregando(true);
    try {
      const form = new FormData();
      form.set("tipo", tipo);
      form.set("texto", texto);
      if (imagem) form.set("imagem", imagem);
      const resp = await fetch("/api/checar", { method: "POST", body: form });
      const dados = await resp.json().catch(() => ({ erro: "Resposta inválida do servidor." }));
      if (!resp.ok) {
        setErro({ msg: dados.erro ?? "Não foi possível checar agora.", planos: resp.status === 402 || resp.status === 403 });
        return;
      }
      setResposta({ ...(dados as Resposta), texto, previa });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErro({ msg: "Falha de conexão. Tente novamente." });
    } finally {
      setCarregando(false);
    }
  }

  function novaChecagem() {
    setResposta(null);
    setTexto("");
    removerImagem();
  }

  if (resposta) {
    return (
      <div className="space-y-4">
        <ResultadoView texto={resposta.texto} resultado={resposta.resultado} regras={resposta.regras} imagemUrl={resposta.previa} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={novaChecagem} className="btn-secundario">
            Nova checagem
          </button>
          <a href={`/api/historico/${resposta.id}/pdf`} className="btn-secundario">
            Baixar registro em PDF
          </a>
          {resposta.resultado.versao_reescrita_completa && (
            <button
              onClick={() => {
                setTexto(resposta.resultado.versao_reescrita_completa ?? "");
                removerImagem();
                setResposta(null);
              }}
              className="btn-secundario"
            >
              Checar versão corrigida
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={checar} className="space-y-4">
      <div>
        <label htmlFor="tipo" className="rotulo">
          Tipo de conteúdo
        </label>
        <select id="tipo" className="campo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoConteudo)}>
          {Object.entries(TIPOS_CONTEUDO).map(([v, r]) => (
            <option key={v} value={v} disabled={v === "anuncio_pago" && !permiteAnuncio}>
              {r}
              {v === "anuncio_pago" && !permiteAnuncio ? " (plano Pro)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="texto" className="rotulo">
          Texto
        </label>
        <textarea
          id="texto"
          className="campo min-h-44"
          placeholder="Cole aqui a legenda, o roteiro, a bio ou o texto do anúncio"
          value={texto}
          maxLength={8000}
          onChange={(e) => setTexto(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-stone-400">{texto.length}/8000</p>
      </div>

      <div>
        <span className="rotulo">Imagem (opcional)</span>
        {previa ? (
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previa} alt="Prévia da imagem" className="h-28 w-28 rounded-xl border border-stone-200 object-cover" />
            <button type="button" onClick={removerImagem} className="link text-sm">
              Remover imagem
            </button>
          </div>
        ) : (
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white p-4 text-center text-sm text-stone-600 hover:border-stone-400">
            <span className="font-medium">Toque para enviar a imagem do post</span>
            <span className="text-xs text-stone-400">JPG ou PNG</span>
            <input ref={inputArquivo} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={escolherImagem} />
          </label>
        )}
      </div>

      {erro && (
        <div className="erro">
          {erro.msg}{" "}
          {erro.planos && (
            <Link href="/app/planos" className="font-semibold underline">
              Ver planos
            </Link>
          )}
        </div>
      )}

      <button type="submit" className="btn-primario w-full" disabled={carregando}>
        {carregando ? "Analisando, isso leva alguns segundos..." : "Checar conformidade"}
      </button>
      <p className="text-xs text-stone-500">
        Não inclua dados pessoais de clientes. O conteúdo fica salvo apenas no seu histórico.
      </p>
    </form>
  );
}
