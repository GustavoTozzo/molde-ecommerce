"use client";

import { Heart } from "lucide-react";
import { useCatalogo } from "@/components/catalogo/CatalogoContext";
import { useStore } from "@/lib/store";
import { LinkBotao } from "@/components/ui/Button";
import { ProductCard } from "@/components/produto/ProductCard";

export function FavoritosLista() {
  const favoritos = useStore((s) => s.favoritos);
  const { produtos } = useCatalogo();
  const lista = produtos.filter((p) => favoritos.includes(p.slug));
  return (
    <div className="wrap pt-8 pb-4 md:pt-12">
      <h1 className="font-display text-4xl font-bold text-forest-dark md:text-5xl">Favoritos</h1>
      {lista.length === 0 ? (
        <div className="mt-8 rounded-panel bg-cream px-6 py-20 text-center">
          <Heart className="mx-auto size-14 text-forest" strokeWidth={1.4} aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-bold">Você ainda não salvou nenhum produto</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Toque no coração de um produto para guardá-lo aqui. Seus favoritos ficam salvos neste navegador.</p>
          <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-6">
            Explorar produtos
          </LinkBotao>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
          {lista.map((p) => (
            <li key={p.slug}>
              <ProductCard produto={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
