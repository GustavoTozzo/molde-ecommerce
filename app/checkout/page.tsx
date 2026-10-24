import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/carrinho/CheckoutForm";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { prisma } from "@/server/prisma";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

async function Conteudo() {
  const usuario = await exigirUsuario("/checkout");
  const enderecos = await prisma.endereco.findMany({
    where: { usuarioId: usuario.id },
    orderBy: [{ principal: "desc" }, { criadoEm: "asc" }],
  });
  return <CheckoutForm enderecos={enderecos} />;
}

export default function PaginaCheckout() {
  return (
    <div className="pb-8">
      <CabecalhoPagina titulo="Finalizar compra" sobretitulo="Checkout" trilha={[{ rotulo: "Carrinho", href: "/carrinho" }, { rotulo: "Finalizar compra" }]} />
      <div className="wrap">
        <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-panel bg-cream" aria-busy="true" aria-label="Carregando" />}>
          <Conteudo />
        </Suspense>
      </div>
    </div>
  );
}
