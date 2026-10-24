import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProdutoForm } from "@/components/admin/ProdutoForm";
import { centavosParaCampo } from "@/lib/format";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Editar produto" };

export default async function PaginaEditarProduto(props: PageProps<"/admin/produtos/[id]">) {
  const { id } = await props.params;
  const { criado } = await props.searchParams;
  await exigirEquipe(`/admin/produtos/${id}`, ["ADMINISTRADOR"]);
  const p = await prisma.produto.findUnique({ where: { id }, include: { tamanhos: { orderBy: { ordem: "asc" } } } });
  if (!p) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/produtos" className="text-sm font-semibold text-forest hover:underline">
          ← Produtos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold text-forest-dark">{p.nome}</h2>
          {p.ativo && (
            <Link href={`/produtos/${p.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-bold text-forest underline">
              Ver na loja <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        {criado && <p role="status" className="mt-3 rounded-2xl bg-mint p-4 text-sm font-semibold">Produto cadastrado e já disponível na loja.</p>}
      </div>
      <ProdutoForm
        produto={{
          id: p.id,
          nome: p.nome,
          subtitulo: p.subtitulo,
          forma: p.forma,
          objetivos: p.objetivos,
          selos: p.selos,
          sabores: p.sabores,
          receita: p.receita,
          ativo: p.ativo,
          descricao: p.descricao,
          comoUsar: p.comoUsar,
          ingredientes: p.ingredientes,
          porcao: p.porcao,
          tabela: p.tabela as { item: string; qtd: string; vd?: string }[],
          tamanhos: p.tamanhos.map((t) => ({ id: t.id, codigo: t.codigo, rotulo: t.rotulo, preco: centavosParaCampo(t.preco), precoDe: t.precoDe ? centavosParaCampo(t.precoDe) : "", estoque: t.estoque })),
        }}
      />
    </div>
  );
}
