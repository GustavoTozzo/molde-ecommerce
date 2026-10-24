"use client";

import { useEffect, useState } from "react";
import { Repeat, ShieldCheck, Tag, Truck } from "lucide-react";
import { beneficiosTopo } from "@/lib/site";

const icones = { tag: Tag, truck: Truck, shield: ShieldCheck, repeat: Repeat } as const;

/** Barra de benefícios: 4 itens no desktop, 1 item rotativo no mobile. */
export function BarraAvisos() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % beneficiosTopo.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-forest-dark text-white">
      <div className="wrap hidden items-center justify-between py-2.5 text-xs font-medium md:flex">
        {beneficiosTopo.map(({ icone, texto }) => {
          const Icone = icones[icone];
          return (
            <p key={texto} className="flex items-center gap-2">
              <Icone className="size-4 text-amber" aria-hidden />
              {texto}
            </p>
          );
        })}
      </div>
      <div className="wrap py-2 text-center text-xs font-medium md:hidden">
        {(() => {
          const { icone, texto } = beneficiosTopo[indice];
          const Icone = icones[icone];
          return (
            <p key={texto} className="flex animate-fade-in items-center justify-center gap-2">
              <Icone className="size-4 shrink-0 text-amber" aria-hidden />
              {texto}
            </p>
          );
        })()}
      </div>
    </div>
  );
}
