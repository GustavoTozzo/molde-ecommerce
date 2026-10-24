import { descontoCentavos } from "@/lib/format";
import { site } from "@/lib/site";
import type { CupomAplicado, ProdutoResumo, Tamanho } from "@/lib/types";

export type Frequencia = "unica" | "1" | "2" | "3";

export interface ItemCarrinho {
  key: string;
  slug: string;
  tamanhoId: string;
  sabor?: string;
  qtd: number;
  frequencia: Frequencia;
}

export interface LinhaCarrinho {
  item: ItemCarrinho;
  produto: ProdutoResumo;
  tamanho: Tamanho;
  unitario: number;
  total: number;
  economia: number;
}

export interface ResumoCarrinho {
  linhas: LinhaCarrinho[];
  quantidade: number;
  subtotal: number;
  descontoCupom: number;
  frete: number;
  total: number;
  economiaAssinatura: number;
  faltaFreteGratis: number;
  freteGratis: boolean;
  precisaReceita: boolean;
}

export const rotuloFrequencia: Record<Frequencia, string> = {
  unica: "Compra única",
  "1": "Receber todo mês",
  "2": "Receber a cada 2 meses",
  "3": "Receber a cada 3 meses",
};

export function chaveItem(slug: string, tamanhoId: string, sabor: string | undefined, frequencia: Frequencia): string {
  return [slug, tamanhoId, sabor ?? "", frequencia].join("|");
}

export function precoUnitario(tamanho: Tamanho, frequencia: Frequencia): number {
  return frequencia === "unica" ? tamanho.preco : descontoCentavos(tamanho.preco, site.loja.descontoAssinatura);
}

/** Catálogo indexado por slug; vem do banco (cliente: contexto; servidor: leitura direta). */
export type CatalogoPorSlug = ReadonlyMap<string, ProdutoResumo>;

/**
 * Função pura usada nos dois lados: o cliente a chama para exibir o carrinho e o
 * servidor para gravar o pedido, sempre com preços e cupom lidos do banco. O que
 * o navegador mandar (preço, desconto, total) nunca entra na conta.
 */
export function calcularCarrinho(
  itens: ItemCarrinho[],
  cupom: CupomAplicado | null,
  catalogo: CatalogoPorSlug,
): ResumoCarrinho {
  const linhas: LinhaCarrinho[] = [];
  for (const item of itens) {
    const produto = catalogo.get(item.slug);
    const tamanho = produto?.tamanhos.find((t) => t.id === item.tamanhoId);
    if (!produto || !tamanho) continue;
    const unitario = precoUnitario(tamanho, item.frequencia);
    linhas.push({
      item,
      produto,
      tamanho,
      unitario,
      total: unitario * item.qtd,
      economia: (tamanho.preco - unitario) * item.qtd,
    });
  }
  const subtotal = linhas.reduce((acc, l) => acc + l.total, 0);
  const quantidade = linhas.reduce((acc, l) => acc + l.item.qtd, 0);
  const descontoCupom = cupom?.tipo === "PERCENTUAL" ? Math.round((subtotal * cupom.percentual) / 100) : 0;
  const baseFrete = subtotal - descontoCupom;
  const freteGratis = linhas.length > 0 && (cupom?.tipo === "FRETE_GRATIS" || baseFrete >= site.loja.freteGratisAcima);
  const frete = linhas.length === 0 || freteGratis ? 0 : site.loja.freteFixo;
  return {
    linhas,
    quantidade,
    subtotal,
    descontoCupom,
    frete,
    total: baseFrete + frete,
    economiaAssinatura: linhas.reduce((acc, l) => acc + l.economia, 0),
    faltaFreteGratis: Math.max(0, site.loja.freteGratisAcima - baseFrete),
    freteGratis,
    precisaReceita: linhas.some((l) => l.produto.receita),
  };
}
