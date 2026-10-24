"use server";

import { z } from "zod";
import type { CupomAplicado } from "@/lib/types";
import { buscarCupomValido } from "@/server/cupons";

export type ResultadoCupom = { ok: true; cupom: CupomAplicado } | { ok: false; erro: string };

const codigoSchema = z.string().trim().min(1).max(40);

/** Só informa se o cupom existe e quanto vale; o desconto de verdade é recalculado no checkout. */
export async function validarCupomAction(codigo: string): Promise<ResultadoCupom> {
  const parsed = codigoSchema.safeParse(codigo);
  if (!parsed.success) return { ok: false, erro: "Digite o código do cupom." };
  const cupom = await buscarCupomValido(parsed.data);
  return cupom ? { ok: true, cupom } : { ok: false, erro: "Cupom inválido ou expirado." };
}
