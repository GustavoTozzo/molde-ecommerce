import type { Metadata } from "next";
import { getPosts } from "@/server/catalogo";
import { BlogLista } from "@/components/blog/BlogLista";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conteúdos educativos sobre rotina, rótulos, formas farmacêuticas e cuidados com a saúde.",
};

export default async function PaginaBlog() {
  const posts = await getPosts();
  return (
    <div className="pb-4">
      <CabecalhoPagina
        titulo="Conteúdo para entender melhor suas fórmulas"
        sobretitulo="Blog"
        trilha={[{ rotulo: "Blog" }]}
        descricao="Estrutura de listagem pronta. Os artigos completos serão produzidos na próxima etapa do projeto."
      />
      <BlogLista posts={posts} />
    </div>
  );
}
