"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CANCELAVEIS_PELA_EQUIPE, cancelarPedido, confirmarPagamentoSimulado, marcarEntregue, marcarEnviado, revisarReceita } from "@/server/pedidos";
import { exigirEquipeNaAcao } from "@/server/sessao";
import { texto, type EstadoForm } from "@/server/validacao";

export type { EstadoForm };

const idSchema = z.string().min(1).max(40);

function atualizarTelas(pedidoId?: string) {
  revalidatePath("/admin", "layout");
  if (pedidoId) revalidatePath(`/conta/pedidos/${pedidoId}`);
}

/** Pix/boleto conferido no extrato: a equipe marca como pago (com gateway real, isto seria o webhook). */
export async function confirmarPagamentoPelaEquipe(pedidoId: string): Promise<void> {
  const equipe = await exigirEquipeNaAcao();
  await confirmarPagamentoSimulado(idSchema.parse(pedidoId), null, equipe.id);
  atualizarTelas(pedidoId);
}

const rastreioSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{5,30}$/, "Informe o código de rastreio (5 a 30 letras, números ou hífen).");

export async function enviarPedido(pedidoId: string, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const equipe = await exigirEquipeNaAcao();
  const parsed = rastreioSchema.safeParse(texto(dados, "rastreio"));
  if (!parsed.success) return { erros: { rastreio: parsed.error.issues[0].message }, valores: { rastreio: texto(dados, "rastreio") } };
  const ok = await marcarEnviado(idSchema.parse(pedidoId), parsed.data, equipe.id);
  if (!ok) return { erro: "Só é possível enviar pedidos que estão em preparo." };
  atualizarTelas(pedidoId);
  return { ok: "Pedido marcado como enviado." };
}

export async function entregarPedido(pedidoId: string): Promise<void> {
  const equipe = await exigirEquipeNaAcao();
  await marcarEntregue(idSchema.parse(pedidoId), equipe.id);
  atualizarTelas(pedidoId);
}

export async function cancelarPedidoPelaEquipe(pedidoId: string): Promise<void> {
  const equipe = await exigirEquipeNaAcao();
  await cancelarPedido(idSchema.parse(pedidoId), null, CANCELAVEIS_PELA_EQUIPE, equipe.id);
  atualizarTelas(pedidoId);
}

export async function aprovarReceita(receitaId: string): Promise<void> {
  const equipe = await exigirEquipeNaAcao();
  await revisarReceita(idSchema.parse(receitaId), "APROVADA", null, equipe.id);
  atualizarTelas();
}

const motivoSchema = z.string().trim().min(5, "Explique o motivo em poucas palavras (mínimo 5 letras).").max(300, "Use no máximo 300 caracteres.");

export async function recusarReceita(receitaId: string, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const equipe = await exigirEquipeNaAcao();
  const motivo = motivoSchema.safeParse(texto(dados, "motivo"));
  if (!motivo.success) return { erros: { motivo: motivo.error.issues[0].message }, valores: { motivo: texto(dados, "motivo") } };
  const ok = await revisarReceita(idSchema.parse(receitaId), "REJEITADA", motivo.data, equipe.id);
  if (!ok) return { erro: "Esta receita já foi conferida por outra pessoa." };
  atualizarTelas();
  return { ok: "Receita recusada. O cliente foi avisado na página do pedido." };
}
