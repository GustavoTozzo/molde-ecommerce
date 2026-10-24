import Link from "next/link";
import type { ReactNode } from "react";

/** Cabeçalho de páginas internas: trilha de navegação + título + apoio. */
export function CabecalhoPagina({
  titulo,
  descricao,
  trilha,
  sobretitulo,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  trilha: { rotulo: string; href?: string }[];
  sobretitulo?: string;
  children?: ReactNode;
}) {
  return (
    <div className="wrap pt-6 md:pt-10">
      <nav aria-label="Você está em" className="mb-5 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link href="/" className="hover:text-forest hover:underline">
              Início
            </Link>
          </li>
          {trilha.map((t, i) => (
            <li key={t.rotulo} className="flex items-center gap-x-2">
              <span aria-hidden>/</span>
              {t.href ? (
                <Link href={t.href} className="hover:text-forest hover:underline">
                  {t.rotulo}
                </Link>
              ) : (
                <span aria-current={i === trilha.length - 1 ? "page" : undefined} className="font-semibold text-ink">
                  {t.rotulo}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="rounded-panel bg-mint px-6 py-10 md:px-14 md:py-14">
        {sobretitulo && <p className="eyebrow mb-2">{sobretitulo}</p>}
        <h1 className="max-w-3xl font-display text-4xl leading-[1.05] font-extrabold text-forest-dark md:text-6xl">{titulo}</h1>
        {descricao && <p className="mt-4 max-w-2xl text-lg text-muted md:text-xl">{descricao}</p>}
        {children}
      </div>
    </div>
  );
}
