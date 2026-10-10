"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExcluirConta() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function excluir() {
    if (!confirm("Excluir sua conta e todos os seus dados? Esta ação não pode ser desfeita.")) return;
    setCarregando(true);
    setErro("");
    const resp = await fetch("/api/conta", { method: "DELETE" });
    if (resp.ok) {
      router.replace("/?conta=excluida");
      router.refresh();
      return;
    }
    const dados = await resp.json().catch(() => ({}));
    setErro(dados.erro ?? "Não foi possível excluir a conta.");
    setCarregando(false);
  }

  return (
    <div className="space-y-2">
      <button onClick={excluir} className="btn-perigo w-full sm:w-auto" disabled={carregando}>
        {carregando ? "Excluindo..." : "Excluir minha conta e meus dados"}
      </button>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}
