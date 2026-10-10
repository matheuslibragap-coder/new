import { NextResponse } from "next/server";
import { usuarioDaApi } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cancelarAssinaturaAsaas } from "@/lib/asaas";

/** Exclui a conta e todos os dados do usuário (LGPD). */
export async function DELETE() {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user } = sessao;
  const admin = criarClienteAdmin();

  // 1. Cancela a assinatura para não haver novas cobranças
  const { data: conta } = await admin
    .from("contas")
    .select("asaas_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (conta?.asaas_subscription_id) {
    try {
      await cancelarAssinaturaAsaas(conta.asaas_subscription_id);
    } catch (erro) {
      console.error("[conta] falha ao cancelar assinatura", erro);
      return NextResponse.json(
        { erro: "Não foi possível cancelar sua assinatura agora. Tente novamente em instantes." },
        { status: 502 },
      );
    }
  }

  // 2. Apaga as imagens enviadas
  const pasta = user.id;
  for (;;) {
    const { data: arquivos, error } = await admin.storage.from("conteudos").list(pasta, { limit: 100 });
    if (error || !arquivos || arquivos.length === 0) break;
    await admin.storage.from("conteudos").remove(arquivos.map((a) => `${pasta}/${a.name}`));
    if (arquivos.length < 100) break;
  }

  // 3. Apaga o usuário. As tabelas usam ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[conta] falha ao excluir usuário", error.message);
    return NextResponse.json({ erro: "Não foi possível excluir a conta. Tente novamente." }, { status: 500 });
  }
  await supabase.auth.signOut().catch(() => undefined);
  return NextResponse.json({ ok: true });
}
