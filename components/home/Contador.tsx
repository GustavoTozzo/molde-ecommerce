"use client";

import { useEffect, useRef, useState } from "react";

/** Número que "sobe" quando entra na tela (respeita prefers-reduced-motion). */
export function Contador({ alvo, sufixo = "", className }: { alvo: number; sufixo?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        io.disconnect();
        if (reduz) {
          setValor(alvo);
          return;
        }
        const inicio = performance.now();
        const duracao = 1400;
        const passo = (agora: number) => {
          const t = Math.min(1, (agora - inicio) / duracao);
          setValor(Math.round(alvo * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [alvo]);

  return (
    <span ref={ref} className={className}>
      {/* aria-label em <span> sem papel é proibido: o valor final vai como texto só para leitor de tela */}
      <span className="sr-only">
        {alvo.toLocaleString("pt-BR")}
        {sufixo}
      </span>
      <span aria-hidden>
        {valor.toLocaleString("pt-BR")}
        {sufixo}
      </span>
    </span>
  );
}
