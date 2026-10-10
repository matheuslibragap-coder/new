import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NOME_PRODUTO } from "@/lib/textos";

export const metadata: Metadata = {
  title: { default: NOME_PRODUTO, template: `%s | ${NOME_PRODUTO}` },
  description: "Gestão simples para advogados autônomos e pequenos escritórios.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
