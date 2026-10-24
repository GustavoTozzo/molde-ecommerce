"use client";

import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { fecharCarrinho, useCarrinho, useStore } from "@/lib/store";
import { useCatalogo } from "@/components/catalogo/CatalogoContext";
import { Painel } from "@/components/ui/Painel";
import { LinkBotao } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/Art";
import { fundoClasse } from "@/data/taxonomia";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LinhaCarrinho } from "./LinhaCarrinho";
import { AvisoReceita, CupomForm, ProgressoFrete, ResumoValores } from "./Complementos";

export function CarrinhoGaveta() {
  const aberto = useStore((s) => s.carrinhoAberto);
  const resumo = useCarrinho();
  const { produtos } = useCatalogo();
  const vazio = resumo.linhas.length === 0;
  const sugestoes = produtos.filter((p) => p.selos.includes("mais-vendido")).slice(0, 3);

  return (
    <Painel aberto={aberto} aoFechar={fecharCarrinho} rotulo="Carrinho de compras" lado="direita">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-bold">
          Seu carrinho{" "}
          {!vazio && <span className="text-muted">({resumo.quantidade})</span>}
        </h2>
        <button type="button" data-autofocus onClick={fecharCarrinho} aria-label="Fechar carrinho" className="rounded-full p-2 transition hover:bg-mint">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {vazio ? (
        <div className="flex-1 overflow-y-auto px-5 py-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-mint text-forest">
            <ShoppingBag className="size-9" aria-hidden />
          </div>
          <p className="mt-5 text-center font-display text-xl font-bold">Seu carrinho está vazio</p>
          <p className="mx-auto mt-1 max-w-xs text-center text-sm text-muted">Escolha suas fórmulas e elas aparecem aqui. Que tal começar pelos mais vendidos?</p>
          <ul className="mt-6 space-y-2">
            {sugestoes.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/produtos/${p.slug}`}
                  onClick={fecharCarrinho}
                  className="flex items-center gap-3 rounded-2xl border border-line p-2.5 transition hover:border-forest hover:bg-mint/40"
                >
                  <span className={cn("block size-16 shrink-0 rounded-xl p-1.5", fundoClasse[p.fundo])}>
                    <ProductArt kind={p.art.kind} accent={p.art.accent} id={`gv-${p.slug}`} className="h-full" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{p.nome}</span>
                    <span className="text-sm text-muted">a partir de {formatBRL(p.tamanhos[0].preco)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <LinkBotao href="/produtos" onClick={fecharCarrinho} variante="primario" className="mt-6 w-full">
            Ver todos os produtos
          </LinkBotao>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5">
            <div className="pt-4">
              <ProgressoFrete resumo={resumo} />
            </div>
            <ul className="divide-y divide-line">
              {resumo.linhas.map((l) => (
                <LinhaCarrinho key={l.item.key} linha={l} aoNavegar={fecharCarrinho} />
              ))}
            </ul>
            <div className="space-y-4 pb-5">
              {resumo.precisaReceita && <AvisoReceita />}
              <CupomForm />
            </div>
          </div>
          <div className="border-t border-line bg-white px-5 py-4">
            <ResumoValores resumo={resumo} />
            <div className="mt-4 grid gap-2">
              <LinkBotao
                href="/checkout"
                prefetch={false}
                onClick={fecharCarrinho}
                variante="primario"
                tamanho="l"
                className="w-full"
              >
                Finalizar compra
              </LinkBotao>
              <LinkBotao href="/carrinho" onClick={fecharCarrinho} variante="fantasma" tamanho="m" className="w-full">
                Ver carrinho completo
              </LinkBotao>
            </div>
          </div>
        </>
      )}
    </Painel>
  );
}
