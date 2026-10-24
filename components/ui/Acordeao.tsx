"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemAcordeao {
  id: string;
  titulo: string;
  conteudo: ReactNode;
}

/** Acordeão acessível (botão + região), com altura animada por grid. */
export function Acordeao({
  itens,
  abertoInicial,
  multiplo = false,
  className,
}: {
  itens: ItemAcordeao[];
  abertoInicial?: string;
  multiplo?: boolean;
  className?: string;
}) {
  const base = useId();
  const [abertos, setAbertos] = useState<string[]>(abertoInicial ? [abertoInicial] : []);

  function alternar(id: string) {
    setAbertos((atual) => {
      const aberto = atual.includes(id);
      if (multiplo) return aberto ? atual.filter((x) => x !== id) : [...atual, id];
      return aberto ? [] : [id];
    });
  }

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {itens.map((item) => {
        const aberto = abertos.includes(item.id);
        const idBotao = `${base}-b-${item.id}`;
        const idPainel = `${base}-p-${item.id}`;
        return (
          <div key={item.id}>
            <h3 className="font-sans text-base">
              <button
                id={idBotao}
                type="button"
                aria-expanded={aberto}
                aria-controls={idPainel}
                onClick={() => alternar(item.id)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-bold text-ink transition hover:text-forest"
              >
                {item.titulo}
                <ChevronDown className={cn("size-5 shrink-0 text-forest transition-transform duration-300", aberto && "rotate-180")} aria-hidden />
              </button>
            </h3>
            <div
              id={idPainel}
              role="region"
              aria-labelledby={idBotao}
              className={cn("grid transition-[grid-template-rows] duration-300 ease-out", aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <div className="pb-6 text-base leading-relaxed text-muted">{item.conteudo}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
