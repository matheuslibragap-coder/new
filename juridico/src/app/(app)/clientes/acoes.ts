"use server";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { normalizarWhatsapp, validarCnpj, validarCpf } from "@/lib/documento";
import { somenteDigitos } from "@/lib/cnj";

function dadosCliente(fd: FormData) {
  const documento = somenteDigitos(texto(fd, "documento")) || null;
  const tipo = documento && documento.length === 14 ? "juridica" : "fisica";
  if (documento && !(documento.length === 11 ? validarCpf(documento) : documento.length === 14 ? validarCnpj(documento) : false)) {
    throw new Error("CPF ou CNPJ inválido.");
  }
  const whatsappBruto = texto(fd, "whatsapp");
  const whatsapp = whatsappBruto ? normalizarWhatsapp(whatsappBruto) : null;
  if (whatsappBruto && !whatsapp) throw new Error("WhatsApp inválido. Use DDD e número, ex.: (51) 99999-9999.");
  const nome = texto(fd, "nome");
  if (!nome) throw new Error("Informe o nome.");
  return {
    nome,
    tipo_pessoa: tipo,
    documento,
    whatsapp,
    email: textoOuNulo(fd, "email"),
    nacionalidade: textoOuNulo(fd, "nacionalidade"),
    estado_civil: textoOuNulo(fd, "estado_civil"),
    profissao: textoOuNulo(fd, "profissao"),
    endereco: textoOuNulo(fd, "endereco"),
    observacoes: textoOuNulo(fd, "observacoes"),
  };
}

export async function salvarCliente(fd: FormData) {
  const ctx = await obterContexto();
  const id = textoOuNulo(fd, "id");
  let novoId = id;
  try {
    const dados = dadosCliente(fd);
    if (id) {
      const { error } = await ctx.supabase.from("clientes").update(dados).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await ctx.supabase.from("clientes").insert({ ...dados, escritorio_id: ctx.escritorio.id }).select("id").single();
      if (error) throw error;
      novoId = data.id;
    }
  } catch (e) {
    voltarCom(id ? `/clientes/${id}` : "/clientes/novo", { erro: erroAmigavel(e) });
  }
  revalidatePath("/clientes");
  const voltar = textoOuNulo(fd, "voltar");
  voltarCom(voltar ?? `/clientes/${novoId}`, { ok: "Cliente salvo." });
}

export async function excluirCliente(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase.from("clientes").delete().eq("id", id);
  if (error) voltarCom(`/clientes/${id}`, { erro: erroAmigavel(error) });
  revalidatePath("/clientes");
  voltarCom("/clientes", { ok: "Cliente excluído. Os processos vinculados foram mantidos sem cliente." });
}
