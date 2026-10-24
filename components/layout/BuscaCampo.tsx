"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCatalogo } from "@/components/catalogo/CatalogoContext";
import { buscar } from "@/lib/catalogo";
import { formatBRL } from "@/lib/format";
import { fundoClasse } from "@/data/taxonomia";
import { ProductArt } from "@/components/ui/Art";
import { cn } from "@/lib/utils";

const termosPopulares = ["Magnésio", "Colágeno", "Vitamina D", "Sérum", "Kit"];

/** Busca com sugestões (padrão ARIA combobox, navegável por teclado). */
export function BuscaCampo({ className, aoNavegar }: { className?: string; aoNavegar?: () => void }) {
  const router = useRouter();
  const { produtos } = useCatalogo();
  const id = useId();
  const [q, setQ] = useState("");
  const [foco, setFoco] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const sugestoes = useMemo(() => buscar(q, produtos).slice(0, 5), [q, produtos]);
  const aberto = foco;
  const total = sugestoes.length + (q.trim() ? 1 : 0);

  function irParaBusca(termo: string) {
    const t = termo.trim();
    setFoco(false);
    aoNavegar?.();
    router.push(t ? `/produtos?q=${encodeURIComponent(t)}` : "/produtos");
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (ativo >= 0 && ativo < sugestoes.length) {
      setFoco(false);
      aoNavegar?.();
      router.push(`/produtos/${sugestoes[ativo].slug}`);
      return;
    }
    irParaBusca(q);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFoco(true);
      setAtivo((a) => (total === 0 ? -1 : (a + 1) % total));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => (total === 0 ? -1 : (a - 1 + total) % total));
    } else if (e.key === "Escape") {
      setFoco(false);
      setAtivo(-1);
    }
  }

  return (
    <div
      className={cn("relative", className)}
      onFocus={() => setFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setFoco(false);
          setAtivo(-1);
        }
      }}
    >
      <form onSubmit={enviar} role="search" className="relative">
        <label htmlFor={`${id}-q`} className="sr-only">
          Buscar produtos
        </label>
        <input
          id={`${id}-q`}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAtivo(-1);
          }}
          onKeyDown={aoTeclar}
          placeholder="O que você procura?"
          autoComplete="off"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={ativo >= 0 ? `${id}-o-${ativo}` : undefined}
          className="w-full rounded-full border-2 border-transparent bg-cream py-3 pr-14 pl-5 text-base placeholder:text-muted focus:border-forest focus:bg-white focus:outline-none md:py-3.5 md:pl-6"
        />
        <button type="submit" aria-label="Buscar" className="absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-forest transition hover:bg-mint">
          <Search className="size-5" aria-hidden />
        </button>
      </form>

      {aberto && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-card bg-white p-2 shadow-pop ring-1 ring-line">
          {q.trim() === "" ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Buscas populares</p>
              <div className="flex flex-wrap gap-2">
                {termosPopulares.map((t) => (
                  <button key={t} type="button" onClick={() => irParaBusca(t)} className="rounded-full bg-cream px-4 py-2 text-sm font-semibold transition hover:bg-mint">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul id={`${id}-lista`} role="listbox" aria-label="Sugestões de produtos">
              {sugestoes.map((p, i) => (
                <li
                  key={p.slug}
                  id={`${id}-o-${i}`}
                  role="option"
                  aria-selected={ativo === i}
                  onMouseEnter={() => setAtivo(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFoco(false);
                    aoNavegar?.();
                    router.push(`/produtos/${p.slug}`);
                  }}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-2xl p-2", ativo === i && "bg-mint")}
                >
                  <span className={cn("block size-12 shrink-0 rounded-xl p-1", fundoClasse[p.fundo])}>
                    <ProductArt kind={p.art.kind} accent={p.art.accent} id={`bs-${p.slug}`} className="h-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{p.nome}</span>
                    <span className="text-xs text-muted">{p.subtitulo}</span>
                  </span>
                  <span className="text-sm font-bold">{formatBRL(p.tamanhos[0].preco)}</span>
                </li>
              ))}
              {sugestoes.length === 0 && <li className="p-3 text-sm text-muted">Nenhum produto encontrado para “{q}”.</li>}
              <li
                id={`${id}-o-${sugestoes.length}`}
                role="option"
                aria-selected={ativo === sugestoes.length}
                onMouseEnter={() => setAtivo(sugestoes.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => irParaBusca(q)}
                className={cn("cursor-pointer rounded-2xl p-3 text-sm font-bold text-forest", ativo === sugestoes.length && "bg-mint")}
              >
                Ver todos os resultados para “{q}”
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
