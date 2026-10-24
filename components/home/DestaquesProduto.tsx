"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fundoClasse } from "@/data/taxonomia";
import type { Produto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { classesBotao } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/Art";

/** Slider de destaque editorial (um produto por vez, com texto e CTA). */
export function DestaquesProduto({ produtos, chamadas }: { produtos: Produto[]; chamadas: string[] }) {
  const [i, setI] = useState(0);
  const ir = (n: number) => setI((n + produtos.length) % produtos.length);

  return (
    <section aria-roledescription="carrossel" aria-label="Produtos em destaque" className="wrap">
      <div className="relative overflow-hidden rounded-panel bg-cream">
        <div className="grid">
          {produtos.map((p, k) => (
            <div
              key={p.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} de ${produtos.length}`}
              aria-hidden={k !== i}
              inert={k !== i}
              className={cn(
                "col-start-1 row-start-1 grid items-center gap-6 transition-opacity duration-500 md:grid-cols-[1fr_1.1fr]",
                k === i ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <div className={cn("relative flex h-72 items-end justify-center overflow-hidden md:h-[26rem]", fundoClasse[p.fundo])}>
                <div className="absolute bottom-0 size-[120%] translate-y-[55%] rounded-full bg-white/50" aria-hidden />
                <ProductArt kind={p.art.kind} accent={p.art.accent} id={`dest-${p.slug}`} className="relative h-[92%] pb-2 drop-shadow-xl" />
              </div>
              <div className="px-6 pb-20 md:px-4 md:py-10 md:pr-16">
                <p className="eyebrow">{chamadas[k]}</p>
                <h3 className="mt-2 font-display text-3xl leading-tight font-bold text-ink md:text-[2.6rem]">{p.nome}</h3>
                <p className="mt-3 max-w-lg text-lg text-muted">{p.descricao[0]}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/produtos/${p.slug}`} className={classesBotao("primario", "m")}>
                    Saiba mais
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute right-4 bottom-4 flex items-center gap-2 md:right-8 md:bottom-6">
          <button type="button" onClick={() => ir(i - 1)} aria-label="Destaque anterior" className="flex size-11 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-mint">
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <span className="min-w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
            {i + 1}/{produtos.length}
          </span>
          <button type="button" onClick={() => ir(i + 1)} aria-label="Próximo destaque" className="flex size-11 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-mint">
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
