"use client";

import { useId, useMemo, useState } from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { distribuicaoNotas } from "@/lib/avaliacoes";
import { formatarNota } from "@/lib/format";
import type { Avaliacao, ProdutoResumo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Estrelas } from "@/components/ui/Estrelas";
import { Botao } from "@/components/ui/Button";

export function AvaliacoesProduto({ produto, avaliacoes }: { produto: ProdutoResumo; avaliacoes: Avaliacao[] }) {
  const uid = useId();
  const [ordem, setOrdem] = useState<"recentes" | "uteis">("recentes");
  const [mostrar, setMostrar] = useState(3);
  const [votados, setVotados] = useState<string[]>([]);
  const todas = avaliacoes;
  const dist = distribuicaoNotas(produto.nota);
  const lista = useMemo(() => {
    const copia = [...todas];
    return ordem === "uteis" ? copia.sort((a, b) => b.util - a.util) : copia;
  }, [todas, ordem]);

  return (
    <section id="avaliacoes" aria-labelledby={`${uid}-t`} className="scroll-mt-40">
      <h2 id={`${uid}-t`} className="font-display text-3xl font-bold text-forest-dark md:text-4xl">
        Avaliações de clientes
      </h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[18rem_1fr] md:gap-14">
        <div>
          <p className="flex items-baseline gap-2">
            <strong className="font-display text-6xl font-extrabold text-ink">{formatarNota(produto.nota)}</strong>
            <span className="text-muted">/ 5</span>
          </p>
          <Estrelas nota={produto.nota} tamanho="size-6" className="mt-1" />
          <p className="mt-1 text-sm text-muted">{produto.avaliacoes} avaliações</p>
          <ul className="mt-5 space-y-2" aria-label="Distribuição das notas">
            {dist.map((pct, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="w-9 shrink-0 font-semibold">{5 - i} ★</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream">
                  <span className="block h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-10 text-right text-muted tabular-nums">{pct}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl bg-mint p-3 text-sm font-semibold text-forest-dark">{Math.round(dist[0] + dist[1] * 0.8)}% dos clientes recomendam este produto</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted">Avaliações fictícias de demonstração, sem alegações de resultado.</p>
            <div className="flex items-center gap-2">
              <label htmlFor={`${uid}-o`} className="text-sm font-semibold">
                Ordenar por
              </label>
              <select id={`${uid}-o`} value={ordem} onChange={(e) => setOrdem(e.target.value as "recentes" | "uteis")} className="rounded-full border border-line bg-white py-2 pr-9 pl-4 text-sm font-semibold">
                <option value="recentes">Mais recentes</option>
                <option value="uteis">Mais úteis</option>
              </select>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {lista.slice(0, mostrar).map((a) => {
              const votou = votados.includes(a.nome + a.data);
              return (
                <li key={a.nome + a.data} className="py-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex size-10 items-center justify-center rounded-full bg-mint font-bold text-forest-dark" aria-hidden>
                      {a.nome[0]}
                    </span>
                    <div>
                      <p className="font-bold">{a.nome}</p>
                      <p className="flex items-center gap-1 text-xs text-forest">
                        <BadgeCheck className="size-3.5" aria-hidden /> Compra verificada (exemplo)
                      </p>
                    </div>
                    <time className="ml-auto text-sm text-muted">{a.data}</time>
                  </div>
                  <Estrelas nota={a.nota} className="mt-3" />
                  <h3 className="mt-2 font-sans text-base font-bold">{a.titulo}</h3>
                  <p className="mt-1 text-muted">{a.texto}</p>
                  <button
                    type="button"
                    aria-pressed={votou}
                    onClick={() => setVotados((v) => (votou ? v.filter((x) => x !== a.nome + a.data) : [...v, a.nome + a.data]))}
                    className={cn("mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition", votou ? "border-forest bg-mint text-forest-dark" : "border-line hover:bg-cream")}
                  >
                    <ThumbsUp className="size-4" aria-hidden /> Útil ({a.util + (votou ? 1 : 0)})
                  </button>
                </li>
              );
            })}
          </ul>
          {mostrar < lista.length && (
            <Botao variante="contorno" tamanho="m" onClick={() => setMostrar(lista.length)} className="mt-2">
              Carregar mais avaliações
            </Botao>
          )}
        </div>
      </div>
    </section>
  );
}
