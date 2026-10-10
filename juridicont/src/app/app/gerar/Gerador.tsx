"use client";

import { useState } from "react";
import Link from "next/link";
import { PostView } from "@/components/PostView";
import { AvisoLegal } from "@/components/Aviso";
import { Semaforo } from "@/components/Semaforo";
import type { PostGerado } from "@/lib/ia/gerador";
import { FORMATOS_POST, type FormatoPost } from "@/lib/tipos";

export function Gerador({ areas, permiteReels, bloqueado }: { areas: string[]; permiteReels: boolean; bloqueado: boolean }) {
  const [area, setArea] = useState(areas[0] ?? "");
  const [formato, setFormato] = useState<FormatoPost>("carrossel");
  const [tema, setTema] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<{ msg: string; planos?: boolean } | null>(null);
  const [post, setPost] = useState<{ post: PostGerado; checagem_id: string | null } | null>(null);

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resp = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, formato, tema }),
      });
      const dados = await resp.json().catch(() => ({ erro: "Resposta inválida do servidor." }));
      if (!resp.ok) {
        setErro({ msg: dados.erro ?? "Não foi possível gerar agora.", planos: resp.status === 402 || resp.status === 403 });
        return;
      }
      setPost({ post: dados.post, checagem_id: dados.checagem_id });
    } catch {
      setErro({ msg: "Falha de conexão. Tente novamente." });
    } finally {
      setCarregando(false);
    }
  }

  if (bloqueado) {
    return (
      <div className="cartao space-y-3">
        <p className="text-stone-600">Assine o plano Essencial ou Pro para gerar posts informativos já checados.</p>
        <Link href="/app/planos" className="btn-primario w-full sm:w-auto">
          Ver planos
        </Link>
      </div>
    );
  }

  if (post) {
    return (
      <div className="space-y-4">
        <Semaforo valor="verde" />
        <PostView post={post.post} />
        <AvisoLegal />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => setPost(null)} className="btn-secundario">
            Gerar outro
          </button>
          {post.checagem_id && (
            <a href={`/api/historico/${post.checagem_id}/pdf`} className="btn-secundario">
              Baixar registro da checagem
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={gerar} className="space-y-4">
      <div>
        <label htmlFor="area" className="rotulo">Área</label>
        <select id="area" className="campo" value={area} onChange={(e) => setArea(e.target.value)} required>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="rotulo">Formato</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FORMATOS_POST) as FormatoPost[]).map((f) => {
            const desabilitado = f === "reels" && !permiteReels;
            return (
              <label key={f} className={desabilitado ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <input
                  type="radio"
                  name="formato"
                  value={f}
                  checked={formato === f}
                  disabled={desabilitado}
                  onChange={() => setFormato(f)}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-stone-300 bg-white px-2 py-3 text-center text-sm font-medium peer-checked:border-marca peer-checked:bg-marca peer-checked:text-white">
                  {FORMATOS_POST[f]}
                  {desabilitado && <span className="block text-[11px] font-normal">plano Pro</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="tema" className="rotulo">Tema (opcional)</label>
        <input
          id="tema"
          className="campo"
          maxLength={300}
          placeholder="Ex.: o que fazer quando o voo é cancelado"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-500">Se deixar em branco, escolhemos uma dúvida comum da área.</p>
      </div>

      {erro && (
        <div className="erro">
          {erro.msg}{" "}
          {erro.planos && <Link href="/app/planos" className="font-semibold underline">Ver planos</Link>}
        </div>
      )}

      <button type="submit" className="btn-primario w-full" disabled={carregando || !area}>
        {carregando ? "Gerando e checando, pode levar até um minuto..." : "Gerar post"}
      </button>
      <p className="text-xs text-stone-500">
        Todo post passa pelo checador antes de aparecer aqui. Só entregamos posts sem riscos identificados pela base de regras.
      </p>
    </form>
  );
}
