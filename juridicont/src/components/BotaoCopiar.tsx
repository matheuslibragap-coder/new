"use client";

import { useState } from "react";

export function BotaoCopiar({ texto, rotulo = "Copiar versão corrigida" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
  return (
    <button type="button" onClick={copiar} className="btn-primario w-full sm:w-auto">
      {copiado ? "Copiado" : rotulo}
    </button>
  );
}
