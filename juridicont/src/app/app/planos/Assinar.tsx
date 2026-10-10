"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Assinar({ plano, nomePlano, nomeSugerido }: { plano: "essencial" | "pro"; nomePlano: string; nomeSugerido: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(nomeSugerido);
  const [documento, setDocumento] = useState("");
  const [forma, setForma] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resp = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano, forma, nome, documento }),
      });
      const dados = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setErro(dados.erro ?? "Não foi possível iniciar a assinatura.");
        return;
      }
      if (dados.link) window.location.href = dados.link;
      else router.push("/app/planos?retorno=1");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  if (!aberto) {
    return (
      <button className="btn-primario w-full" onClick={() => setAberto(true)}>
        Assinar {nomePlano}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3 border-t border-stone-100 pt-3">
      <div>
        <label className="rotulo" htmlFor={`nome-${plano}`}>Nome completo ou razão social</label>
        <input id={`nome-${plano}`} className="campo" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={3} />
      </div>
      <div>
        <label className="rotulo" htmlFor={`doc-${plano}`}>CPF ou CNPJ</label>
        <input
          id={`doc-${plano}`}
          className="campo"
          inputMode="numeric"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          required
          placeholder="Somente números"
        />
        <p className="mt-1 text-xs text-stone-500">Exigido para a emissão da cobrança.</p>
      </div>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="rotulo">Forma de pagamento</legend>
        {(
          [
            ["PIX", "Pix"],
            ["CREDIT_CARD", "Cartão"],
          ] as const
        ).map(([v, r]) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name={`forma-${plano}`} className="peer sr-only" checked={forma === v} onChange={() => setForma(v)} />
            <span className="block rounded-xl border border-stone-300 py-3 text-center text-sm font-medium peer-checked:border-marca peer-checked:bg-marca peer-checked:text-white">
              {r}
            </span>
          </label>
        ))}
      </fieldset>
      {erro && <p className="erro">{erro}</p>}
      <button type="submit" className="btn-primario w-full" disabled={carregando}>
        {carregando ? "Abrindo pagamento..." : "Ir para o pagamento"}
      </button>
      <p className="text-xs text-stone-500">Você será levado à página segura do Asaas para concluir o pagamento.</p>
    </form>
  );
}

export function CancelarAssinatura() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  async function cancelar() {
    if (!confirm("Cancelar a assinatura? Você mantém o plano até o fim do ciclo atual.")) return;
    setCarregando(true);
    setErro("");
    const resp = await fetch("/api/assinatura", { method: "DELETE" });
    setCarregando(false);
    if (!resp.ok) {
      const dados = await resp.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível cancelar.");
      return;
    }
    router.refresh();
  }
  return (
    <div className="space-y-2">
      <button onClick={cancelar} className="btn-secundario w-full sm:w-auto" disabled={carregando}>
        {carregando ? "Cancelando..." : "Cancelar assinatura"}
      </button>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}
