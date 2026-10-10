import { AreaTexto, Campo, Grade } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { formatarDocumento, formatarTelefone } from "@/lib/documento";
import { salvarCliente } from "./acoes";

export type ClienteForm = {
  id?: string;
  nome?: string;
  documento?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  nacionalidade?: string | null;
  estado_civil?: string | null;
  profissao?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
};

export function FormCliente({ cliente = {}, voltar }: { cliente?: ClienteForm; voltar?: string }) {
  return (
    <form action={salvarCliente} className="space-y-3">
      {cliente.id && <input type="hidden" name="id" value={cliente.id} />}
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <Campo rotulo="Nome completo ou razão social" name="nome" required defaultValue={cliente.nome} />
      <Grade>
        <Campo rotulo="CPF ou CNPJ" name="documento" inputMode="numeric" defaultValue={formatarDocumento(cliente.documento)} />
        <Campo rotulo="WhatsApp" name="whatsapp" inputMode="tel" placeholder="(51) 99999-9999" defaultValue={formatarTelefone(cliente.whatsapp)} />
        <Campo rotulo="E-mail" name="email" type="email" defaultValue={cliente.email ?? ""} />
        <Campo rotulo="Profissão" name="profissao" defaultValue={cliente.profissao ?? ""} />
        <Campo rotulo="Nacionalidade" name="nacionalidade" defaultValue={cliente.nacionalidade ?? ""} placeholder="brasileiro(a)" />
        <Campo rotulo="Estado civil" name="estado_civil" defaultValue={cliente.estado_civil ?? ""} />
      </Grade>
      <Campo rotulo="Endereço completo" name="endereco" defaultValue={cliente.endereco ?? ""} ajuda="Usado na qualificação de contratos e procurações." />
      <AreaTexto rotulo="Observações" name="observacoes" rows={3} defaultValue={cliente.observacoes ?? ""} />
      <Enviar>Salvar</Enviar>
    </form>
  );
}
