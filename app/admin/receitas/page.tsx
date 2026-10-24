import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RecusarForm } from "@/components/admin/Formularios";
import { Botao } from "@/components/ui/Button";
import { formatarDataHora } from "@/lib/format";
import { rotuloStatusPedido, rotuloStatusReceita } from "@/lib/pedidos";
import { aprovarReceita } from "@/server/acoes/admin-pedidos";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Receitas" };

export default async function PaginaReceitas() {
  await exigirEquipe("/admin/receitas");
  const [pendentes, revisadas] = await Promise.all([
    prisma.receita.findMany({
      where: { status: "PENDENTE" },
      orderBy: { criadoEm: "asc" },
      select: {
        id: true,
        nomeArquivo: true,
        tamanhoBytes: true,
        criadoEm: true,
        usuario: { select: { nome: true, email: true } },
        pedidos: { select: { id: true, numero: true, status: true, itens: { select: { nome: true, qtd: true } } } },
      },
    }),
    prisma.receita.findMany({
      where: { status: { not: "PENDENTE" } },
      orderBy: { revisadaEm: "desc" },
      take: 15,
      select: { id: true, status: true, nomeArquivo: true, observacao: true, revisadaEm: true, usuario: { select: { nome: true } }, revisadaPor: { select: { nome: true } }, pedidos: { select: { id: true, numero: true } } },
    }),
  ]);

  return (
    <div className="grid gap-10">
      <section aria-labelledby="pend-titulo">
        <h2 id="pend-titulo" className="font-display text-3xl font-bold text-forest-dark">
          Receitas para conferir
        </h2>
        <p className="mt-1 text-sm text-muted">Mais antigas primeiro. Abra o arquivo, confira dados do prescritor, medicamento e validade, e aprove ou recuse com motivo.</p>
        {pendentes.length === 0 ? (
          <p className="mt-5 rounded-card bg-cream p-6 text-muted">Nenhuma receita aguardando conferência.</p>
        ) : (
          <ul className="mt-5 grid gap-4">
            {pendentes.map((r) => (
              <li key={r.id} className="rounded-card border border-amber bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {r.usuario.nome} <span className="font-normal text-muted">· {r.usuario.email}</span>
                    </p>
                    <p className="text-xs text-muted">
                      Enviada em {formatarDataHora(r.criadoEm)} · {Math.max(1, Math.round(r.tamanhoBytes / 1024))} KB
                    </p>
                  </div>
                  <a href={`/api/receitas/${r.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-sm font-bold text-forest-dark hover:bg-mint-deep">
                    Abrir {r.nomeArquivo} <ExternalLink className="size-4" aria-hidden />
                  </a>
                </div>
                {r.pedidos.map((p) => (
                  <p key={p.id} className="mt-3 text-sm">
                    <Link href={`/admin/pedidos/${p.id}`} className="font-bold text-forest underline">
                      Pedido nº {p.numero}
                    </Link>{" "}
                    <span className="text-muted">({rotuloStatusPedido[p.status]})</span>: {p.itens.map((i) => `${i.qtd}× ${i.nome}`).join(", ")}
                  </p>
                ))}
                <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-2">
                  <form action={aprovarReceita.bind(null, r.id)} className="flex items-start">
                    <Botao type="submit" variante="primario" tamanho="m">
                      Aprovar receita
                    </Botao>
                  </form>
                  <RecusarForm receitaId={r.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hist-titulo">
        <h2 id="hist-titulo" className="font-display text-2xl font-bold text-forest-dark">
          Conferidas recentemente
        </h2>
        {revisadas.length === 0 ? (
          <p className="mt-4 rounded-card bg-cream p-5 text-sm text-muted">Nada conferido ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white">
            {revisadas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4 text-sm">
                <span>
                  <strong>{r.usuario.nome}</strong> · {r.pedidos.map((p) => `pedido nº ${p.numero}`).join(", ") || "sem pedido"}
                  {r.observacao && <span className="block text-muted">Motivo: {r.observacao}</span>}
                </span>
                <span className="text-right text-xs text-muted">
                  <span className={`rounded-full px-2.5 py-1 font-bold ${r.status === "APROVADA" ? "bg-mint text-forest-dark" : "bg-coral-soft text-ink"}`}>{rotuloStatusReceita[r.status]}</span>
                  <span className="block">
                    {r.revisadaPor?.nome ?? "—"}
                    {r.revisadaEm ? ` · ${formatarDataHora(r.revisadaEm)}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
