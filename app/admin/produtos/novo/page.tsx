import type { Metadata } from "next";
import Link from "next/link";
import { ProdutoForm } from "@/components/admin/ProdutoForm";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Novo produto" };

export default async function PaginaNovoProduto() {
  await exigirEquipe("/admin/produtos/novo", ["ADMINISTRADOR"]);
  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/produtos" className="text-sm font-semibold text-forest hover:underline">
          ← Produtos
        </Link>
        <h2 className="mt-2 font-display text-3xl font-bold text-forest-dark">Novo produto</h2>
        <p className="mt-1 text-sm text-muted">A embalagem ilustrada, as cores e o endereço da página saem automaticamente da forma farmacêutica e do nome. Revise o texto com o farmacêutico responsável antes de publicar.</p>
      </div>
      <ProdutoForm />
    </div>
  );
}
