import type { Metadata } from "next";
import { CheckoutDemo } from "@/components/carrinho/CheckoutDemo";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function PaginaCheckout() {
  return <CheckoutDemo />;
}
