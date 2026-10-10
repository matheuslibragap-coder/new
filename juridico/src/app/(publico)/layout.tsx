import Link from "next/link";
import { NOME_PRODUTO } from "@/lib/textos";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-slate-900">
            {NOME_PRODUTO}
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/entrar" className="text-slate-700 hover:text-slate-900">
              Entrar
            </Link>
            <Link href="/cadastro" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-4 py-4 text-xs text-slate-500">
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Política de privacidade</Link>
          <span>A plataforma auxilia; não decide. A responsabilidade profissional é do(a) advogado(a).</span>
        </div>
      </footer>
    </div>
  );
}
