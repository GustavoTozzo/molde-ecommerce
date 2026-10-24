"use client";

import { useId, useState } from "react";
import { PiggyBank } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { site } from "@/lib/site";
import { LinkBotao } from "@/components/ui/Button";

export function SimuladorAssinatura() {
  const id = useId();
  const [gastoReais, setGastoReais] = useState(200);
  const gasto = gastoReais * 100;
  const mensal = Math.round(gasto * site.loja.descontoAssinatura);
  const anual = mensal * 12;
  const frete = gasto >= site.loja.freteGratisAcima;

  return (
    <div className="grid gap-8 rounded-panel bg-forest p-7 text-white md:grid-cols-[1.1fr_1fr] md:p-12">
      <div>
        <PiggyBank className="size-10 text-amber" aria-hidden />
        <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Quanto você economiza com a assinatura?</h2>
        <p className="mt-2 text-white/80">Arraste e veja a economia estimada de 15% em compras recorrentes.</p>
        <label htmlFor={id} className="mt-8 flex items-baseline justify-between gap-4 font-bold">
          <span>Compra mensal</span>
          <output htmlFor={id} className="font-display text-3xl text-amber">
            {formatBRL(gasto)}
          </output>
        </label>
        <input
          id={id}
          type="range"
          min={100}
          max={600}
          step={10}
          value={gastoReais}
          onChange={(e) => setGastoReais(Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer accent-amber"
          aria-valuetext={formatBRL(gasto)}
        />
        <div className="mt-1 flex justify-between text-xs text-white/60">
          <span>R$ 100</span>
          <span>R$ 600</span>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-card bg-white p-6 text-ink" aria-live="polite">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-muted">Economia por mês</dt>
            <dd className="font-display text-3xl font-extrabold text-forest">{formatBRL(mensal)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Economia em 12 meses</dt>
            <dd className="font-display text-5xl font-extrabold text-forest">{formatBRL(anual)}</dd>
          </div>
          <div className="text-sm font-semibold">{frete ? "✓ Frete grátis em todas as entregas" : `Frete grátis acima de ${formatBRL(site.loja.freteGratisAcima)}`}</div>
        </dl>
        <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-6 w-full">
          Montar minha assinatura
        </LinkBotao>
        <p className="mt-3 text-xs text-muted">Estimativa de demonstração, calculada sobre o valor informado.</p>
      </div>
    </div>
  );
}
