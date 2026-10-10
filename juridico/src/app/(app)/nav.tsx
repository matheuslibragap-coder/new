"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; rotulo: string; icone: string };

function ativo(caminho: string, href: string) {
  return caminho === href || (href !== "/painel" && caminho.startsWith(href + "/")) || caminho === href;
}

export function NavLateral({ itens }: { itens: ItemNav[] }) {
  const caminho = usePathname();
  return (
    <nav className="space-y-0.5">
      {itens.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${ativo(caminho, i.href) ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
        >
          <span aria-hidden className="w-5 text-center">
            {i.icone}
          </span>
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}

export function NavInferior({ itens }: { itens: ItemNav[] }) {
  const caminho = usePathname();
  return (
    <nav className="nao-imprimir fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {itens.map((i) => (
        <Link key={i.href} href={i.href} className={`flex flex-col items-center py-2 text-[11px] ${ativo(caminho, i.href) ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
          <span aria-hidden className="text-lg leading-none">
            {i.icone}
          </span>
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}
