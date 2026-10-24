import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "contorno" | "ambar" | "claro" | "fantasma";
type Tamanho = "m" | "l" | "p";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-[background-color,color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] select-none";

const variantes: Record<Variante, string> = {
  primario: "bg-forest text-white hover:bg-forest-dark",
  secundario: "bg-mint text-forest-dark hover:bg-mint-deep",
  contorno: "border-2 border-forest text-forest hover:bg-forest hover:text-white",
  ambar: "bg-amber text-ink hover:bg-[#e8962a]",
  claro: "bg-white text-forest-dark border border-line hover:bg-cream",
  fantasma: "text-forest hover:bg-mint",
};

const tamanhos: Record<Tamanho, string> = {
  p: "px-4 py-2 text-sm",
  m: "px-6 py-3 text-sm",
  l: "px-8 py-4 text-base",
};

export function classesBotao(variante: Variante = "primario", tamanho: Tamanho = "m", extra?: string) {
  return cn(base, variantes[variante], tamanhos[tamanho], extra);
}

type BotaoProps = ComponentProps<"button"> & { variante?: Variante; tamanho?: Tamanho; children: ReactNode };

export function Botao({ variante, tamanho, className, children, type = "button", ...rest }: BotaoProps) {
  return (
    <button type={type} className={classesBotao(variante, tamanho, className)} {...rest}>
      {children}
    </button>
  );
}

type LinkBotaoProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variante?: Variante;
  tamanho?: Tamanho;
  className?: string;
};

export function LinkBotao({ variante, tamanho, className, children, ...rest }: LinkBotaoProps) {
  return (
    <Link className={classesBotao(variante, tamanho, className)} {...rest}>
      {children}
    </Link>
  );
}
