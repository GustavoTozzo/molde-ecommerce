"use client";

import { CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";

/** Aviso temporário (toast) anunciado a leitores de tela. */
export function Aviso() {
  const aviso = useStore((s) => s.aviso);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4 sm:bottom-6" role="status" aria-live="polite">
      {aviso && (
        <div
          key={aviso.id}
          className="pointer-events-auto flex max-w-md animate-toast-in items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-pop"
        >
          <CheckCircle2 className="size-5 shrink-0 text-amber" aria-hidden />
          <span>{aviso.mensagem}</span>
        </div>
      )}
    </div>
  );
}
