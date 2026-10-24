"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, FileText, Repeat, ShoppingBag } from "lucide-react";
import { fundoClasse } from "@/data/taxonomia";
import { descontoCentavos, formatBRL, percentual } from "@/lib/format";
import { site } from "@/lib/site";
import { adicionarAoCarrinho } from "@/lib/store";
import type { ProdutoResumo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductArt } from "@/components/ui/Art";
import { Botao } from "@/components/ui/Button";
import { NotaResumida } from "@/components/ui/Estrelas";
import { Selo, seloVisual } from "@/components/ui/Selo";
import { BotaoFavorito } from "./BotaoFavorito";

export function ProductCard({ produto, className }: { produto: ProdutoResumo; className?: string }) {
  const uid = useId();
  const [adicionado, setAdicionado] = useState(false);
  const tamanho = produto.tamanhos[0];
  const aPartirDe = produto.tamanhos.length > 1;
  const precoAssinatura = descontoCentavos(tamanho.preco, site.loja.descontoAssinatura);
  const href = `/produtos/${produto.slug}`;
  const selos = produto.selos.filter((s) => s !== "oferta").slice(0, 2);

  function adicionar() {
    adicionarAoCarrinho(produto, { tamanhoId: tamanho.id, sabor: produto.sabores?.[0] });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1600);
  }

  return (
    <article className={cn("flex h-full flex-col", className)}>
      <div className={cn("group relative overflow-hidden rounded-card", fundoClasse[produto.fundo])}>
        <Link href={href} className="block" aria-label={`Ver ${produto.nome}`} tabIndex={-1}>
          <div className="aspect-square p-7 sm:p-9">
            <ProductArt
              kind={produto.art.kind}
              accent={produto.art.accent}
              id={`${produto.slug}${uid}`}
              className="mx-auto h-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          </div>
        </Link>
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {selos.map((s) => (
            <Selo key={s} tom={seloVisual[s].tom}>
              {seloVisual[s].rotulo}
            </Selo>
          ))}
          {tamanho.precoDe && <Selo tom="ambar">−{percentual(tamanho.precoDe, tamanho.preco)}%</Selo>}
        </div>
        <BotaoFavorito slug={produto.slug} nome={produto.nome} className="absolute top-3 right-3" />
        {produto.receita && (
          <Selo tom="claro" className="absolute bottom-3 left-3 gap-1">
            <FileText className="size-3.5" aria-hidden />
            Venda com receita
          </Selo>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-sans text-base leading-snug font-bold text-ink">
          <Link href={href} className="hover:text-forest hover:underline">
            {produto.nome}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-muted">{produto.subtitulo}</p>
        <div className="mt-2">
          <NotaResumida nota={produto.nota} avaliacoes={produto.avaliacoes} />
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
          {aPartirDe && <span className="text-xs text-muted">a partir de</span>}
          {tamanho.precoDe && <s className="text-sm text-muted">{formatBRL(tamanho.precoDe)}</s>}
          <strong className="font-display text-xl font-bold text-ink">{formatBRL(tamanho.preco)}</strong>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-forest-dark">
          <Repeat className="size-4 shrink-0" aria-hidden />
          {formatBRL(precoAssinatura)} na assinatura
        </p>
        <div className="mt-auto pt-4">
          <Botao variante={adicionado ? "secundario" : "primario"} className="w-full" onClick={adicionar} aria-live="polite">
            {adicionado ? (
              <>
                <Check className="size-4" aria-hidden /> Adicionado
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden /> Adicionar ao carrinho
              </>
            )}
          </Botao>
        </div>
      </div>
    </article>
  );
}
