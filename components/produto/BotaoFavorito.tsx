"use client";

import { Heart } from "lucide-react";
import { alternarFavorito, useEhFavorito } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BotaoFavorito({ slug, nome, className }: { slug: string; nome: string; className?: string }) {
  const favorito = useEhFavorito(slug);
  return (
    <button
      type="button"
      onClick={() => alternarFavorito({ slug, nome })}
      aria-pressed={favorito}
      aria-label={favorito ? `Remover ${nome} dos favoritos` : `Salvar ${nome} nos favoritos`}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card transition hover:scale-105 active:scale-95",
        className,
      )}
    >
      <Heart className={cn("size-5 transition", favorito && "fill-coral text-coral")} aria-hidden />
    </button>
  );
}
