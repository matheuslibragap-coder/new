import Link from "next/link";
import { exigirAdmin } from "@/lib/sessao";
import { Logo } from "@/components/Logo";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigirAdmin();
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logo href="/app" />
          <nav className="flex gap-3 text-sm">
            <Link href="/admin/regras" className="link">Regras</Link>
            <Link href="/app" className="link">Voltar ao app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
