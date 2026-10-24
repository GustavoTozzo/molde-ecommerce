import type { FormaPagamento, StatusPedido } from "@prisma/client";

export const rotuloStatusPedido: Record<StatusPedido, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  AGUARDANDO_RECEITA: "Aguardando conferência da receita",
  EM_PREPARO: "Em preparo",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const rotuloFormaPagamento: Record<FormaPagamento, string> = {
  PIX: "Pix",
  CARTAO: "Cartão de crédito",
  BOLETO: "Boleto",
};
