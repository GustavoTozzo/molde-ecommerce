import type { Metadata } from "next";
import { Package } from "lucide-react";
import { formatBRL, formatarData } from "@/lib/format";
import { rotuloStatusPedido } from "@/lib/pedidos";
import { LinkBotao } from "@/components/ui/Button";
import { prisma } from "@/server/prisma";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function PaginaPedidos() {
  const usuario = await exigirUsuario("/conta/pedidos");
  const pedidos = await prisma.pedido.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { criadoEm: "desc" },
    take: 30,
    select: { id: true, numero: true, status: true, total: true, criadoEm: true, itens: { select: { nome: true, qtd: true } } },
  });

  return (
    <section aria-labelledby="ped-titulo">
      <h2 id="ped-titulo" className="mb-5 font-display text-2xl font-bold text-forest-dark">
        Meus pedidos
      </h2>
      {pedidos.length === 0 ? (
        <div className="rounded-panel bg-cream px-6 py-16 text-center">
          <Package className="mx-auto size-14 text-forest" strokeWidth={1.4} aria-hidden />
          <h3 className="mt-4 font-display text-2xl font-bold">Você ainda não fez nenhum pedido</h3>
          <p className="mx-auto mt-2 max-w-md text-muted">Quando você comprar, o acompanhamento aparece aqui.</p>
          <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-6">
            Explorar produtos
          </LinkBotao>
        </div>
      ) : (
        <ul className="grid gap-4">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-card border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">Pedido nº {p.numero}</p>
                <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest-dark">{rotuloStatusPedido[p.status]}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatarData(p.criadoEm)} · {p.itens.reduce((acc, i) => acc + i.qtd, 0)} {p.itens.reduce((acc, i) => acc + i.qtd, 0) === 1 ? "item" : "itens"} · {formatBRL(p.total)}
              </p>
              <p className="mt-2 line-clamp-1 text-sm">{p.itens.map((i) => i.nome).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
