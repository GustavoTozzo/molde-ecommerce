"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrinho } from "@/lib/store";
import { classesBotao, LinkBotao } from "@/components/ui/Button";
import { LinhaCarrinho } from "./LinhaCarrinho";
import { AvisoReceita, CupomForm, ProgressoFrete, ResumoValores } from "./Complementos";

export function CarrinhoPagina() {
  const resumo = useCarrinho();
  const vazio = resumo.linhas.length === 0;

  return (
    <div className="wrap pt-8 pb-4 md:pt-12">
      <h1 className="font-display text-4xl font-bold text-forest-dark md:text-5xl">Carrinho</h1>
      {vazio ? (
        <div className="mt-10 rounded-panel bg-cream px-6 py-20 text-center">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-mint text-forest">
            <ShoppingBag className="size-11" aria-hidden />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold">Seu carrinho está vazio</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Explore o catálogo e adicione fórmulas para montar sua rotina.</p>
          <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-7">
            Ver produtos
          </LinkBotao>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            <ProgressoFrete resumo={resumo} />
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {resumo.linhas.map((l) => (
                <LinhaCarrinho key={l.item.key} linha={l} />
              ))}
            </ul>
            <Link href="/produtos" className="mt-5 inline-block font-bold text-forest underline underline-offset-4">
              Continuar comprando
            </Link>
          </div>
          <aside className="h-fit space-y-5 rounded-panel bg-cream p-6 lg:sticky lg:top-44" aria-label="Resumo do pedido">
            <h2 className="font-display text-2xl font-bold">Resumo do pedido</h2>
            <CupomForm />
            {resumo.precisaReceita && <AvisoReceita />}
            <ResumoValores resumo={resumo} />
            <Link href="/checkout" prefetch={false} className={classesBotao("primario", "l", "w-full")}>
              Finalizar compra
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
