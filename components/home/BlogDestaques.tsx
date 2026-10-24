import Link from "next/link";
import { Clock } from "lucide-react";
import { fundoClasse } from "@/data/taxonomia";
import type { Post } from "@/lib/types";
import { ProductArt } from "@/components/ui/Art";
import { Selo } from "@/components/ui/Selo";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { cn } from "@/lib/utils";

export function CartaoPost({ post, destaque }: { post: Post; destaque?: boolean }) {
  return (
    <article className={cn("group flex h-full flex-col", destaque && "md:flex-row md:gap-8")}>
      <Link href={`/blog/${post.slug}`} className={cn("block overflow-hidden rounded-card", fundoClasse[post.fundo], destaque && "md:w-1/2")} tabIndex={-1} aria-hidden>
        <div className={cn("flex items-center justify-center", destaque ? "aspect-[4/3] md:aspect-auto md:h-full md:min-h-72" : "aspect-[4/3]")}>
          <ProductArt kind={post.art} accent={post.accent} id={`blog-${post.slug}`} className="h-[78%] transition-transform duration-500 group-hover:scale-105" />
        </div>
      </Link>
      <div className={cn("mt-4 flex flex-1 flex-col", destaque && "md:mt-0 md:w-1/2 md:justify-center")}>
        <Selo tom="menta" className="self-start">
          {post.categoria}
        </Selo>
        <h3 className={cn("mt-3 font-display leading-snug font-bold text-ink", destaque ? "text-2xl md:text-3xl" : "text-xl")}>
          <Link href={`/blog/${post.slug}`} className="hover:text-forest hover:underline">
            {post.titulo}
          </Link>
        </h3>
        <p className="mt-2 text-muted">{post.resumo}</p>
        <p className="mt-3 flex items-center gap-3 text-sm text-muted">
          <time dateTime={post.data.split("/").reverse().join("-")}>{post.data}</time>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {post.leitura}
          </span>
        </p>
      </div>
    </article>
  );
}

export function BlogDestaques({ posts }: { posts: Post[] }) {
  return (
    <section aria-label="Conteúdos do blog" className="wrap">
      <SecaoTitulo href="/blog" linkRotulo="Ver todos os artigos" sobretitulo="Blog">
        Para ler com calma
      </SecaoTitulo>
      <div className="grid gap-8 md:grid-cols-3">
        {posts.map((p) => (
          <CartaoPost key={p.slug} post={p} />
        ))}
      </div>
    </section>
  );
}
