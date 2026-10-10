"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/app", rotulo: "Início", icone: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  { href: "/app/checar", rotulo: "Checar", icone: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  { href: "/app/gerar", rotulo: "Gerar", icone: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" },
  { href: "/app/historico", rotulo: "Histórico", icone: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  { href: "/app/conta", rotulo: "Conta", icone: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

function ativo(caminho: string, href: string) {
  return href === "/app" ? caminho === "/app" : caminho.startsWith(href);
}

export function NavInferior() {
  const caminho = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITENS.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                ativo(caminho, i.href) ? "text-marca" : "text-stone-500"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={i.icone} />
              </svg>
              {i.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function NavSuperior({ admin }: { admin: boolean }) {
  const caminho = usePathname();
  const itens = [...ITENS, { href: "/app/auditoria", rotulo: "Auditoria", icone: "" }, { href: "/app/planos", rotulo: "Planos", icone: "" }];
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {itens.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            ativo(caminho, i.href) ? "bg-stone-100 text-marca" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {i.rotulo}
        </Link>
      ))}
      {admin && (
        <Link href="/admin/regras" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900">
          Admin
        </Link>
      )}
    </nav>
  );
}
