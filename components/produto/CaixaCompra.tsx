"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, FileText, Info, Repeat, ShoppingBag, Truck } from "lucide-react";
import { precoUnitario, type Frequencia } from "@/lib/carrinho";
import { formatBRL, mascararCep, parcelamento, percentual } from "@/lib/format";
import { site } from "@/lib/site";
import { adicionarAoCarrinho } from "@/lib/store";
import type { Especialista, Produto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Button";
import { Estrelas } from "@/components/ui/Estrelas";
import { SeletorQuantidade } from "@/components/ui/SeletorQuantidade";
import { formatarNota } from "@/lib/format";
import { BotaoFavorito } from "./BotaoFavorito";

interface OpcaoFrete {
  nome: string;
  prazo: string;
  valor: number;
}

function simularFrete(cep: string, subtotal: number): OpcaoFrete[] {
  const regiao = Number(cep[0]);
  const extra = regiao % 4;
  const gratis = subtotal >= site.loja.freteGratisAcima;
  return [
    { nome: "Econômico", prazo: `${5 + extra} a ${8 + extra} dias úteis`, valor: gratis ? 0 : site.loja.freteFixo },
    { nome: "Expresso", prazo: `${2 + Math.floor(extra / 2)} a ${4 + extra} dias úteis`, valor: gratis ? 0 : site.loja.freteFixo + 1500 },
  ];
}

export function CaixaCompra({
  produto,
  especialista,
}: {
  produto: Produto;
  /** Especialista que inclui este produto na própria seleção (se houver). */
  especialista?: Pick<Especialista, "slug" | "nome" | "titulo">;
}) {
  const uid = useId();
  const [tamanhoId, setTamanhoId] = useState(produto.tamanhos[0].id);
  const [sabor, setSabor] = useState(produto.sabores?.[0]);
  const [modo, setModo] = useState<"unica" | "assinatura">("unica");
  const [frequencia, setFrequencia] = useState<Exclude<Frequencia, "unica">>("1");
  const [qtd, setQtd] = useState(1);
  const [cep, setCep] = useState("");
  const [frete, setFrete] = useState<OpcaoFrete[] | null>(null);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [adicionado, setAdicionado] = useState(false);
  const [mostrarBarra, setMostrarBarra] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const tamanho = produto.tamanhos.find((t) => t.id === tamanhoId) ?? produto.tamanhos[0];
  const freq: Frequencia = modo === "unica" ? "unica" : frequencia;
  const unitario = precoUnitario(tamanho, freq);
  const total = unitario * qtd;
  const parcela = parcelamento(total, site.loja.parcelasMax, site.loja.parcelaMinima);
  const economia = (tamanho.preco - precoUnitario(tamanho, "1")) * qtd;

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    // A barra fixa aparece quando o botão principal já saiu da tela por cima.
    const avaliar = () => setMostrarBarra(el.getBoundingClientRect().bottom < 0);
    avaliar();
    window.addEventListener("scroll", avaliar, { passive: true });
    window.addEventListener("resize", avaliar);
    return () => {
      window.removeEventListener("scroll", avaliar);
      window.removeEventListener("resize", avaliar);
    };
  }, []);

  useEffect(() => {
    if (mostrarBarra) document.body.setAttribute("data-barra-compra", "1");
    else document.body.removeAttribute("data-barra-compra");
    return () => document.body.removeAttribute("data-barra-compra");
  }, [mostrarBarra]);

  function adicionar(abrir: boolean) {
    adicionarAoCarrinho(produto, { tamanhoId: tamanho.id, sabor, qtd, frequencia: freq, abrir });
    if (!abrir) {
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 1800);
    }
  }

  function calcularFrete(e: React.FormEvent) {
    e.preventDefault();
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) {
      setFrete(null);
      setErroCep("Digite um CEP com 8 números.");
      return;
    }
    setErroCep(null);
    setFrete(simularFrete(digitos, total));
  }

  return (
    <div className="lg:sticky lg:top-44">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link href="/" className="hover:text-forest hover:underline">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/produtos" className="hover:text-forest hover:underline">
              Produtos
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">
            {produto.nome}
          </li>
        </ol>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{produto.subtitulo}</p>
          <h1 className="mt-1 font-display text-[2rem] leading-[1.08] font-extrabold text-ink md:text-[2.6rem]">{produto.nome}</h1>
        </div>
        <BotaoFavorito slug={produto.slug} nome={produto.nome} className="shrink-0 bg-cream shadow-none" />
      </div>

      <a href="#avaliacoes" className="mt-3 inline-flex items-center gap-2 text-sm hover:underline">
        <Estrelas nota={produto.nota} />
        <strong>{formatarNota(produto.nota)}</strong>
        <span className="text-muted">({produto.avaliacoes} avaliações)</span>
      </a>

      {produto.receita && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-amber bg-amber-soft/70 p-4 text-sm">
          <FileText className="mt-0.5 size-5 shrink-0 text-amber-dark" aria-hidden />
          <p>
            <strong>Venda com receita.</strong> Você poderá anexar a receita no carrinho. O farmacêutico responsável confere o documento antes de preparar a fórmula.{" "}
            <Link href="/institucional/venda-com-receita" className="font-bold underline underline-offset-2">
              Saiba como funciona
            </Link>
            .
          </p>
        </div>
      )}

      {/* tamanho */}
      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-bold">Tamanho: <span className="font-normal text-muted">{tamanho.rotulo}</span></legend>
        <div className="flex flex-wrap gap-2">
          {produto.tamanhos.map((t) => (
            <label key={t.id} className="cursor-pointer">
              <input type="radio" name={`${uid}-tam`} checked={t.id === tamanhoId} onChange={() => setTamanhoId(t.id)} className="peer sr-only" />
              <span className="flex min-w-28 flex-col rounded-2xl border-2 border-line bg-white px-4 py-2.5 text-sm transition peer-checked:border-forest peer-checked:bg-mint peer-focus-visible:outline-3 peer-focus-visible:outline-amber hover:border-sage">
                <span className="font-bold">{t.rotulo}</span>
                <span className="text-muted">{formatBRL(t.preco)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* sabor */}
      {produto.sabores && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-bold">Sabor: <span className="font-normal text-muted">{sabor}</span></legend>
          <div className="flex flex-wrap gap-2">
            {produto.sabores.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name={`${uid}-sab`} checked={s === sabor} onChange={() => setSabor(s)} className="peer sr-only" />
                <span className="inline-block rounded-full border-2 border-line bg-white px-5 py-2 text-sm font-semibold transition peer-checked:border-forest peer-checked:bg-mint peer-focus-visible:outline-3 peer-focus-visible:outline-amber hover:border-sage">
                  {s}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* modo de compra */}
      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Forma de compra</legend>
        <label className={cn("block cursor-pointer rounded-2xl border-2 p-4 transition", modo === "unica" ? "border-forest bg-mint/50" : "border-line bg-white hover:border-sage")}>
          <span className="flex items-start gap-3">
            <input type="radio" name={`${uid}-modo`} checked={modo === "unica"} onChange={() => setModo("unica")} className="mt-1 size-5 shrink-0 accent-forest" />
            <span className="flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-bold">Compra única</span>
                <span className="flex items-baseline gap-2">
                  {tamanho.precoDe && <s className="text-sm text-muted">{formatBRL(tamanho.precoDe)}</s>}
                  <strong className="font-display text-xl">{formatBRL(tamanho.preco)}</strong>
                  {tamanho.precoDe && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-bold">−{percentual(tamanho.precoDe, tamanho.preco)}%</span>}
                </span>
              </span>
            </span>
          </span>
        </label>
        <div className={cn("rounded-2xl border-2 p-4 transition", modo === "assinatura" ? "border-forest bg-mint/50" : "border-line bg-white hover:border-sage")}>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="radio" name={`${uid}-modo`} checked={modo === "assinatura"} onChange={() => setModo("assinatura")} className="mt-1 size-5 shrink-0 accent-forest" />
            <span className="flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 font-bold">
                  <Repeat className="size-4 text-forest" aria-hidden /> Assinatura
                  <span className="rounded-full bg-forest px-2 py-0.5 text-xs font-bold text-white">−15%</span>
                </span>
                <strong className="font-display text-xl">{formatBRL(precoUnitario(tamanho, "1"))}</strong>
              </span>
              <span className="mt-1 block text-sm text-muted">Entrega automática, sem fidelidade. Pause ou cancele quando quiser.</span>
            </span>
          </label>
          {modo === "assinatura" && (
            <div className="mt-3 pl-8">
              <label htmlFor={`${uid}-freq`} className="mb-1 block text-sm font-semibold">
                Receber
              </label>
              <select
                id={`${uid}-freq`}
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value as Exclude<Frequencia, "unica">)}
                className="w-full rounded-full border border-line bg-white py-2.5 pr-9 pl-4 text-sm font-semibold sm:w-auto"
              >
                <option value="1">A cada 1 mês</option>
                <option value="2">A cada 2 meses</option>
                <option value="3">A cada 3 meses</option>
              </select>
            </div>
          )}
        </div>
      </fieldset>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {modo === "assinatura" ? (
          <>
            Você economiza <strong className="text-forest-dark">{formatBRL(economia)}</strong> por entrega.{" "}
          </>
        ) : null}
        Em até <strong>{parcela.parcelas}x de {formatBRL(parcela.valor)}</strong> sem juros no cartão.
      </p>

      {/* quantidade + CTA */}
      <div ref={ctaRef} className="mt-5 flex flex-wrap items-center gap-3">
        <SeletorQuantidade valor={qtd} aoMudar={setQtd} rotulo="Quantidade" />
        <Botao variante={adicionado ? "secundario" : "primario"} tamanho="l" className="min-w-52 flex-1" onClick={() => adicionar(false)} aria-live="polite">
          {adicionado ? (
            <>
              <Check className="size-5" aria-hidden /> Adicionado ao carrinho
            </>
          ) : (
            <>
              <ShoppingBag className="size-5" aria-hidden /> Adicionar · {formatBRL(total)}
            </>
          )}
        </Botao>
      </div>
      <Botao variante="contorno" tamanho="l" className="mt-3 w-full" onClick={() => adicionar(true)}>
        Comprar agora
      </Botao>

      {/* frete */}
      <form onSubmit={calcularFrete} noValidate className="mt-7 rounded-2xl bg-cream p-4">
        <label htmlFor={`${uid}-cep`} className="flex items-center gap-2 text-sm font-bold">
          <Truck className="size-4 text-forest" aria-hidden /> Calcular frete e prazo
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={`${uid}-cep`}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(mascararCep(e.target.value))}
            aria-invalid={erroCep ? true : undefined}
            aria-describedby={erroCep ? `${uid}-cep-erro` : undefined}
            className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm"
          />
          <Botao type="submit" variante="secundario" tamanho="m">
            Calcular
          </Botao>
        </div>
        {erroCep && (
          <p id={`${uid}-cep-erro`} role="alert" className="mt-2 text-sm font-semibold text-coral">
            {erroCep}
          </p>
        )}
        {frete && (
          <ul className="mt-3 space-y-2 text-sm" aria-live="polite">
            {frete.map((o) => (
              <li key={o.nome} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                <span>
                  <strong>{o.nome}</strong> <span className="text-muted">· {o.prazo}</span>
                </span>
                <strong className={o.valor === 0 ? "text-forest" : undefined}>{o.valor === 0 ? "Grátis" : formatBRL(o.valor)}</strong>
              </li>
            ))}
            <li className="px-1 text-xs text-muted">Simulação de demonstração. Em produção, integre a API da transportadora ou dos Correios.</li>
          </ul>
        )}
      </form>

      {especialista && (
        <Link href={`/especialistas/${especialista.slug}`} className="mt-5 flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-forest hover:bg-mint/40">
          <Info className="size-5 shrink-0 text-forest" aria-hidden />
          <span className="text-sm">
            Faz parte da seleção de <strong>{especialista.nome}</strong> ({especialista.titulo}).
          </span>
        </Link>
      )}

      <p className="mt-5 text-xs leading-relaxed text-muted">
        Este produto não é um medicamento. Não exceda a recomendação diária indicada no rótulo. Crianças, gestantes, lactantes e pessoas com doenças ou em uso de medicamentos devem consultar um profissional de saúde antes do uso. Mantenha fora do alcance de crianças.
      </p>

      {/* barra fixa (mobile) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden",
          mostrarBarra ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!mostrarBarra}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{produto.nome}</p>
          <p className="font-display text-lg font-bold">{formatBRL(total)}</p>
        </div>
        <Botao variante="primario" tamanho="m" onClick={() => adicionar(true)} tabIndex={mostrarBarra ? 0 : -1}>
          <ShoppingBag className="size-4" aria-hidden /> Comprar
        </Botao>
      </div>
    </div>
  );
}
