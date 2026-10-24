"use client";

import Link from "next/link";
import { useId } from "react";
import { Repeat, Trash2 } from "lucide-react";
import { fundoClasse } from "@/data/taxonomia";
import { rotuloFrequencia, type Frequencia, type LinhaCarrinho as Linha } from "@/lib/carrinho";
import { formatBRL } from "@/lib/format";
import { alterarFrequencia, alterarQuantidade, removerDoCarrinho } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ProductArt } from "@/components/ui/Art";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";

export function LinhaCarrinho({ linha, aoNavegar }: { linha: Linha; aoNavegar?: () => void }) {
  const uid = useId();
  const { item, produto, tamanho, unitario, total } = linha;
  const assinatura = item.frequencia !== "unica";
  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/produtos/${produto.slug}`}
        onClick={aoNavegar}
        className={cn("block size-24 shrink-0 overflow-hidden rounded-2xl p-2", fundoClasse[produto.fundo])}
        aria-label={`Ver ${produto.nome}`}
        tabIndex={-1}
      >
        <ProductArt kind={produto.art.kind} accent={produto.art.accent} id={`${item.key}${uid}`} className="h-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produtos/${produto.slug}`} onClick={aoNavegar} className="block text-base leading-snug font-bold hover:text-forest hover:underline">
              {produto.nome}
            </Link>
            <p className="mt-0.5 text-sm text-muted">
              {tamanho.rotulo}
              {item.sabor ? ` · ${item.sabor}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removerDoCarrinho(item.key)}
            aria-label={`Remover ${produto.nome} do carrinho`}
            className="rounded-full p-2 text-muted transition hover:bg-coral-soft hover:text-coral"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>

        <label className="mt-2 flex items-center gap-2 text-sm text-forest-dark">
          <Repeat className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">Frequência de entrega de {produto.nome}</span>
          <select
            value={item.frequencia}
            onChange={(e) => alterarFrequencia(item.key, e.target.value as Frequencia)}
            className="w-full max-w-56 rounded-full border border-line bg-white py-1.5 pr-8 pl-3 text-sm font-semibold"
          >
            {(Object.keys(rotuloFrequencia) as Frequencia[]).map((f) => (
              <option key={f} value={f}>
                {rotuloFrequencia[f]}
                {f !== "unica" ? " (−15%)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 flex items-center justify-between gap-3">
          <SeletorQuantidade valor={item.qtd} aoMudar={(v) => alterarQuantidade(item.key, v)} rotulo={`Quantidade de ${produto.nome}`} />
          <div className="text-right">
            {assinatura && <s className="block text-xs text-muted">{formatBRL(tamanho.preco * item.qtd)}</s>}
            <strong className="font-display text-lg font-bold">{formatBRL(total)}</strong>
            {item.qtd > 1 && <span className="block text-xs text-muted">{formatBRL(unitario)} cada</span>}
          </div>
        </div>
      </div>
    </li>
  );
}
