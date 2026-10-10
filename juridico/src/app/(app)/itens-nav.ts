import type { ItemNav } from "./nav";

export function itensNavegacao(opcoes: { financeiro: boolean; admin: boolean }): ItemNav[] {
  const itens: ItemNav[] = [
    { href: "/painel", rotulo: "Painel", icone: "◧" },
    { href: "/processos", rotulo: "Processos", icone: "⚖" },
    { href: "/clientes", rotulo: "Clientes", icone: "☺" },
    { href: "/prazos", rotulo: "Prazos", icone: "⏱" },
    { href: "/agenda", rotulo: "Agenda", icone: "▦" },
    { href: "/mensagens", rotulo: "Mensagens", icone: "✉" },
    { href: "/calculadoras", rotulo: "Calculadoras", icone: "∑" },
  ];
  if (opcoes.financeiro) itens.push({ href: "/financeiro", rotulo: "Financeiro", icone: "$" });
  itens.push(
    { href: "/documentos", rotulo: "Contratos e procurações", icone: "✎" },
    { href: "/modelos-ia", rotulo: "Banco de modelos", icone: "❏" },
    { href: "/verificador", rotulo: "Verificador de petição", icone: "✓" },
    { href: "/intimacoes", rotulo: "Intimações", icone: "⚑" },
    { href: "/configuracoes", rotulo: "Configurações", icone: "⚙" },
  );
  if (opcoes.admin) itens.push({ href: "/admin", rotulo: "Admin da plataforma", icone: "★" });
  return itens;
}

export const ITENS_INFERIORES: ItemNav[] = [
  { href: "/painel", rotulo: "Painel", icone: "◧" },
  { href: "/processos", rotulo: "Processos", icone: "⚖" },
  { href: "/prazos", rotulo: "Prazos", icone: "⏱" },
  { href: "/agenda", rotulo: "Agenda", icone: "▦" },
  { href: "/menu", rotulo: "Mais", icone: "☰" },
];
