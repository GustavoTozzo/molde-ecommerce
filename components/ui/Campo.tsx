import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const classeEntrada =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base aria-[invalid=true]:border-coral disabled:bg-cream";

interface CampoProps extends Omit<ComponentProps<"input">, "id"> {
  id: string;
  rotulo: ReactNode;
  erro?: string;
  dica?: string;
}

/** Campo de formulário com rótulo, dica e mensagem de erro ligados por aria. */
export function Campo({ id, rotulo, erro, dica, className, ...entrada }: CampoProps) {
  const descricao = [erro && `${id}-erro`, dica && !erro && `${id}-dica`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {rotulo}
      </label>
      <input id={id} aria-invalid={erro ? true : undefined} aria-describedby={descricao} className={cn(classeEntrada, className)} {...entrada} />
      {dica && !erro && (
        <p id={`${id}-dica`} className="mt-1 text-xs text-muted">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Faixa de mensagem geral de um formulário (erro ou sucesso). */
export function FaixaMensagem({ tipo, children }: { tipo: "erro" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cn("rounded-2xl border-l-4 px-4 py-3 text-sm font-semibold text-ink", tipo === "erro" ? "border-coral bg-coral-soft" : "border-forest bg-mint")}
    >
      {children}
    </p>
  );
}
