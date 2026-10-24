import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ContaNav } from "@/components/conta/ContaNav";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";

export const metadata: Metadata = {
  title: { default: "Minha conta", template: "%s · Minha conta" },
  robots: { index: false, follow: false },
};

/**
 * A estrutura é estática; o conteúdo de cada página lê a sessão e fica em <Suspense>.
 * A proteção de verdade está no proxy.ts e em exigirUsuario() dentro de cada página.
 */
export default function LayoutConta({ children }: { children: ReactNode }) {
  return (
    <div className="pb-4">
      <CabecalhoPagina titulo="Minha conta" sobretitulo="Área do cliente" trilha={[{ rotulo: "Minha conta" }]} />
      <div className="wrap mt-6 grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
        <aside>
          <ContaNav />
        </aside>
        <div className="min-w-0">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-panel bg-cream" aria-busy="true" aria-label="Carregando" />}>{children}</Suspense>
        </div>
      </div>
    </div>
  );
}
