"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function FormEntrar() {
  const params = useSearchParams();
  const proximo = params.get("proximo") ?? "/app";
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado">("livre");
  const [erro, setErro] = useState(params.get("erro") === "link" ? "O link expirou ou é inválido. Peça um novo." : "");

  function urlRetorno() {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${base}/auth/callback?proximo=${encodeURIComponent(proximo)}`;
  }

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEstado("enviando");
    const { error } = await criarClienteNavegador().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: urlRetorno() },
    });
    if (error) {
      setErro("Não foi possível enviar o link. Confira o e-mail e tente de novo.");
      setEstado("livre");
      return;
    }
    setEstado("enviado");
  }

  async function entrarComGoogle() {
    setErro("");
    const { error } = await criarClienteNavegador().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: urlRetorno() },
    });
    if (error) setErro("Não foi possível entrar com o Google agora.");
  }

  if (estado === "enviado") {
    return (
      <div className="cartao space-y-2">
        <h2 className="font-semibold">Confira seu e-mail</h2>
        <p className="text-stone-600">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra o link neste aparelho para entrar.
        </p>
        <button className="link text-sm" onClick={() => setEstado("livre")}>
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={entrarComGoogle} className="btn-secundario w-full">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" /> ou <span className="h-px flex-1 bg-stone-200" />
      </div>

      <form onSubmit={enviarLink} className="space-y-3">
        <div>
          <label htmlFor="email" className="rotulo">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="campo"
            placeholder="voce@exemplo.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primario w-full" disabled={estado === "enviando"}>
          {estado === "enviando" ? "Enviando..." : "Receber link de acesso"}
        </button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <p className="text-xs text-stone-500">
        Ao continuar, você concorda com os <Link href="/termos" className="underline">Termos de uso</Link> e a{" "}
        <Link href="/privacidade" className="underline">Política de privacidade</Link>.
      </p>
    </div>
  );
}
