import type { Metadata } from "next";
import { CupomNovoForm } from "@/components/admin/OutrosFormularios";
import { Botao } from "@/components/ui/Button";
import { formatarDataHora } from "@/lib/format";
import { alternarCupom } from "@/server/acoes/admin-catalogo";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Cupons" };

export default async function PaginaCupons() {
  await exigirEquipe("/admin/cupons", ["ADMINISTRADOR"]);
  const cupons = await prisma.cupom.findMany({ orderBy: [{ ativo: "desc" }, { criadoEm: "desc" }] });
  return (
    <div className="grid gap-8">
      <section aria-labelledby="cup-titulo">
        <h2 id="cup-titulo" className="font-display text-3xl font-bold text-forest-dark">
          Cupons
        </h2>
        {cupons.length === 0 ? (
          <p className="mt-4 rounded-card bg-cream p-5 text-muted">Nenhum cupom cadastrado.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white">
            {cupons.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span>
                  <strong className="font-mono">{c.codigo}</strong>{" "}
                  <span className="text-muted">
                    · {c.tipo === "FRETE_GRATIS" ? "frete grátis" : `${c.percentual}% de desconto`} · {c.usos}
                    {c.usosMax ? ` de ${c.usosMax}` : ""} {c.usos === 1 ? "uso" : "usos"}
                    {c.validoAte ? ` · até ${formatarDataHora(c.validoAte).split(" ")[0]}` : ""}
                  </span>
                </span>
                <form action={alternarCupom.bind(null, c.id)} className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.ativo ? "bg-mint text-forest-dark" : "bg-cream text-muted"}`}>{c.ativo ? "Ativo" : "Desativado"}</span>
                  <Botao type="submit" variante="claro" tamanho="p">
                    {c.ativo ? "Desativar" : "Ativar"}
                  </Botao>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="cup-novo">
        <h2 id="cup-novo" className="mb-4 font-display text-2xl font-bold text-forest-dark">
          Novo cupom
        </h2>
        <CupomNovoForm />
      </section>
    </div>
  );
}
