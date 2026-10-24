"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { excedeuLimite } from "@/server/limite";
import { cancelarPedido, confirmarPagamentoSimulado, criarPedido, reenviarReceita, type ArquivoReceita, type EnderecoEntrega } from "@/server/pedidos";
import { prisma } from "@/server/prisma";
import { exigirUsuarioNaAcao } from "@/server/sessao";
import { CAMPOS_ENDERECO, enderecoSchema, errosPorCampo, texto, valoresDe, type EstadoForm } from "@/server/validacao";

export type { EstadoForm };

const TAMANHO_MAXIMO_RECEITA = 3 * 1024 * 1024;
const MAX_ENDERECOS = 5;

const itensSchema = z
  .array(
    z.object({
      slug: z.string().min(1).max(120),
      tamanhoId: z.string().min(1).max(20),
      sabor: z.string().max(60).optional(),
      qtd: z.number().int().min(1).max(20),
      frequencia: z.enum(["unica", "1", "2", "3"]),
    }),
  )
  .min(1, "O carrinho está vazio.")
  .max(30);

const pagamentoSchema = z.object({
  formaPagamento: z.enum(["PIX", "CARTAO", "BOLETO"], "Escolha a forma de pagamento."),
  cartaoFinal4: z.string().regex(/^\d{4}$/, "Informe os dados do cartão.").optional(),
  parcelas: z.coerce.number().int().min(1).max(12).optional(),
  chave: z.string().regex(/^[0-9a-f-]{36}$/i, "Recarregue a página e tente de novo."),
  cupom: z.string().trim().max(40).optional(),
});

/**
 * Identifica o tipo do arquivo pelos primeiros bytes, não pelo que o navegador declarou:
 * o nome e o Content-Type vêm do cliente e podem mentir.
 */
function tipoPorAssinatura(b: Uint8Array): string | null {
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

const EXTENSAO: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg" };

function nomeSeguro(original: string, tipo: string): string {
  const base = original.replace(/\.[^.]*$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "receita"}.${EXTENSAO[tipo]}`;
}

async function lerReceita(dados: FormData): Promise<{ receita: ArquivoReceita | null } | { erro: string }> {
  const arquivo = dados.get("receita");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { receita: null };
  if (arquivo.size > TAMANHO_MAXIMO_RECEITA) return { erro: "O arquivo da receita passa de 3 MB. Envie uma foto ou PDF menor." };
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = tipoPorAssinatura(bytes);
  if (!tipo) return { erro: "Formato de receita não aceito. Envie PDF, PNG ou JPG." };
  return { receita: { nomeArquivo: nomeSeguro(arquivo.name, tipo), tipoMime: tipo, conteudo: bytes } };
}

export async function finalizarPedido(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioNaAcao();
  const valores = { ...valoresDe(dados, [...CAMPOS_ENDERECO, "enderecoId", "formaPagamento", "parcelas"]), salvarEndereco: texto(dados, "salvarEndereco") };

  if (excedeuLimite(`pedido:${usuario.id}`, 20, 60 * 60_000)) {
    return { erro: "Muitas tentativas de compra em pouco tempo. Aguarde alguns minutos.", valores };
  }

  let itensBrutos: unknown;
  try {
    const json = texto(dados, "itens");
    if (json.length > 20_000) throw new Error("grande demais");
    itensBrutos = JSON.parse(json);
  } catch {
    return { erro: "Não foi possível ler o carrinho. Volte ao carrinho e tente de novo.", valores };
  }
  const itens = itensSchema.safeParse(itensBrutos);
  if (!itens.success) return { erro: itens.error.issues[0]?.message ?? "Carrinho inválido.", valores };

  const pagamento = pagamentoSchema.safeParse({
    formaPagamento: texto(dados, "formaPagamento"),
    cartaoFinal4: texto(dados, "cartaoFinal4") || undefined,
    parcelas: texto(dados, "parcelas") || undefined,
    chave: texto(dados, "chave"),
    cupom: texto(dados, "cupom") || undefined,
  });
  if (!pagamento.success) return { erros: errosPorCampo(pagamento.error), erro: pagamento.error.issues[0]?.message, valores };
  if (pagamento.data.formaPagamento === "CARTAO" && !pagamento.data.cartaoFinal4) {
    return { erros: { cartao: "Informe os dados do cartão." }, valores };
  }

  // Endereço: um dos salvos (conferido o dono) ou um novo.
  let endereco: EnderecoEntrega;
  const enderecoId = texto(dados, "enderecoId");
  const salvar = texto(dados, "salvarEndereco") === "on";
  let novoParaSalvar: z.infer<typeof enderecoSchema> | null = null;
  if (enderecoId && enderecoId !== "novo") {
    const salvo = await prisma.endereco.findFirst({ where: { id: enderecoId, usuarioId: usuario.id } });
    if (!salvo) return { erro: "Endereço não encontrado. Escolha outro.", valores };
    endereco = { apelido: salvo.apelido, cep: salvo.cep, logradouro: salvo.logradouro, numero: salvo.numero, complemento: salvo.complemento, bairro: salvo.bairro, cidade: salvo.cidade, uf: salvo.uf };
  } else {
    const parsed = enderecoSchema.safeParse(valoresDe(dados, [...CAMPOS_ENDERECO]));
    if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };
    const { apelido, complemento, ...resto } = parsed.data;
    endereco = { ...resto, apelido: apelido || null, complemento: complemento || null };
    novoParaSalvar = parsed.data;
  }

  const lida = await lerReceita(dados);
  if ("erro" in lida) return { erro: lida.erro, valores };

  const resultado = await criarPedido({
    usuarioId: usuario.id,
    itens: itens.data,
    cupomCodigo: pagamento.data.cupom || undefined,
    endereco,
    formaPagamento: pagamento.data.formaPagamento,
    cartaoFinal4: pagamento.data.cartaoFinal4,
    parcelas: pagamento.data.parcelas,
    receita: lida.receita,
    chave: pagamento.data.chave,
  });
  if (!resultado.ok) return { erro: resultado.erro, valores };

  // O pedido já existe; salvar o endereço é cortesia e não pode derrubar a compra.
  if (novoParaSalvar && salvar) {
    try {
      const total = await prisma.endereco.count({ where: { usuarioId: usuario.id } });
      if (total < MAX_ENDERECOS) {
        const { apelido, complemento, ...resto } = novoParaSalvar;
        await prisma.endereco.create({ data: { ...resto, apelido: apelido || null, complemento: complemento || null, usuarioId: usuario.id, principal: total === 0 } });
      }
    } catch {
      /* segue: o pedido foi criado */
    }
  }

  revalidatePath("/conta/pedidos");
  redirect(`/conta/pedidos/${resultado.pedidoId}?novo=1`);
}

const idSchema = z.string().min(1).max(40);

/** Demonstração: simula o cliente pagando o Pix/boleto fictício. */
export async function simularPagamento(pedidoId: string): Promise<void> {
  const usuario = await exigirUsuarioNaAcao();
  await confirmarPagamentoSimulado(idSchema.parse(pedidoId), usuario.id);
  revalidatePath(`/conta/pedidos/${pedidoId}`);
  revalidatePath("/conta/pedidos");
}

export async function cancelarMeuPedido(pedidoId: string): Promise<void> {
  const usuario = await exigirUsuarioNaAcao();
  await cancelarPedido(idSchema.parse(pedidoId), usuario.id);
  revalidatePath(`/conta/pedidos/${pedidoId}`);
  revalidatePath("/conta/pedidos");
}

/** Cliente envia outra receita depois de uma recusa. */
export async function reenviarMinhaReceita(pedidoId: string, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioNaAcao();
  if (excedeuLimite(`receita:${usuario.id}`, 10, 60 * 60_000)) return { erro: "Muitos envios em pouco tempo. Aguarde alguns minutos." };
  const lida = await lerReceita(dados);
  if ("erro" in lida) return { erro: lida.erro };
  if (!lida.receita) return { erro: "Escolha o arquivo da receita." };
  const ok = await reenviarReceita(idSchema.parse(pedidoId), usuario.id, lida.receita);
  if (!ok) return { erro: "Este pedido não está esperando uma nova receita." };
  revalidatePath(`/conta/pedidos/${pedidoId}`);
  revalidatePath("/admin", "layout");
  return { ok: "Receita enviada. O farmacêutico vai conferir em breve." };
}
