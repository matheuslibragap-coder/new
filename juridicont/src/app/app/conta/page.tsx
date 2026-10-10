import type { Metadata } from "next";
import Link from "next/link";
import { exigirUsuarioPronto } from "@/lib/sessao";
import { FormPerfil } from "@/components/FormPerfil";
import { ExcluirConta } from "./ExcluirConta";

export const metadata: Metadata = { title: "Conta" };

export default async function PaginaConta() {
  const { perfil, user } = await exigirUsuarioPronto();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marca">Conta</h1>
        <p className="text-stone-600">{user.email}</p>
      </div>

      <nav className="grid grid-cols-2 gap-2 md:hidden">
        <Link href="/app/auditoria" className="btn-secundario text-sm">Auditoria</Link>
        <Link href="/app/planos" className="btn-secundario text-sm">Planos</Link>
        {perfil.papel === "admin" && (
          <Link href="/admin/regras" className="btn-secundario col-span-2 text-sm">Painel administrativo</Link>
        )}
      </nav>

      <section className="cartao">
        <h2 className="mb-4 font-semibold">Perfil profissional</h2>
        <FormPerfil perfil={perfil} origem="conta" />
      </section>

      <form action="/sair" method="post">
        <button className="btn-secundario w-full">Sair</button>
      </form>

      <section className="cartao space-y-3 border-red-200">
        <h2 className="font-semibold text-red-800">Excluir conta</h2>
        <p className="text-sm text-stone-600">
          Apaga definitivamente seu perfil, histórico de checagens, imagens enviadas, posts gerados e auditorias, e
          cancela a assinatura. Esta ação não pode ser desfeita. Se quiser guardar registros, exporte os PDFs antes.
        </p>
        <ExcluirConta />
      </section>
    </div>
  );
}
