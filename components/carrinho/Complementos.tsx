"use client";

import { useId, useState, useTransition } from "react";
import { FileText, Tag, Truck, Upload, X } from "lucide-react";
import { aplicarCupom, definirReceita, useStore } from "@/lib/store";
import type { ResumoCarrinho } from "@/lib/carrinho";
import { formatBRL, parcelamento } from "@/lib/format";
import { site } from "@/lib/site";
import { validarCupomAction } from "@/server/acoes/cupom";
import { Botao } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ProgressoFrete({ resumo }: { resumo: ResumoCarrinho }) {
  const alvo = site.loja.freteGratisAcima;
  const base = resumo.subtotal - resumo.descontoCupom;
  const pct = Math.min(100, Math.round((base / alvo) * 100));
  return (
    <div className="rounded-2xl bg-mint p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-forest-dark" aria-live="polite">
        <Truck className="size-4 shrink-0" aria-hidden />
        {resumo.freteGratis ? "Você ganhou frete grátis!" : `Faltam ${formatBRL(resumo.faltaFreteGratis)} para o frete grátis`}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progresso para frete grátis">
        <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CupomForm() {
  const id = useId();
  const cupom = useStore((s) => s.cupom);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [validando, iniciar] = useTransition();

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const resultado = await validarCupomAction(valor);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setErro(null);
      aplicarCupom(resultado.cupom);
      setValor("");
    });
  }

  if (cupom) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-forest-dark">
          <Tag className="size-4" aria-hidden />
          {cupom.codigo} · {cupom.tipo === "FRETE_GRATIS" ? "Frete grátis" : `${cupom.percentual}% de desconto`}
        </span>
        <button type="button" onClick={() => aplicarCupom(null)} className="rounded-full p-1.5 text-muted hover:bg-cream hover:text-ink" aria-label="Remover cupom">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={aplicar} noValidate>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        Tem um cupom?
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Digite o código"
          autoComplete="off"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm uppercase placeholder:normal-case"
        />
        <Botao type="submit" variante="secundario" tamanho="m" disabled={validando}>
          {validando ? "Validando…" : "Aplicar"}
        </Botao>
      </div>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-coral">
          {erro}
        </p>
      )}
    </form>
  );
}

export function ReceitaUpload() {
  const id = useId();
  const receita = useStore((s) => s.receita);
  return (
    <div className={cn("rounded-2xl border-2 border-dashed p-4", receita ? "border-forest bg-mint/60" : "border-amber bg-amber-soft/60")}>
      <p className="flex items-start gap-2 text-sm font-semibold text-ink">
        <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
        Há itens com venda condicionada à receita
      </p>
      <p className="mt-1 text-sm text-muted">Anexe uma foto ou PDF legível. O farmacêutico responsável confere antes de preparar a fórmula.</p>
      {receita ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-full bg-white px-4 py-2 text-sm">
          <span className="truncate font-semibold">{receita}</span>
          <button type="button" onClick={() => definirReceita(null)} className="rounded-full p-1 text-muted hover:text-coral" aria-label="Remover receita">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <label htmlFor={id} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white transition hover:bg-forest-dark focus-within:outline-3 focus-within:outline-amber">
            <Upload className="size-4" aria-hidden />
            Anexar receita
          </label>
          <input
            id={id}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) definirReceita(arquivo.name);
            }}
          />
        </>
      )}
      <p className="mt-2 text-xs text-muted">Demonstração: guardamos só o nome do arquivo no navegador. Em produção, envie a imagem para um armazenamento seguro.</p>
    </div>
  );
}

export function ResumoValores({ resumo }: { resumo: ResumoCarrinho }) {
  const parcela = parcelamento(resumo.total, site.loja.parcelasMax, site.loja.parcelaMinima);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="font-semibold">{formatBRL(resumo.subtotal)}</dd>
      </div>
      {resumo.economiaAssinatura > 0 && (
        <div className="flex justify-between text-forest-dark">
          <dt>Economia com assinatura (já aplicada)</dt>
          <dd className="font-semibold">−{formatBRL(resumo.economiaAssinatura)}</dd>
        </div>
      )}
      {resumo.descontoCupom > 0 && (
        <div className="flex justify-between text-forest-dark">
          <dt>Cupom</dt>
          <dd className="font-semibold">−{formatBRL(resumo.descontoCupom)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Frete</dt>
        <dd className="font-semibold">{resumo.linhas.length === 0 ? "—" : resumo.frete === 0 ? "Grátis" : formatBRL(resumo.frete)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="text-base font-bold">Total</dt>
        <dd className="font-display text-2xl font-bold">{formatBRL(resumo.total)}</dd>
      </div>
      {resumo.total > 0 && (
        <p className="text-right text-xs text-muted">
          ou {parcela.parcelas}x de {formatBRL(parcela.valor)} sem juros
        </p>
      )}
    </dl>
  );
}
