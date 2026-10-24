import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogoView } from "@/components/catalogo/CatalogoView";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Cápsulas, sachês, gotas, cremes, xaropes e kits manipulados. Filtre por forma, objetivo e preço.",
};

function CatalogoEsqueleto() {
  return (
    <div className="wrap pt-10" aria-hidden>
      <div className="h-10 w-72 rounded-full bg-cream" />
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-square rounded-card bg-cream" />
        ))}
      </div>
    </div>
  );
}

export default function PaginaProdutos() {
  return (
    <Suspense fallback={<CatalogoEsqueleto />}>
      <CatalogoView />
    </Suspense>
  );
}
