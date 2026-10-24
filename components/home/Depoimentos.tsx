"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { ProductArt } from "@/components/ui/Art";
import { cn } from "@/lib/utils";

export function Depoimentos({ itens }: { itens: { nome: string; texto: string }[] }) {
  const [i, setI] = useState(0);
  const ir = (n: number) => setI((n + itens.length) % itens.length);
  return (
    <section aria-roledescription="carrossel" aria-label="Depoimentos de clientes" className="wrap">
      <div className="grid overflow-hidden rounded-panel bg-forest text-white md:grid-cols-[1fr_2.2fr_1fr]">
        <div className="hidden items-end justify-center bg-sage/40 pt-10 md:flex" aria-hidden>
          <ProductArt kind="jar" accent="#E58A2E" id="dep-a" className="h-[85%] w-3/4" />
        </div>
        <div className="relative p-7 md:p-14">
          <Quote className="size-10 text-amber" aria-hidden />
          <div className="mt-4 grid">
            {itens.map((d, k) => (
              <figure
                key={d.nome}
                role="group"
                aria-roledescription="slide"
                aria-label={`${k + 1} de ${itens.length}`}
                aria-hidden={k !== i}
                inert={k !== i}
                className={cn("col-start-1 row-start-1 transition-opacity duration-500", k === i ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                <blockquote className="font-display text-2xl leading-snug font-bold md:text-[2rem]">“{d.texto}”</blockquote>
                <figcaption className="mt-5 text-base font-semibold text-mint-deep">{d.nome}, cliente</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={() => ir(i - 1)} aria-label="Depoimento anterior" className="flex size-11 items-center justify-center rounded-full border border-white/35 transition hover:bg-white hover:text-forest-dark">
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <span className="min-w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
              {i + 1}/{itens.length}
            </span>
            <button type="button" onClick={() => ir(i + 1)} aria-label="Próximo depoimento" className="flex size-11 items-center justify-center rounded-full border border-white/35 transition hover:bg-white hover:text-forest-dark">
              <ArrowRight className="size-5" aria-hidden />
            </button>
            <p className="ml-auto hidden text-xs text-white/55 sm:block">Depoimentos fictícios de demonstração</p>
          </div>
        </div>
        <div className="hidden items-end justify-center bg-amber-soft pt-10 md:flex" aria-hidden>
          <ProductArt kind="sachet" accent="#0B5D4B" id="dep-b" className="h-[85%] w-3/4" />
        </div>
      </div>
    </section>
  );
}
