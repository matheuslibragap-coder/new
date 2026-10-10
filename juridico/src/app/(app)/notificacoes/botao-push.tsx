"use client";
import { useState } from "react";
import { classeBotao } from "@/components/ui";

function chaveParaUint8(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...b].map((c) => c.charCodeAt(0)));
}

export function BotaoPush({ chavePublica }: { chavePublica: string }) {
  const [estado, setEstado] = useState<string | null>(null);
  if (!chavePublica) return <p className="text-xs text-slate-500">Notificações push ainda não configuradas neste ambiente.</p>;
  return (
    <div>
      <button
        type="button"
        className={classeBotao("secundario")}
        onClick={async () => {
          try {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
              setEstado("Este navegador não suporta notificações push. No iPhone, adicione o site à tela de início primeiro.");
              return;
            }
            const permissao = await Notification.requestPermission();
            if (permissao !== "granted") {
              setEstado("Permissão negada no navegador.");
              return;
            }
            const reg = await navigator.serviceWorker.register("/sw.js");
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaUint8(chavePublica) });
            const resp = await fetch("/api/push/inscrever", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
            setEstado(resp.ok ? "Notificações ativadas neste aparelho." : "Não foi possível ativar.");
          } catch {
            setEstado("Não foi possível ativar as notificações.");
          }
        }}
      >
        Ativar notificações
      </button>
      {estado && <p className="mt-2 text-sm text-slate-600">{estado}</p>}
    </div>
  );
}
