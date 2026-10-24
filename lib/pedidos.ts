import type { FormaPagamento, StatusPagamento, StatusPedido, StatusReceita } from "@prisma/client";

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

export const rotuloStatusPagamento: Record<StatusPagamento, string> = {
  PENDENTE: "Aguardando pagamento",
  CONFIRMADO: "Pagamento confirmado",
  FALHOU: "Pagamento recusado",
  ESTORNADO: "Pagamento estornado",
};

export const rotuloStatusReceita: Record<StatusReceita, string> = {
  PENDENTE: "Aguardando conferência",
  APROVADA: "Receita aprovada",
  REJEITADA: "Receita não aprovada",
};

export type EstadoEtapa = "feito" | "atual" | "pendente";
export interface Etapa {
  rotulo: string;
  estado: EstadoEtapa;
}

/** Linha do tempo exibida na página do pedido (pedido cancelado não usa). */
export function etapasDoPedido(p: { status: StatusPedido; temReceita: boolean; receitaStatus: StatusReceita | null }): Etapa[] {
  const ordem: StatusPedido[] = ["AGUARDANDO_PAGAMENTO", "AGUARDANDO_RECEITA", "EM_PREPARO", "ENVIADO", "ENTREGUE"];
  const posicao = ordem.indexOf(p.status);
  const etapa = (rotulo: string, ate: StatusPedido, estadoAtual: StatusPedido): Etapa => {
    const feitoDepoisDe = ordem.indexOf(ate);
    return { rotulo, estado: posicao > feitoDepoisDe ? "feito" : p.status === estadoAtual ? "atual" : "pendente" };
  };
  const etapas: Etapa[] = [{ rotulo: "Pedido recebido", estado: "feito" }, etapa("Pagamento", "AGUARDANDO_PAGAMENTO", "AGUARDANDO_PAGAMENTO")];
  if (p.temReceita) {
    etapas.push({
      rotulo: p.receitaStatus === "REJEITADA" ? "Receita não aprovada: envie outra" : "Conferência da receita",
      estado: p.receitaStatus === "APROVADA" || posicao > ordem.indexOf("AGUARDANDO_RECEITA") ? "feito" : p.status === "AGUARDANDO_RECEITA" ? "atual" : "pendente",
    });
  }
  etapas.push(etapa("Em preparo", "EM_PREPARO", "EM_PREPARO"), etapa("Enviado", "ENVIADO", "ENVIADO"), { rotulo: "Entregue", estado: p.status === "ENTREGUE" ? "feito" : "pendente" });
  return etapas;
}

export function podeCancelarPeloCliente(status: StatusPedido): boolean {
  return status === "AGUARDANDO_PAGAMENTO" || status === "AGUARDANDO_RECEITA";
}
