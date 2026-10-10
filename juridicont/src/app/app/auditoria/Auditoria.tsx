"use client";

import { useState } from "react";
import { RelatorioView } from "@/components/RelatorioView";
import type { RelatorioAuditoria } from "@/lib/auditoria";

const MAX_POSTS = 5;

export function Auditoria({ mostrarConvite }: { mostrarConvite: boolean }) {
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState<string[]>([""]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioAuditoria | null>(null);

  async function auditar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resp = await fetch("/api/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, posts: posts.map((p) => p.trim()).filter(Boolean) }),
      });
      const dados = await resp.json().catch(() => ({ erro: "Resposta inválida do servidor." }));
      if (!resp.ok) {
        setErro(dados.erro ?? "Não foi possível auditar agora.");
        return;
      }
      setRelatorio(dados.relatorio);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (relatorio) return <RelatorioView relatorio={relatorio} mostrarConvite={mostrarConvite} />;

  return (
    <form onSubmit={auditar} className="space-y-4">
      <div>
        <label htmlFor="bio" className="rotulo">Bio do Instagram</label>
        <textarea id="bio" className="campo min-h-24" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cole aqui a sua bio" />
      </div>
      {posts.map((p, i) => (
        <div key={i}>
          <div className="flex items-center justify-between">
            <label htmlFor={`post-${i}`} className="rotulo">Post {i + 1}</label>
            {posts.length > 1 && (
              <button type="button" className="text-xs text-stone-500 underline" onClick={() => setPosts(posts.filter((_, j) => j !== i))}>
                Remover
              </button>
            )}
          </div>
          <textarea
            id={`post-${i}`}
            className="campo min-h-28"
            maxLength={4000}
            value={p}
            onChange={(e) => setPosts(posts.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder="Cole a legenda ou o texto do post"
          />
        </div>
      ))}
      {posts.length < MAX_POSTS && (
        <button type="button" className="btn-secundario w-full" onClick={() => setPosts([...posts, ""])}>
          Adicionar outro post
        </button>
      )}
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primario w-full" disabled={carregando}>
        {carregando ? "Auditando, pode levar até um minuto..." : "Gerar relatório"}
      </button>
    </form>
  );
}
