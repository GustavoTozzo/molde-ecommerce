import { Star } from "lucide-react";
import { formatarNota } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Nota com estrelas preenchidas proporcionalmente (ex.: 4,7 → 4 cheias + 70% da quinta). */
export function Estrelas({ nota, tamanho = "size-4", className }: { nota: number; tamanho?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Nota ${formatarNota(nota)} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const cheia = Math.max(0, Math.min(1, nota - i));
        return (
          <span key={i} className={cn("relative inline-block", tamanho)} aria-hidden>
            <Star className={cn("absolute inset-0 text-line", tamanho)} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${cheia * 100}%` }}>
              <Star className={cn("text-amber", tamanho)} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function NotaResumida({ nota, avaliacoes }: { nota: number; avaliacoes: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Star className="size-4 text-amber" fill="currentColor" strokeWidth={0} aria-hidden />
      <span className="font-bold text-ink">{formatarNota(nota)}</span>
      <span className="text-muted">({avaliacoes})</span>
    </span>
  );
}
