import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import type { FormaPagamento, StatusPagamento } from "@prisma/client";

/**
 * PAGAMENTO SIMULADO. Nenhuma operadora é contatada e nenhum dado financeiro real é
 * recebido: para cartão, o navegador envia apenas os 4 últimos dígitos (o número completo
 * nunca sai da página). Esta função é o ponto a substituir por um gateway de verdade
 * (cobrança + webhook de confirmação) quando a loja for operar de fato.
 */
export interface ResultadoCobranca {
  statusPagamento: StatusPagamento;
  /** Pix copia-e-cola, linha digitável do boleto ou código de autorização do cartão (todos fictícios). */
  codigoPagamento: string;
  /** Motivo da recusa, quando houver. */
  mensagem?: string;
}

const digitos = (n: number) => Array.from({ length: n }, () => randomInt(0, 10)).join("");

export function simularCobranca(forma: FormaPagamento, cartaoFinal4?: string): ResultadoCobranca {
  switch (forma) {
    case "PIX":
      return { statusPagamento: "PENDENTE", codigoPagamento: `PIX-SIMULADO-${randomUUID()}` };
    case "BOLETO":
      // Prefixo 99999 não corresponde a nenhum banco: deixa claro que é fictício.
      return {
        statusPagamento: "PENDENTE",
        codigoPagamento: `99999.${digitos(5)} ${digitos(5)}.${digitos(6)} ${digitos(5)}.${digitos(6)} ${digitos(1)} ${digitos(14)}`,
      };
    case "CARTAO":
      // Convenção de teste: cartão terminado em 0002 é recusado, qualquer outro é aprovado.
      if (cartaoFinal4 === "0002") {
        return { statusPagamento: "FALHOU", codigoPagamento: "", mensagem: "Pagamento recusado pela operadora (cartão de teste terminado em 0002)." };
      }
      return { statusPagamento: "CONFIRMADO", codigoPagamento: `AUT-${digitos(6)}` };
  }
}
