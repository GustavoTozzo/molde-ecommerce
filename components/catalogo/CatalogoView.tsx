"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { ChevronDown, SearchX, SlidersHorizontal, X } from "lucide-react";
import { formas, objetivos } from "@/data/taxonomia";
import { useCatalogo } from "./CatalogoContext";
import { faixasPreco, filtrar, lerFiltros, ordenar, ordens, serializarFiltros, type Filtros, type Ordem } from "@/lib/catalogo";
import type { FormaId, ObjetivoId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Botao, classesBotao } from "@/components/ui/Button";
import { Painel } from "@/components/ui/Painel";
import { ProductCard } from "@/components/produto/ProductCard";

const POR_PAGINA = 12;

function GrupoFiltro({ titulo, children, aberto = true }: { titulo: string; children: React.ReactNode; aberto?: boolean }) {
  const [on, setOn] = useState(aberto);
  const id = useId();
  return (
    <fieldset className="border-b border-line py-4">
      <legend className="sr-only">{titulo}</legend>
      <button type="button" aria-expanded={on} aria-controls={id} onClick={() => setOn(!on)} className="flex w-full items-center justify-between text-left text-sm font-bold tracking-wide uppercase">
        {titulo}
        <ChevronDown className={cn("size-4 transition-transform", on && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!on} className="mt-3 space-y-1">
        {children}
      </div>
    </fieldset>
  );
}

function Opcao({ tipo = "checkbox", nome, marcado, aoMudar, rotulo, contagem }: { tipo?: "checkbox" | "radio"; nome: string; marcado: boolean; aoMudar: () => void; rotulo: string; contagem?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-[0.95rem] transition hover:bg-mint/60">
      <input type={tipo} name={nome} checked={marcado} onChange={aoMudar} className="size-5 shrink-0 accent-forest" />
      <span className="flex-1">{rotulo}</span>
      {contagem !== undefined && <span className="text-xs text-muted tabular-nums">{contagem}</span>}
    </label>
  );
}

function PainelFiltros({ f, atualizar, limpar }: { f: Filtros; atualizar: (p: Partial<Filtros>) => void; limpar: () => void }) {
  const { produtos: baseSemFiltro } = useCatalogo();
  const alternar = <T extends string>(lista: T[], valor: T) => (lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  const faixaAtual = faixasPreco.find((x) => x.min === f.min && x.max === f.max)?.id ?? "";
  return (
    <div>
      <GrupoFiltro titulo="Forma farmacêutica">
        {formas.map((x) => (
          <Opcao
            key={x.id}
            nome="forma"
            marcado={f.formas.includes(x.id)}
            aoMudar={() => atualizar({ formas: alternar<FormaId>(f.formas, x.id) })}
            rotulo={x.rotulo}
            contagem={baseSemFiltro.filter((p) => p.forma === x.id).length}
          />
        ))}
      </GrupoFiltro>
      <GrupoFiltro titulo="Objetivo">
        {objetivos.map((o) => (
          <Opcao
            key={o.id}
            nome="objetivo"
            marcado={f.objetivos.includes(o.id)}
            aoMudar={() => atualizar({ objetivos: alternar<ObjetivoId>(f.objetivos, o.id) })}
            rotulo={o.rotulo}
            contagem={baseSemFiltro.filter((p) => p.objetivos.includes(o.id)).length}
          />
        ))}
      </GrupoFiltro>
      <GrupoFiltro titulo="Preço">
        <Opcao tipo="radio" nome="preco" marcado={faixaAtual === ""} aoMudar={() => atualizar({ min: undefined, max: undefined })} rotulo="Qualquer preço" />
        {faixasPreco.map((x) => (
          <Opcao key={x.id} tipo="radio" nome="preco" marcado={faixaAtual === x.id} aoMudar={() => atualizar({ min: x.min, max: x.max })} rotulo={x.rotulo} />
        ))}
      </GrupoFiltro>
      <GrupoFiltro titulo="Receita">
        <Opcao tipo="radio" nome="receita" marcado={!f.receita} aoMudar={() => atualizar({ receita: undefined })} rotulo="Todos" />
        <Opcao tipo="radio" nome="receita" marcado={f.receita === "sem"} aoMudar={() => atualizar({ receita: "sem" })} rotulo="Sem receita" />
        <Opcao tipo="radio" nome="receita" marcado={f.receita === "com"} aoMudar={() => atualizar({ receita: "com" })} rotulo="Venda com receita" />
      </GrupoFiltro>
      <GrupoFiltro titulo="Mais opções" aberto={false}>
        <Opcao nome="oferta" marcado={f.oferta} aoMudar={() => atualizar({ oferta: !f.oferta })} rotulo="Somente em oferta" />
        <Opcao nome="nota" marcado={!!f.notaMin} aoMudar={() => atualizar({ notaMin: f.notaMin ? undefined : 4 })} rotulo="Avaliação 4+ estrelas" />
      </GrupoFiltro>
      <Botao variante="fantasma" tamanho="m" onClick={limpar} className="mt-3 w-full">
        Limpar filtros
      </Botao>
    </div>
  );
}

export function CatalogoView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const f = useMemo(() => lerFiltros(new URLSearchParams(params.toString())), [params]);
  const [pagina, setPagina] = useState(1);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const idOrdem = useId();
  const { produtos } = useCatalogo();

  const resultado = useMemo(() => ordenar(filtrar(produtos, f), f.ordem, !!f.q.trim()), [produtos, f]);
  const visiveis = resultado.slice(0, pagina * POR_PAGINA);

  function atualizar(parcial: Partial<Filtros>) {
    const novo = { ...f, ...parcial };
    const qs = serializarFiltros(novo);
    setPagina(1);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function limpar() {
    setPagina(1);
    router.replace(pathname, { scroll: false });
  }

  const chips: { rotulo: string; remover: () => void }[] = [
    ...(f.q.trim() ? [{ rotulo: `Busca: ${f.q}`, remover: () => atualizar({ q: "" }) }] : []),
    ...f.formas.map((x) => ({ rotulo: formas.find((o) => o.id === x)?.rotulo ?? x, remover: () => atualizar({ formas: f.formas.filter((v) => v !== x) }) })),
    ...f.objetivos.map((x) => ({ rotulo: objetivos.find((o) => o.id === x)?.rotulo ?? x, remover: () => atualizar({ objetivos: f.objetivos.filter((v) => v !== x) }) })),
    ...(f.min !== undefined || f.max !== undefined ? [{ rotulo: faixasPreco.find((x) => x.min === f.min && x.max === f.max)?.rotulo ?? "Faixa de preço", remover: () => atualizar({ min: undefined, max: undefined }) }] : []),
    ...(f.receita ? [{ rotulo: f.receita === "com" ? "Venda com receita" : "Sem receita", remover: () => atualizar({ receita: undefined }) }] : []),
    ...(f.oferta ? [{ rotulo: "Em oferta", remover: () => atualizar({ oferta: false }) }] : []),
    ...(f.selo ? [{ rotulo: f.selo === "lancamento" ? "Lançamentos" : f.selo === "mais-vendido" ? "Mais vendidos" : "Kits", remover: () => atualizar({ selo: undefined }) }] : []),
    ...(f.notaMin ? [{ rotulo: "Avaliação 4+", remover: () => atualizar({ notaMin: undefined }) }] : []),
  ];

  const titulo = f.q.trim() ? `Resultados para “${f.q.trim()}”` : f.formas.length === 1 ? formas.find((x) => x.id === f.formas[0])?.rotulo ?? "Produtos" : f.objetivos.length === 1 ? objetivos.find((x) => x.id === f.objetivos[0])?.rotulo ?? "Produtos" : "Todos os produtos";

  return (
    <div className="wrap pt-6 pb-4 md:pt-10">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-forest hover:underline">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">
            Produtos
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-dark md:text-5xl">{titulo}</h1>
          <p className="mt-1 text-muted" aria-live="polite">
            {resultado.length} {resultado.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Botao variante="claro" tamanho="m" className="lg:hidden" onClick={() => setFiltrosAbertos(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> Filtros{chips.length > 0 && ` (${chips.length})`}
          </Botao>
          <div className="flex items-center gap-2">
            <label htmlFor={idOrdem} className="hidden text-sm font-semibold sm:block">
              Ordenar por
            </label>
            <select
              id={idOrdem}
              value={f.ordem}
              onChange={(e) => atualizar({ ordem: e.target.value as Ordem })}
              className="rounded-full border border-line bg-white py-2.5 pr-9 pl-4 text-sm font-semibold"
            >
              {ordens.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {chips.map((c) => (
            <li key={c.rotulo}>
              <button type="button" onClick={c.remover} className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3.5 py-1.5 text-sm font-semibold text-forest-dark transition hover:bg-mint-deep">
                {c.rotulo}
                <X className="size-3.5" aria-label="remover filtro" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={limpar} className="px-2 py-1.5 text-sm font-bold text-coral underline underline-offset-4">
              Limpar tudo
            </button>
          </li>
        </ul>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <PainelFiltros f={f} atualizar={atualizar} limpar={limpar} />
        </aside>

        <div>
          {resultado.length === 0 ? (
            <div className="rounded-panel bg-cream px-6 py-16 text-center">
              <SearchX className="mx-auto size-14 text-forest" strokeWidth={1.4} aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-bold">Nenhum produto encontrado</h2>
              <p className="mx-auto mt-2 max-w-md text-muted">Tente remover algum filtro ou buscar por outro termo, como “magnésio” ou “colágeno”.</p>
              <Botao variante="primario" tamanho="m" onClick={limpar} className="mt-6">
                Limpar filtros
              </Botao>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
                {visiveis.map((p) => (
                  <li key={p.slug}>
                    <ProductCard produto={p} />
                  </li>
                ))}
              </ul>
              {visiveis.length < resultado.length && (
                <div className="mt-12 text-center">
                  <p className="mb-3 text-sm text-muted">
                    Mostrando {visiveis.length} de {resultado.length}
                  </p>
                  <Botao variante="contorno" tamanho="l" onClick={() => setPagina((p) => p + 1)}>
                    Carregar mais produtos
                  </Botao>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Painel aberto={filtrosAbertos} aoFechar={() => setFiltrosAbertos(false)} rotulo="Filtros" lado="esquerda">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">Filtros</h2>
          <button type="button" data-autofocus onClick={() => setFiltrosAbertos(false)} aria-label="Fechar filtros" className="rounded-full p-2 hover:bg-mint">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <PainelFiltros f={f} atualizar={atualizar} limpar={limpar} />
        </div>
        <div className="border-t border-line p-4">
          <button type="button" onClick={() => setFiltrosAbertos(false)} className={classesBotao("primario", "l", "w-full")}>
            Ver {resultado.length} {resultado.length === 1 ? "produto" : "produtos"}
          </button>
        </div>
      </Painel>
    </div>
  );
}
