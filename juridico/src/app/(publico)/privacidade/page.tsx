export const metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <article className="space-y-3 text-sm text-slate-700">
      <h1 className="text-xl font-semibold text-slate-900">Política de privacidade</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
        [PLACEHOLDER] Texto a ser preenchido pelo controlador. Recomenda-se incluir, nos termos da LGPD (Lei 13.709/2018): controlador e encarregado,
        dados tratados (cadastro do escritório, clientes, processos, documentos), finalidades e bases legais, compartilhamento com operadores
        (hospedagem, banco de dados, e-mail, pagamentos, assinatura eletrônica, provedor de IA), transferência internacional, prazo de retenção,
        direitos dos titulares, exportação e exclusão de dados com um clique, registros de acesso e medidas de segurança. Informar que os documentos
        enviados ao banco de modelos não são usados para treinar modelos nem compartilhados entre escritórios.
      </p>
    </article>
  );
}
