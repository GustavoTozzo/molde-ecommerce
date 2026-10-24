import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EntrarForm } from "@/components/conta/EntrarForm";
import { usuarioAtual } from "@/server/sessao";

export const metadata: Metadata = { title: "Entrar ou cadastrar-se" };

/** Quem já está logado não precisa ver o formulário. Fica em Suspense para a página seguir estática. */
async function SeJaLogado() {
  if (await usuarioAtual()) redirect("/conta");
  return null;
}

export default function PaginaEntrar() {
  return (
    <div className="wrap py-10 md:py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-center font-display text-4xl font-extrabold text-forest-dark">Acesse sua conta</h1>
        <Suspense>
          <SeJaLogado />
        </Suspense>
        <Suspense>
          <EntrarForm />
        </Suspense>
      </div>
    </div>
  );
}
