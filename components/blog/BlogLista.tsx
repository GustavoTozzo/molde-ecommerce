"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Post } from "@/lib/types";
import { cn, normalizar } from "@/lib/utils";
import { CartaoPost } from "@/components/home/BlogDestaques";
import { ProductArt } from "@/components/ui/Art";
import { fundoClasse } from "@/data/taxonomia";

export function BlogLista({ posts }: { posts: Post[] }) {
  const categorias = useMemo(() => ["Todos", ...Array.from(new Set(posts.map((p) => p.categoria)))], [posts]);
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca);
  const lista = posts.filter((p) => (categoria === "Todos" || p.categoria === categoria) && (!termo || normalizar(p.titulo + " " + p.resumo).includes(termo)));
  const [destaque, ...resto] = lista;

  return (
    <div className="wrap mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className={cn("rounded-full px-4 py-2 text-sm font-bold transition", categoria === c ? "bg-forest text-white" : "bg-cream hover:bg-mint")}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">Buscar artigos</span>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar artigos" className="w-full rounded-full border border-line bg-white py-2.5 pr-11 pl-4 text-sm" />
            <Search className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </label>
        </div>

        {lista.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-cream p-8 text-center text-muted">Nenhum artigo encontrado. Tente outra categoria ou termo.</p>
        ) : (
          <div className="mt-8 space-y-12">
            <CartaoPost post={destaque} destaque />
            {resto.length > 0 && (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
                {resto.map((p) => (
                  <CartaoPost key={p.slug} post={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <aside aria-label="Mais lidos" className="lg:sticky lg:top-44 lg:h-fit">
        <h2 className="font-display text-2xl font-bold text-forest-dark">Mais lidos</h2>
        <ol className="mt-4 divide-y divide-line">
          {posts.slice(0, 5).map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group flex items-center gap-3 py-3">
                <span className={cn("block size-16 shrink-0 rounded-xl p-1.5", fundoClasse[p.fundo])}>
                  <ProductArt kind={p.art} accent={p.accent} id={`ml-${p.slug}`} className="h-full" />
                </span>
                <span className="font-semibold group-hover:text-forest group-hover:underline">{p.titulo}</span>
              </Link>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
