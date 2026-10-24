"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrossel horizontal com scroll-snap (funciona por toque, trackpad, teclado
 * e botões). Passe a largura de cada item em `itemClassName`.
 */
export function Carousel({
  children,
  ariaLabel,
  itemClassName = "w-[72%] sm:w-[44%] lg:w-[calc((100%-6rem)/4)]",
  className,
  gapClassName = "gap-4 lg:gap-8",
}: {
  children: ReactNode;
  ariaLabel: string;
  itemClassName?: string;
  className?: string;
  gapClassName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(true);

  const atualizar = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 4);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    atualizar();
    const ro = new ResizeObserver(atualizar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [atualizar]);

  function rolar(direcao: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className={cn("group/carousel relative", className)} role="region" aria-roledescription="carrossel" aria-label={ariaLabel}>
      <ul ref={ref} onScroll={atualizar} className={cn("no-scrollbar -mx-1 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-1 pb-2", gapClassName)}>
        {Children.map(children, (child, i) => (
          <li key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => rolar(-1)}
        disabled={!podeVoltar}
        aria-label="Ver itens anteriores"
        className="absolute top-[38%] left-0 z-10 hidden size-12 -translate-x-1/2 items-center justify-center rounded-full bg-white text-ink shadow-pop transition hover:bg-mint disabled:pointer-events-none disabled:opacity-0 md:flex"
      >
        <ChevronLeft className="size-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => rolar(1)}
        disabled={!podeAvancar}
        aria-label="Ver próximos itens"
        className="absolute top-[38%] right-0 z-10 hidden size-12 translate-x-1/2 items-center justify-center rounded-full bg-white text-ink shadow-pop transition hover:bg-mint disabled:pointer-events-none disabled:opacity-0 md:flex"
      >
        <ChevronRight className="size-6" aria-hidden />
      </button>
    </div>
  );
}
