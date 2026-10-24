"use client";

import { useId, useState } from "react";
import { fundoClasse } from "@/data/taxonomia";
import type { ArtKind } from "@/lib/art";
import type { Produto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductArt } from "@/components/ui/Art";

/** Altura (0 a 1) do centro do rótulo em cada embalagem, para o zoom do "detalhe". */
const CENTRO_ROTULO: Record<ArtKind, number> = { jar: 0.64, dropper: 0.66, sachet: 0.55, tube: 0.62, syrup: 0.66, serum: 0.62, box: 0.6 };
const ZOOM = 1.9;

/**
 * Galeria com três vistas ilustradas (frente, rótulo e composição). Para fotos
 * reais, substitua cada vista por <Image> mantendo os botões de miniatura.
 */
export function GaleriaProduto({ produto }: { produto: Produto }) {
  const uid = useId();
  const [atual, setAtual] = useState(0);
  const { kind, accent } = produto.art;
  const fundo = fundoClasse[produto.fundo];
  const topo = 50 - CENTRO_ROTULO[kind] * ZOOM * 100;

  const vistas = [
    {
      nome: "Frente da embalagem",
      conteudo: (
        <div className="flex size-full items-center justify-center p-[10%]">
          <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}a`} className="h-full drop-shadow-xl" />
        </div>
      ),
    },
    {
      nome: "Detalhe do rótulo",
      conteudo: (
        <div className="relative size-full overflow-hidden">
          <div className="absolute left-1/2 w-full -translate-x-1/2" style={{ top: `${topo}%`, height: `${ZOOM * 100}%` }}>
            <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}b`} className="mx-auto h-full" />
          </div>
        </div>
      ),
    },
    {
      nome: "Composição com a embalagem",
      conteudo: (
        <div className="relative size-full overflow-hidden">
          <div className="absolute -right-[18%] -bottom-[30%] size-[85%] rounded-full bg-white/55" aria-hidden />
          <div className="absolute -top-[16%] -left-[12%] size-[55%] rounded-full bg-white/40" aria-hidden />
          <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}c1`} className="absolute bottom-[8%] left-[6%] h-[48%] -rotate-6 opacity-95" />
          <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}c2`} className="absolute right-[6%] bottom-[8%] h-[58%] rotate-3" />
          <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}c3`} className="absolute bottom-[6%] left-1/2 h-[78%] -translate-x-1/2 drop-shadow-xl" />
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-3 lg:order-1 lg:flex-col" role="tablist" aria-label="Imagens do produto" aria-orientation="vertical">
        {vistas.map((v, i) => (
          <button
            key={v.nome}
            type="button"
            role="tab"
            aria-selected={atual === i}
            aria-label={v.nome}
            onClick={() => setAtual(i)}
            className={cn("relative aspect-square w-20 overflow-hidden rounded-2xl ring-2 transition lg:w-full", fundo, atual === i ? "ring-forest" : "ring-transparent hover:ring-line")}
          >
            <span className="pointer-events-none block size-full" aria-hidden>
              {i === 1 ? (
                <span className="relative block size-full overflow-hidden">
                  <span className="absolute left-1/2 w-full -translate-x-1/2" style={{ top: `${topo}%`, height: `${ZOOM * 100}%` }}>
                    <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}t`} className="mx-auto h-full" />
                  </span>
                </span>
              ) : (
                <span className="flex size-full items-center justify-center p-1.5">
                  <ProductArt kind={kind} accent={accent} id={`${produto.slug}${uid}th${i}`} className="h-full" />
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <div className={cn("relative order-1 aspect-square w-full overflow-hidden rounded-panel lg:order-2", fundo)} role="tabpanel" aria-label={vistas[atual].nome}>
        {vistas[atual].conteudo}
        <p className="sr-only">{vistas[atual].nome}</p>
      </div>
    </div>
  );
}
