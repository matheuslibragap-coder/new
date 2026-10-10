"use client";
import { useFormStatus } from "react-dom";
import { useState, type ComponentProps, type ReactNode } from "react";
import { classeBotao, type VarianteBotao } from "./ui";

/** Botão de envio com estado de carregamento. */
export function Enviar({ children, variante = "primario", pequeno, confirmar, ...props }: ComponentProps<"button"> & { variante?: VarianteBotao; pequeno?: boolean; confirmar?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
        props.onClick?.(e);
      }}
      className={`${classeBotao(variante, pequeno)} ${props.className ?? ""}`}
    >
      {pending ? "Aguarde..." : children}
    </button>
  );
}

export function Copiar({ texto, children = "Copiar" }: { texto: string; children?: ReactNode }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={classeBotao("secundario", true)}
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? "Copiado" : children}
    </button>
  );
}
