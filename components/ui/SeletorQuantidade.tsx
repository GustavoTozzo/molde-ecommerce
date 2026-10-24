"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function SeletorQuantidade({
  valor,
  aoMudar,
  min = 1,
  max = 20,
  rotulo = "Quantidade",
  className,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  rotulo?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-white", className)} role="group" aria-label={rotulo}>
      <button
        type="button"
        onClick={() => aoMudar(valor - 1)}
        disabled={valor <= min}
        aria-label="Diminuir quantidade"
        className="inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-mint disabled:opacity-35"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-8 text-center text-base font-bold tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        onClick={() => aoMudar(valor + 1)}
        disabled={valor >= max}
        aria-label="Aumentar quantidade"
        className="inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-mint disabled:opacity-35"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
