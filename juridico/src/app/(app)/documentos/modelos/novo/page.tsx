import { Cabecalho, Cartao } from "@/components/ui";
import { FormModelo } from "@/components/form-modelo";
import { salvarModelo } from "../../acoes";

export default function NovoModelo() {
  return (
    <div>
      <Cabecalho titulo="Novo modelo" voltar={{ href: "/documentos", rotulo: "Documentos" }} />
      <Cartao>
        <FormModelo acao={salvarModelo} />
      </Cartao>
    </div>
  );
}
