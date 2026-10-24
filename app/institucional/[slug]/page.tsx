import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoPagina } from "@/components/ui/EsqueletoPagina";
import { notFound } from "next/navigation";
import { faqHome } from "@/data/conteudo";
import { paginaPorSlug, paginasInstitucionais } from "@/data/institucional";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { FaqSecao } from "@/components/home/FaqSecao";

export function generateStaticParams() {
  return [...paginasInstitucionais.map((p) => ({ slug: p.slug })), { slug: "perguntas-frequentes" }];
}

export async function generateMetadata(props: PageProps<"/institucional/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  if (slug === "perguntas-frequentes") return { title: "Perguntas frequentes" };
  const p = paginaPorSlug.get(slug);
  return p ? { title: p.titulo, description: p.resumo } : {};
}

async function Conteudo(props: PageProps<"/institucional/[slug]">) {
  const { slug } = await props.params;

  if (slug === "perguntas-frequentes") {
    return (
      <div className="space-y-12 pb-4">
        <CabecalhoPagina titulo="Perguntas frequentes" sobretitulo="Ajuda" trilha={[{ rotulo: "Perguntas frequentes" }]} descricao="Respostas rápidas sobre receita, assinatura, entrega e trocas." />
        <FaqSecao itens={faqHome} titulo="Tire suas dúvidas" />
      </div>
    );
  }

  const pagina = paginaPorSlug.get(slug);
  if (!pagina) notFound();

  return (
    <div className="space-y-12 pb-4">
      <CabecalhoPagina titulo={pagina.titulo} sobretitulo="Institucional" trilha={[{ rotulo: pagina.titulo }]} descricao={pagina.resumo} />
      <article className="wrap">
        <div className="mx-auto max-w-3xl space-y-8">
          {pagina.secoes.map((s) => (
            <section key={s.titulo}>
              <h2 className="font-display text-2xl font-bold text-forest-dark md:text-3xl">{s.titulo}</h2>
              {s.texto.map((t) => (
                <p key={t} className="mt-3 text-lg leading-relaxed text-muted">
                  {t}
                </p>
              ))}
            </section>
          ))}
          <p className="rounded-2xl bg-amber-soft p-4 text-sm">Texto de exemplo do molde. Revise com o farmacêutico responsável e com assessoria jurídica antes de publicar.</p>
        </div>
      </article>
    </div>
  );
}

/**
 * `params` é lido DENTRO do Suspense: para um endereço que não estava no `generateStaticParams`
 * (produto novo, por exemplo) o Next serve o esqueleto na hora e completa a página em seguida.
 * Ler `params` fora do Suspense faz a regeneração falhar em produção.
 */
export default function PaginaInstitucional(props: PageProps<"/institucional/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoPagina />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
