import { exigirUsuarioPronto } from "@/lib/sessao";
import { Logo } from "@/components/Logo";
import { NavInferior, NavSuperior } from "@/components/NavApp";

export default async function LayoutApp({ children }: LayoutProps<"/app">) {
  const { perfil } = await exigirUsuarioPronto();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo href="/app" />
          <NavSuperior admin={perfil.papel === "admin"} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:pb-12">{children}</main>
      <NavInferior />
    </div>
  );
}
