import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Selo as SeloId } from "@/lib/types";

type Tom = "destaque" | "ambar" | "menta" | "verde" | "claro";

const tons: Record<Tom, string> = {
  destaque: "bg-coral text-white",
  ambar: "bg-amber text-ink",
  menta: "bg-mint text-forest-dark",
  verde: "bg-forest text-white",
  claro: "bg-white text-ink ring-1 ring-line",
};

export function Selo({ tom = "menta", children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold leading-none", tons[tom], className)}>
      {children}
    </span>
  );
}

export const seloVisual: Record<SeloId, { rotulo: string; tom: Tom }> = {
  "mais-vendido": { rotulo: "Mais vendido", tom: "destaque" },
  lancamento: { rotulo: "Lançamento", tom: "verde" },
  oferta: { rotulo: "Oferta", tom: "ambar" },
  kit: { rotulo: "Kit", tom: "claro" },
};
