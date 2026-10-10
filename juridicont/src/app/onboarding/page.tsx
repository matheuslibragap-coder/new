import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/sessao";
import { Logo } from "@/components/Logo";
import { FormPerfil } from "@/components/FormPerfil";

export const metadata: Metadata = { title: "Seu perfil profissional" };

export default async function Onboarding() {
  const { perfil } = await exigirUsuario();
  if (perfil.onboarding_concluido) redirect("/app");
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-md px-4 py-4">
        <Logo href="/app" />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-10">
        <h1 className="mb-1 text-2xl font-bold text-marca">Seu perfil profissional</h1>
        <p className="mb-6 text-stone-600">Usamos estes dados para gerar posts informativos no seu tom e na sua área.</p>
        <FormPerfil perfil={perfil} origem="onboarding" />
      </main>
    </div>
  );
}
