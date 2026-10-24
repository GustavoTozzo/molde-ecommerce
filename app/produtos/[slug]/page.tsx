import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { relacionados } from "@/lib/catalogo";
import { site } from "@/lib/site";
import { getAvaliacoes, getCatalogo, getEspecialistas, getProduto } from "@/server/catalogo";
import { AvaliacoesProduto } from "@/components/produto/AvaliacoesProduto";
import { CaixaCompra } from "@/components/produto/CaixaCompra";
import { DetalhesProduto } from "@/components/produto/DetalhesProduto";
import { GaleriaProduto } from "@/components/produto/GaleriaProduto";
import { ProductShelf } from "@/components/produto/ProductShelf";

export async function generateStaticParams() {
  return (await getCatalogo()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/produtos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const produto = await getProduto(slug);
  if (!produto) return {};
  return { title: produto.nome, description: produto.descricao[0] };
}

export default async function PaginaProduto(props: PageProps<"/produtos/[slug]">) {
  const { slug } = await props.params;
  const [produto, catalogo, especialistas, avaliacoes] = await Promise.all([
    getProduto(slug),
    getCatalogo(),
    getEspecialistas(),
    getAvaliacoes(slug),
  ]);
  if (!produto) notFound();
  const especialista = especialistas.find((e) => e.selecao.includes(produto.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao[0],
    brand: { "@type": "Brand", name: site.nome },
    aggregateRating: { "@type": "AggregateRating", ratingValue: produto.nota, reviewCount: produto.avaliacoes },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: (Math.min(...produto.tamanhos.map((t) => t.preco)) / 100).toFixed(2),
      highPrice: (Math.max(...produto.tamanhos.map((t) => t.preco)) / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="space-y-16 pb-4 md:space-y-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap grid gap-8 pt-6 md:pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <GaleriaProduto produto={produto} />
          <div className="mt-10 hidden lg:block">
            <DetalhesProduto produto={produto} />
          </div>
        </div>
        <CaixaCompra produto={produto} especialista={especialista} />
        <div className="lg:hidden">
          <DetalhesProduto produto={produto} />
        </div>
      </div>
      <div className="wrap">
        <AvaliacoesProduto produto={produto} avaliacoes={avaliacoes} />
      </div>
      <ProductShelf titulo="Quem compra este produto também leva" produtos={relacionados(produto, catalogo)} />
    </div>
  );
}
