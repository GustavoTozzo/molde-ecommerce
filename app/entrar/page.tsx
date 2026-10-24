import type { Metadata } from "next";
import { EntrarForm } from "@/components/conta/EntrarForm";

export const metadata: Metadata = { title: "Entrar ou cadastrar-se" };

export default function PaginaEntrar() {
  return (
    <div className="wrap py-10 md:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center font-display text-4xl font-extrabold text-forest-dark">Acesse sua conta</h1>
        <EntrarForm />
      </div>
    </div>
  );
}
