import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, StatusPedido } from "@prisma/client";
import { formatBRL, formatarDataHora } from "@/lib/format";
import { rotuloStatusPedido } from "@/lib/pedidos";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Pedidos" };

const POR_PAGINA = 20;
const STATUS = Object.keys(rotuloStatusPedido) as StatusPedido[];

export default async function PaginaPedidosAdmin(props: PageProps<"/admin/pedidos">) {
  await exigirEquipe("/admin/pedidos");
  const sp = await props.searchParams;
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = STATUS.find((s) => s === um(sp.status));
  const q = (um(sp.q) ?? "").trim().slice(0, 60);
  const pagina = Math.max(1, Number.parseInt(um(sp.pagina) ?? "1", 10) || 1);

  const numero = /^\d{1,9}$/.test(q.replace(/^#/, "")) ? Number(q.replace(/^#/, "")) : null;
  const where: Prisma.PedidoWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [...(numero !== null ? [{ numero }] : []), { usuario: { email: { contains: q, mode: "insensitive" as const } } }, { usuario: { nome: { contains: q, mode: "insensitive" as const } } }],
    }),
  };

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { id: true, numero: true, status: true, total: true, criadoEm: true, receita: { select: { status: true } }, usuario: { select: { nome: true, email: true } } },
    }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const href = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined) p.delete(k);
      else p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `/admin/pedidos?${s}` : "/admin/pedidos";
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-forest-dark">Pedidos</h2>

      <nav aria-label="Filtrar por situação" className="mt-4 flex flex-wrap gap-2">
        <Link href={href({ status: undefined, pagina: undefined })} className={cn("rounded-full px-4 py-2 text-sm font-bold", !status ? "bg-forest-dark text-white" : "bg-cream hover:bg-mint")}>
          Todos
        </Link>
        {STATUS.map((s) => (
          <Link key={s} href={href({ status: s, pagina: undefined })} aria-current={status === s ? "true" : undefined} className={cn("rounded-full px-4 py-2 text-sm font-bold", status === s ? "bg-forest-dark text-white" : "bg-cream hover:bg-mint")}>
            {rotuloStatusPedido[s]}
          </Link>
        ))}
      </nav>

      <form action="/admin/pedidos" className="mt-4 flex max-w-md gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="busca-pedido" className="sr-only">
          Buscar por número, nome ou e-mail
        </label>
        <input id="busca-pedido" name="q" defaultValue={q} placeholder="Nº do pedido, nome ou e-mail" className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm" />
        <button type="submit" className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-dark">
          Buscar
        </button>
      </form>

      {pedidos.length === 0 ? (
        <p className="mt-6 rounded-card bg-cream p-6 text-muted">Nenhum pedido encontrado com esses filtros.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Pedidos, do mais recente para o mais antigo</caption>
            <thead className="bg-cream text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">Pedido</th>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Situação</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-mint/30">
                  <th scope="row" className="px-4 py-3 font-bold">
                    <Link href={`/admin/pedidos/${p.id}`} className="text-forest underline underline-offset-2">
                      nº {p.numero}
                    </Link>
                  </th>
                  <td className="px-4 py-3">
                    {p.usuario.nome}
                    <span className="block text-xs text-muted">{p.usuario.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-forest-dark">{rotuloStatusPedido[p.status]}</span>
                    {p.receita?.status === "PENDENTE" && <span className="ml-1.5 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-bold">receita pendente</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatBRL(p.total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatarDataHora(p.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Paginação" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            Página {pagina} de {paginas} · {total} pedidos
          </span>
          <span className="flex gap-2">
            {pagina > 1 && (
              <Link href={href({ pagina: pagina - 1 })} className="rounded-full bg-cream px-4 py-2 font-bold hover:bg-mint">
                ← Anterior
              </Link>
            )}
            {pagina < paginas && (
              <Link href={href({ pagina: pagina + 1 })} className="rounded-full bg-cream px-4 py-2 font-bold hover:bg-mint">
                Próxima →
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
