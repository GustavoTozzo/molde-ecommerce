import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fundoClasse } from "@/data/taxonomia";
import { CartaoPost } from "@/components/home/BlogDestaques";
import { ProductArt } from "@/components/ui/Art";
import { Selo } from "@/components/ui/Selo";
import { cn } from "@/lib/utils";
import { getPosts } from "@/server/catalogo";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  return post ? { title: post.titulo, description: post.resumo } : {};
}

/** Modelo de página de artigo. O corpo em MDX entra na próxima etapa (blog). */
export default async function PaginaPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const posts = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const outros = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="space-y-16 pb-4">
      <article className="wrap pt-6 md:pt-10">
        <nav aria-label="Você está em" className="mb-6 text-sm text-muted">
          <Link href="/blog" className="font-semibold hover:text-forest hover:underline">
            ← Voltar ao blog
          </Link>
        </nav>
        <div className="mx-auto max-w-3xl">
          <Selo tom="menta">{post.categoria}</Selo>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] font-extrabold text-ink md:text-6xl">{post.titulo}</h1>
          <p className="mt-4 text-xl text-muted">{post.resumo}</p>
          <p className="mt-4 text-sm text-muted">
            {post.data} · {post.leitura} de leitura
          </p>
        </div>
        <div className={cn("mx-auto mt-8 flex aspect-[16/8] max-w-5xl items-center justify-center overflow-hidden rounded-panel", fundoClasse[post.fundo])}>
          <ProductArt kind={post.art} accent={post.accent} id={`post-${post.slug}`} className="h-[80%]" />
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-panel border-2 border-dashed border-line bg-cream p-8 text-center">
          <p className="font-display text-2xl font-bold text-forest-dark">Artigo em preparação</p>
          <p className="mt-2 text-muted">O texto completo, com autoria, data de revisão e referências, será publicado na etapa do blog.</p>
        </div>
      </article>
      <section aria-label="Outros artigos" className="wrap">
        <h2 className="mb-8 font-display text-3xl font-bold text-forest">Continue lendo</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {outros.map((p) => (
            <CartaoPost key={p.slug} post={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
