import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/sessao";
import type { Regra } from "@/lib/tipos";
import { FormRegra } from "../FormRegra";

export const metadata: Metadata = { title: "Editar regra" };

export default async function EditarRegra({ params }: PageProps<"/admin/regras/[id]">) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();
  const { data } = await supabase.from("regras").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/regras" className="link text-sm">Voltar</Link>
      <h1 className="text-2xl font-bold text-marca">Editar regra</h1>
      <FormRegra regra={data as Regra} />
    </div>
  );
}
