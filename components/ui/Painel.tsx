"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Gaveta/modal acessível: trava a rolagem, prende o foco, fecha com Esc ou
 * clique no fundo e devolve o foco ao elemento que abriu.
 */
export function Painel({
  aberto,
  aoFechar,
  rotulo,
  lado = "direita",
  children,
  className,
}: {
  aberto: boolean;
  aoFechar: () => void;
  rotulo: string;
  lado?: "direita" | "esquerda" | "centro";
  children: ReactNode;
  className?: string;
}) {
  const painelRef = useRef<HTMLDivElement>(null);
  const aoFecharRef = useRef(aoFechar);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const painel = painelRef.current;
    const inicial = painel?.querySelector<HTMLElement>("[data-autofocus]") ?? painel;
    inicial?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFecharRef.current();
        return;
      }
      if (e.key !== "Tab" || !painel) return;
      const itens = Array.from(painel.querySelectorAll<HTMLElement>(FOCAVEIS)).filter((el) => el.offsetParent !== null);
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto || typeof document === "undefined") return null;

  const posicao =
    lado === "direita"
      ? "right-0 top-0 h-full w-[min(26rem,100vw)] animate-drawer-right"
      : lado === "esquerda"
        ? "left-0 top-0 h-full w-[min(22rem,92vw)] animate-drawer-left"
        : "left-1/2 top-1/2 max-h-[90vh] w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-card animate-pop-in";

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={aoFechar} aria-hidden />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
        tabIndex={-1}
        className={cn("absolute flex flex-col overflow-hidden bg-paper shadow-pop outline-none", posicao, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
