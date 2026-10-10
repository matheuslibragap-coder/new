"use client";
import { useEffect } from "react";
import { marcarAndamentosVistos } from "../acoes";

export function MarcarVistos({ processoId, haNovos }: { processoId: string; haNovos: boolean }) {
  useEffect(() => {
    if (haNovos) void marcarAndamentosVistos(processoId);
  }, [processoId, haNovos]);
  return null;
}
