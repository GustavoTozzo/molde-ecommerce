"use client";

import { useId, useState } from "react";
import { Play, ShoppingBag, X } from "lucide-react";
import { useCatalogo } from "@/components/catalogo/CatalogoContext";
import { formatBRL } from "@/lib/format";
import { adicionarAoCarrinho } from "@/lib/store";
import type { Criador } from "@/lib/types";
import { Avatar } from "@/components/ui/Art";
import { Botao } from "@/components/ui/Button";
import { Carousel } from "@/components/ui/Carousel";
import { Painel } from "@/components/ui/Painel";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";

function CartaoCriador({ criador, aoAbrir }: { criador: Criador; aoAbrir: (c: Criador) => void }) {
  const { porSlug } = useCatalogo();
  const produto = porSlug.get(criador.produto);
  if (!produto) return null;
  const tamanho = produto.tamanhos[0];
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-forest-dark text-white">
      <div className="relative aspect-square">
        <Avatar nome={criador.avatar} className="absolute inset-0 size-full" />
        <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">{criador.handle}</span>
        <button
          type="button"
          onClick={() => aoAbrir(criador)}
          aria-label={`Assistir ao vídeo de ${criador.handle}`}
          className="absolute right-3 bottom-3 flex size-12 items-center justify-center rounded-full bg-white/95 text-forest-dark shadow-card transition hover:scale-110"
        >
          <Play className="size-5 translate-x-0.5" fill="currentColor" aria-hidden />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-forest-dark p-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-snug font-bold">{produto.nome}</p>
        <p className="font-display text-lg font-bold text-amber">{formatBRL(tamanho.preco)}</p>
        <Botao
          variante="claro"
          tamanho="p"
          className="w-full"
          onClick={() => adicionarAoCarrinho(produto, { tamanhoId: tamanho.id, sabor: produto.sabores?.[0] })}
        >
          <ShoppingBag className="size-4" aria-hidden /> Adicionar ao carrinho
        </Botao>
      </div>
    </article>
  );
}

export function CriadoresCarrossel({ criadores }: { criadores: Criador[] }) {
  const [aberto, setAberto] = useState<Criador | null>(null);
  const idVideo = useId();
  const { porSlug } = useCatalogo();
  const produto = aberto ? porSlug.get(aberto.produto) : null;
  return (
    <section aria-labelledby={`${idVideo}-t`} className="wrap">
      <SecaoTitulo id={`${idVideo}-t`} sobretitulo="Comunidade" href="/produtos" linkRotulo="Ver todos os produtos">
        Quem usa, conta
      </SecaoTitulo>
      <Carousel ariaLabel="Vídeos de criadores" itemClassName="w-[62%] sm:w-[34%] lg:w-[calc((100%-8rem)/5)]">
        {criadores.map((c) => (
          <CartaoCriador key={c.handle} criador={c} aoAbrir={setAberto} />
        ))}
      </Carousel>

      <Painel aberto={!!aberto} aoFechar={() => setAberto(null)} rotulo="Vídeo do criador" lado="centro">
        {aberto && produto && (
          <div className="flex max-h-[90vh] flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-bold">{aberto.handle}</p>
              <button type="button" data-autofocus onClick={() => setAberto(null)} aria-label="Fechar vídeo" className="rounded-full p-2 hover:bg-mint">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="relative mx-5 aspect-[9/12] overflow-hidden rounded-2xl bg-forest-dark">
              <Avatar nome={aberto.avatar} className="absolute inset-0 size-full opacity-90" />
              <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-5 text-center text-white">
                <p className="font-display text-xl font-bold">{aberto.legenda}</p>
                <p className="mt-1 text-sm text-white/80">Espaço reservado para um vídeo real do criador.</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted">Produto citado</p>
              <p className="font-bold">{produto.nome}</p>
              <Botao
                variante="primario"
                tamanho="l"
                className="mt-3 w-full"
                onClick={() => {
                  adicionarAoCarrinho(produto, { tamanhoId: produto.tamanhos[0].id, sabor: produto.sabores?.[0] });
                  setAberto(null);
                }}
              >
                <ShoppingBag className="size-5" aria-hidden /> Adicionar por {formatBRL(produto.tamanhos[0].preco)}
              </Botao>
            </div>
          </div>
        )}
      </Painel>
    </section>
  );
}
