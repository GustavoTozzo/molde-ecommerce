import type { Metadata } from "next";
import { CarrinhoPagina } from "@/components/carrinho/CarrinhoPagina";

export const metadata: Metadata = { title: "Carrinho" };

export default function PaginaCarrinho() {
  return <CarrinhoPagina />;
}
