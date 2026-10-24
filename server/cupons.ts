import "server-only";
import type { Prisma } from "@prisma/client";
import type { CupomAplicado } from "@/lib/types";
import { prisma } from "./prisma";

type Cliente = Pick<Prisma.TransactionClient, "cupom">;

/**
 * Busca um cupom e confere vigência e limite de usos. Usada pela validação do
 * carrinho e, de novo, dentro da transação do checkout (o cliente não é confiável).
 */
export async function buscarCupomValido(codigo: string, db: Cliente = prisma): Promise<CupomAplicado | null> {
  const cupom = await db.cupom.findUnique({ where: { codigo: codigo.trim().toUpperCase() } });
  if (!cupom || !cupom.ativo) return null;
  if (cupom.validoAte && cupom.validoAte.getTime() < Date.now()) return null;
  if (cupom.usosMax != null && cupom.usos >= cupom.usosMax) return null;
  return { codigo: cupom.codigo, tipo: cupom.tipo, percentual: cupom.tipo === "PERCENTUAL" ? cupom.percentual : 0 };
}
