"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CheckCircle2, CreditCard, Lock, QrCode, ReceiptText } from "lucide-react";
import { limparCarrinho, useCarrinho, useStore } from "@/lib/store";
import { formatBRL, mascararCep } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Botao, LinkBotao } from "@/components/ui/Button";
import { ResumoValores } from "./Complementos";

type Campos = "nome" | "email" | "telefone" | "cep" | "endereco" | "numero" | "cidade" | "uf";
type Erros = Partial<Record<Campos, string>>;

function Campo({ id, rotulo, erro, children }: { id: string; rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
          {erro}
        </p>
      )}
    </div>
  );
}

const entrada = "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base aria-[invalid=true]:border-coral";

/**
 * Checkout de DEMONSTRAÇÃO: valida os campos e simula a confirmação. Nenhum
 * dado sai do navegador. Em produção, substitua pela integração com o gateway.
 */
export function CheckoutDemo() {
  const uid = useId();
  const resumo = useCarrinho();
  const receita = useStore((s) => s.receita);
  const [v, setV] = useState<Record<Campos, string>>({ nome: "", email: "", telefone: "", cep: "", endereco: "", numero: "", cidade: "", uf: "" });
  const [pagamento, setPagamento] = useState<"pix" | "cartao" | "boleto">("pix");
  const [erros, setErros] = useState<Erros>({});
  const [pedido, setPedido] = useState<{ numero: string; total: number } | null>(null);

  const id = (c: Campos) => `${uid}-${c}`;
  const props = (c: Campos) => ({
    id: id(c),
    value: v[c],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [c]: c === "cep" ? mascararCep(e.target.value) : e.target.value })),
    "aria-invalid": erros[c] ? (true as const) : undefined,
    "aria-describedby": erros[c] ? `${id(c)}-erro` : undefined,
    className: entrada,
  });

  if (pedido) {
    return (
      <div className="wrap py-16 text-center md:py-24">
        <CheckCircle2 className="mx-auto size-20 text-forest" aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold text-forest-dark md:text-5xl">Pedido simulado com sucesso</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">
          Número do pedido <strong className="text-ink">{pedido.numero}</strong> · total de <strong className="text-ink">{formatBRL(pedido.total)}</strong>. Esta é uma demonstração: nenhum pagamento foi processado e nenhum dado foi enviado.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkBotao href="/produtos" variante="primario" tamanho="l">
            Continuar comprando
          </LinkBotao>
          <LinkBotao href="/" variante="claro" tamanho="l">
            Voltar ao início
          </LinkBotao>
        </div>
      </div>
    );
  }

  if (resumo.linhas.length === 0) {
    return (
      <div className="wrap py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Não há itens para finalizar</h1>
        <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-6">
          Ver produtos
        </LinkBotao>
      </div>
    );
  }

  function validar(): Erros {
    const e: Erros = {};
    if (v.nome.trim().split(/\s+/).length < 2) e.nome = "Informe nome e sobrenome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Informe um e-mail válido.";
    if (v.telefone.replace(/\D/g, "").length < 10) e.telefone = "Informe um telefone com DDD.";
    if (v.cep.replace(/\D/g, "").length !== 8) e.cep = "O CEP tem 8 números.";
    if (!v.endereco.trim()) e.endereco = "Informe a rua ou avenida.";
    if (!v.numero.trim()) e.numero = "Informe o número.";
    if (!v.cidade.trim()) e.cidade = "Informe a cidade.";
    if (!/^[A-Za-z]{2}$/.test(v.uf.trim())) e.uf = "Use a sigla do estado (ex.: SP).";
    return e;
  }

  function finalizar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErros(e);
    const primeiro = Object.keys(e)[0] as Campos | undefined;
    if (primeiro) {
      document.getElementById(id(primeiro))?.focus();
      return;
    }
    const numero = `CM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setPedido({ numero, total: resumo.total });
    limparCarrinho();
  }

  const bloqueado = resumo.precisaReceita && !receita;

  return (
    <div className="wrap pt-8 pb-4 md:pt-12">
      <p className="flex items-center gap-2 text-sm font-semibold text-forest">
        <Lock className="size-4" aria-hidden /> Ambiente de demonstração
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold text-forest-dark md:text-5xl">Finalizar compra</h1>
      <form onSubmit={finalizar} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <div className="space-y-10">
          <fieldset>
            <legend className="font-display text-2xl font-bold">1. Seus dados</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo id={id("nome")} rotulo="Nome completo" erro={erros.nome}>
                  <input {...props("nome")} autoComplete="name" />
                </Campo>
              </div>
              <Campo id={id("email")} rotulo="E-mail" erro={erros.email}>
                <input {...props("email")} type="email" autoComplete="email" />
              </Campo>
              <Campo id={id("telefone")} rotulo="Celular com DDD" erro={erros.telefone}>
                <input {...props("telefone")} type="tel" autoComplete="tel" />
              </Campo>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-2xl font-bold">2. Entrega</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Campo id={id("cep")} rotulo="CEP" erro={erros.cep}>
                  <input {...props("cep")} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
                </Campo>
              </div>
              <div className="sm:col-span-3">
                <Campo id={id("endereco")} rotulo="Rua ou avenida" erro={erros.endereco}>
                  <input {...props("endereco")} autoComplete="address-line1" />
                </Campo>
              </div>
              <div className="sm:col-span-1">
                <Campo id={id("numero")} rotulo="Número" erro={erros.numero}>
                  <input {...props("numero")} />
                </Campo>
              </div>
              <div className="sm:col-span-4">
                <Campo id={id("cidade")} rotulo="Cidade" erro={erros.cidade}>
                  <input {...props("cidade")} autoComplete="address-level2" />
                </Campo>
              </div>
              <div className="sm:col-span-2">
                <Campo id={id("uf")} rotulo="UF" erro={erros.uf}>
                  <input {...props("uf")} maxLength={2} autoComplete="address-level1" className={cn(entrada, "uppercase")} />
                </Campo>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-display text-2xl font-bold">3. Pagamento</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([
                ["pix", "Pix", QrCode, "Aprovação imediata"],
                ["cartao", "Cartão", CreditCard, `Até 6x sem juros`],
                ["boleto", "Boleto", ReceiptText, "Vence em 3 dias"],
              ] as const).map(([valor, rotulo, Icone, nota]) => (
                <label key={valor} className="cursor-pointer">
                  <input type="radio" name={`${uid}-pg`} checked={pagamento === valor} onChange={() => setPagamento(valor)} className="peer sr-only" />
                  <span className="flex h-full flex-col gap-1 rounded-2xl border-2 border-line bg-white p-4 transition peer-checked:border-forest peer-checked:bg-mint peer-focus-visible:outline-3 peer-focus-visible:outline-amber">
                    <Icone className="size-6 text-forest" aria-hidden />
                    <span className="font-bold">{rotulo}</span>
                    <span className="text-sm text-muted">{nota}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">Na versão real, os dados de pagamento são coletados pelo gateway em ambiente seguro. Este molde não solicita número de cartão.</p>
          </fieldset>
        </div>

        <aside className="h-fit space-y-5 rounded-panel bg-cream p-6 lg:sticky lg:top-44" aria-label="Resumo do pedido">
          <h2 className="font-display text-2xl font-bold">Seu pedido</h2>
          <ul className="divide-y divide-line text-sm">
            {resumo.linhas.map((l) => (
              <li key={l.item.key} className="flex justify-between gap-3 py-2.5">
                <span>
                  {l.item.qtd}× {l.produto.nome} <span className="text-muted">({l.tamanho.rotulo})</span>
                </span>
                <strong>{formatBRL(l.total)}</strong>
              </li>
            ))}
          </ul>
          <ResumoValores resumo={resumo} />
          {bloqueado && (
            <p className="rounded-2xl bg-amber-soft p-3 text-sm">
              Há itens com venda sob receita.{" "}
              <Link href="/carrinho" className="font-bold underline">
                Anexe a receita no carrinho
              </Link>
              .
            </p>
          )}
          <Botao type="submit" variante="primario" tamanho="l" className="w-full" disabled={bloqueado}>
            Confirmar pedido (simulado)
          </Botao>
        </aside>
      </form>
    </div>
  );
}
