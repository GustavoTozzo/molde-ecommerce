import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { objetivoPorId } from "@/data/taxonomia";
import type { ArtKind } from "@/lib/art";
import type { ObjetivoId } from "@/lib/types";
import { ProductArt } from "@/components/ui/Art";
import { cn } from "@/lib/utils";

const cards: { objetivo: ObjetivoId; titulo: string; fundo: string; arte: { kind: ArtKind; accent: string } }[] = [
  { objetivo: "sono", titulo: "Noites mais tranquilas começam na rotina", fundo: "bg-mint", arte: { kind: "box", accent: "#0B5D4B" } },
  { objetivo: "beleza", titulo: "Cuidado que vai de dentro para fora", fundo: "bg-amber-soft", arte: { kind: "serum", accent: "#0B5D4B" } },
  { objetivo: "energia", titulo: "Uma rotina de energia simples de manter", fundo: "bg-sky-soft", arte: { kind: "sachet", accent: "#2D8FB3" } },
  { objetivo: "familia", titulo: "Opções para cada idade da família", fundo: "bg-lilac-soft", arte: { kind: "syrup", accent: "#E58A2E" } },
];

export function GradeEditorial() {
  return (
    <section aria-label="Comprar por objetivo" className="wrap">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {cards.map((c) => (
          <Link
            key={c.objetivo}
            href={`/produtos?objetivo=${c.objetivo}`}
            className={cn("group relative grid min-h-60 grid-cols-[1.25fr_1fr] items-center overflow-hidden rounded-panel pl-6 md:min-h-72 md:pl-10", c.fundo)}
          >
            <div className="relative z-10 py-8 pr-2">
              <p className="eyebrow">{objetivoPorId[c.objetivo].rotulo}</p>
              <h3 className="mt-2 font-display text-[1.45rem] leading-tight font-bold text-ink md:text-[1.9rem]">{c.titulo}</h3>
              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-forest-dark shadow-card transition group-hover:bg-forest group-hover:text-white">
                Explorar <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </div>
            <div className="relative h-full">
              <ProductArt
                kind={c.arte.kind}
                accent={c.arte.accent}
                id={`ed-${c.objetivo}`}
                className="absolute right-2 bottom-1 h-[92%] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-2"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
