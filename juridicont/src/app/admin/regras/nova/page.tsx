import Link from "next/link";
import type { Metadata } from "next";
import { FormRegra } from "../FormRegra";

export const metadata: Metadata = { title: "Nova regra" };

export default function NovaRegra() {
  return (
    <div className="space-y-4">
      <Link href="/admin/regras" className="link text-sm">Voltar</Link>
      <h1 className="text-2xl font-bold text-marca">Nova regra</h1>
      <FormRegra />
    </div>
  );
}
