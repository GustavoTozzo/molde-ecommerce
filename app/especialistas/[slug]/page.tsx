import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProdutoResumo } from "@/lib/types";
import { getCatalogo, getEspecialista, getEspecialistas } from "@/server/catalogo";
import { Avatar } from "@/components/ui/Art";
import { ProductCard } from "@/components/produto/ProductCard";

export async function generateStaticParams() {
  return (await getEspecialistas()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/especialistas/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const e = await getEspecialista(slug);
  return e ? { title: e.nome, description: e.bio } : {};
}

export default async function PaginaEspecialista(props: PageProps<"/especialistas/[slug]">) {
  const { slug } = await props.params;
  const [e, catalogo] = await Promise.all([getEspecialista(slug), getCatalogo()]);
  if (!e) notFound();
  const porSlug = new Map(catalogo.map((p) => [p.slug, p]));
  const selecao = e.selecao.map((s) => porSlug.get(s)).filter((p): p is ProdutoResumo => !!p);

  return (
    <div className="space-y-16 pb-4 md:space-y-20">
      <div className="wrap pt-6 md:pt-10">
        <nav aria-label="Você está em" className="mb-5 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/" className="hover:text-forest hover:underline">
                Início
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/especialistas" className="hover:text-forest hover:underline">
                Especialistas
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="font-semibold text-ink">
              {e.nome}
            </li>
          </ol>
        </nav>
        <div className="grid items-center gap-8 rounded-panel bg-mint p-8 md:grid-cols-[auto_1fr] md:gap-14 md:p-14">
          <Avatar nome={e.avatar} className="mx-auto size-48 rounded-full ring-8 ring-white md:size-64" />
          <div>
            <p className="eyebrow">{e.titulo}</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold text-forest-dark md:text-6xl">{e.nome}</h1>
            <p className="mt-1 text-muted">{e.registro}</p>
            <p className="mt-5 max-w-2xl text-lg">{e.bio}</p>
            <blockquote className="mt-6 max-w-2xl border-l-4 border-amber pl-5 font-display text-xl font-bold text-forest-dark md:text-2xl">“{e.citacao}”</blockquote>
          </div>
        </div>
      </div>

      <section aria-labelledby="selecao-titulo" className="wrap">
        <h2 id="selecao-titulo" className="mb-8 font-display text-3xl font-bold text-forest md:text-4xl">
          Seleção de {e.nome}
        </h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {selecao.map((p) => (
            <li key={p.slug}>
              <ProductCard produto={p} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">
          A seleção reúne itens do catálogo escolhidos pelo profissional como exemplo. Não substitui consulta nem prescrição individual.
        </p>
      </section>
    </div>
  );
}
