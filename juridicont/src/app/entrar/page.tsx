import { Suspense } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Rodape } from "@/components/Rodape";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function Entrar() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-md px-4 py-4">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-marca">Entrar ou criar conta</h1>
        <p className="mb-6 text-stone-600">Use seu e-mail ou sua conta Google.</p>
        <Suspense>
          <FormEntrar />
        </Suspense>
      </main>
      <Rodape />
    </div>
  );
}
