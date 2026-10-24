"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CatalogoPorSlug } from "@/lib/carrinho";
import type { ProdutoResumo } from "@/lib/types";

interface Valor {
  produtos: ProdutoResumo[];
  porSlug: CatalogoPorSlug;
}

const Contexto = createContext<Valor | null>(null);

/**
 * Entrega o catálogo (lido do banco no layout, com cache) a quem precisa dele no
 * navegador: gaveta do carrinho, busca do cabeçalho, favoritos, filtros.
 */
export function CatalogoProvider({ produtos, children }: { produtos: ProdutoResumo[]; children: ReactNode }) {
  const valor = useMemo(() => ({ produtos, porSlug: new Map(produtos.map((p) => [p.slug, p])) }), [produtos]);
  return <Contexto value={valor}>{children}</Contexto>;
}

export function useCatalogo(): Valor {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useCatalogo precisa estar dentro de <CatalogoProvider>.");
  return valor;
}
