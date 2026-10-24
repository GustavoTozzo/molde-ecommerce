import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EstoqueRapido } from "@/components/admin/ProdutoForm";
import { LinkBotao } from "@/components/ui/Button";
import { formaPorId } from "@/data/taxonomia";
import { formatBRL } from "@/lib/format";
import type { FormaId } from "@/lib/types";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Produtos e estoque" };

export default async function PaginaProdutosAdmin() {
  await exigirEquipe("/admin/produtos", ["ADMINISTRADOR"]);
  const produtos = await prisma.produto.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, forma: true, ativo: true, receita: true, tamanhos: { orderBy: { ordem: "asc" }, select: { id: true, rotulo: true, preco: true, estoque: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-bold text-forest-dark">Produtos e estoque</h2>
        <LinkBotao href="/admin/produtos/novo" variante="primario" tamanho="m">
          <Plus className="size-4" aria-hidden /> Novo produto
        </LinkBotao>
      </div>
      <p className="mt-1 text-sm text-muted">{produtos.length} produtos. Alterações aparecem na vitrine na hora.</p>
      <ul className="mt-6 grid gap-4">
        {produtos.map((p) => (
          <li key={p.id} className="rounded-card border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/admin/produtos/${p.id}`} className="font-bold text-forest underline underline-offset-2">
                  {p.nome}
                </Link>
                <p className="text-xs text-muted">
                  {formaPorId[p.forma as FormaId]?.rotulo ?? p.forma}
                  {p.receita ? " · sob receita" : ""}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.ativo ? "bg-mint text-forest-dark" : "bg-cream text-muted"}`}>{p.ativo ? "Na loja" : "Oculto"}</span>
            </div>
            <ul className="mt-3 grid gap-2">
              {p.tamanhos.map((t) => (
                <li key={t.id} className="grid items-center gap-2 sm:grid-cols-[1fr_6rem_auto]">
                  <span className="hidden sm:block" />
                  <span className="text-sm font-semibold tabular-nums sm:text-right">{formatBRL(t.preco)}</span>
                  <EstoqueRapido tamanhoId={t.id} estoque={t.estoque} rotulo={t.rotulo} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
