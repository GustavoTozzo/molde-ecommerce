"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Especialista } from "@/lib/types";
import { Avatar } from "@/components/ui/Art";
import { cn } from "@/lib/utils";

/** Vitrine de especialistas: foto, depoimento sobre a marca e seletor. */
export function EspecialistaDestaque({ especialistas }: { especialistas: Especialista[] }) {
  const [i, setI] = useState(0);
  const ir = (n: number) => setI((n + especialistas.length) % especialistas.length);
  return (
    <section aria-roledescription="carrossel" aria-label="Especialistas que recomendam a Casa Magistral" className="wrap">
      <div className="rounded-panel bg-mint px-6 py-10 md:px-16 md:py-16">
        <div className="grid">
          {especialistas.map((e, k) => (
            <div
              key={e.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} de ${especialistas.length}`}
              aria-hidden={k !== i}
              inert={k !== i}
              className={cn(
                "col-start-1 row-start-1 grid items-center gap-8 transition-opacity duration-500 md:grid-cols-[auto_1fr] md:gap-16",
                k === i ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <Avatar nome={e.avatar} className="mx-auto size-48 rounded-full shadow-card ring-8 ring-white md:size-64" />
              <div>
                <p className="eyebrow">Conheça quem recomenda a Casa Magistral</p>
                <blockquote className="mt-3 font-display text-2xl leading-snug font-bold text-forest-dark md:text-[2rem]">“{e.citacao}”</blockquote>
                <p className="mt-5 font-bold text-ink">
                  {e.nome} <span className="font-normal text-muted">· {e.titulo}</span>
                </p>
                <p className="text-sm text-muted">{e.registro}</p>
                <Link href={`/especialistas/${e.slug}`} className="mt-5 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-bold text-white transition hover:bg-forest-dark">
                  Ver seleção de {e.nome.split(" ").slice(0, 2).join(" ")}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 md:mt-10">
          <div className="flex items-center gap-2" role="tablist" aria-label="Escolher especialista">
            {especialistas.map((e, k) => (
              <button
                key={e.slug}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={e.nome}
                onClick={() => setI(k)}
                className={cn("size-12 overflow-hidden rounded-full ring-2 transition", k === i ? "ring-forest" : "opacity-60 ring-transparent hover:opacity-100")}
              >
                <Avatar nome={e.avatar} className="size-full" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => ir(i - 1)} aria-label="Especialista anterior" className="flex size-11 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-forest hover:text-white">
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <span className="min-w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
              {i + 1}/{especialistas.length}
            </span>
            <button type="button" onClick={() => ir(i + 1)} aria-label="Próximo especialista" className="flex size-11 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-forest hover:text-white">
              <ArrowRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted">Pessoas e registros profissionais fictícios, apenas para ilustrar o layout. Não use depoimentos de profissionais sem autorização e sem conferir as regras do conselho de classe.</p>
      </div>
    </section>
  );
}
