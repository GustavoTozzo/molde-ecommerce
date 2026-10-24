import Link from "next/link";
import { formas, fundoClasse } from "@/data/taxonomia";
import { ProductArt } from "@/components/ui/Art";
import { cn } from "@/lib/utils";

export function CategoriasCirculares() {
  return (
    <nav aria-label="Comprar por forma farmacêutica" className="wrap pt-10 md:pt-14">
      <ul className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:px-0">
        {formas.map((f) => (
          <li key={f.id} className="shrink-0 md:shrink">
            <Link href={`/produtos?forma=${f.id}`} className="group flex w-28 flex-col items-center gap-3 md:w-auto">
              <span
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-full p-[14%] transition duration-300 group-hover:scale-105 group-hover:shadow-card",
                  fundoClasse[f.fundo],
                )}
              >
                <ProductArt kind={f.art} accent={f.accent} id={`cat-${f.id}`} className="h-full w-full" />
              </span>
              <span className="text-center text-sm font-bold text-ink group-hover:text-forest md:text-base">{f.rotulo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
