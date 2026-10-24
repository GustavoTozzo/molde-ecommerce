import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false },
};

async function Estrutura({ children }: { children: ReactNode }) {
  const usuario = await exigirEquipe("/admin");
  return (
    <div className="wrap mt-6 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
      <aside>
        <p className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          {usuario.papel === "ADMINISTRADOR" ? "Administração" : "Equipe farmacêutica"}
        </p>
        <Suspense fallback={<div className="h-12 animate-pulse rounded-full bg-cream lg:h-72 lg:rounded-2xl" aria-hidden />}>
          <AdminNav ehAdmin={usuario.papel === "ADMINISTRADOR"} />
        </Suspense>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A proteção real está no proxy.ts, em exigirEquipe() de cada página e em exigirEquipeNaAcao() de cada ação. */
export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <div className="pb-8">
      <CabecalhoPagina titulo="Painel da loja" sobretitulo="Operação" trilha={[{ rotulo: "Painel" }]} />
      <Suspense fallback={<div className="wrap mt-6"><div className="h-80 animate-pulse rounded-panel bg-cream" aria-busy="true" aria-label="Carregando" /></div>}>
        <Estrutura>{children}</Estrutura>
      </Suspense>
    </div>
  );
}
