import { depoimentos, faqHome } from "@/data/conteudo";
import type { Produto, ProdutoResumo } from "@/lib/types";
import { getCatalogo, getCriadores, getEspecialistas, getPosts, getProduto } from "@/server/catalogo";
import { BlogDestaques } from "@/components/home/BlogDestaques";
import { CategoriasCirculares } from "@/components/home/CategoriasCirculares";
import { CriadoresCarrossel } from "@/components/home/CriadoresCarrossel";
import { Depoimentos } from "@/components/home/Depoimentos";
import { DestaquesProduto } from "@/components/home/DestaquesProduto";
import { EspecialistaDestaque } from "@/components/home/EspecialistaDestaque";
import { FaixaPersonalizada } from "@/components/home/FaixaPersonalizada";
import { FaqSecao } from "@/components/home/FaqSecao";
import { GradeEditorial } from "@/components/home/GradeEditorial";
import { HeroCarrossel } from "@/components/home/HeroCarrossel";
import { HistoriaMarca } from "@/components/home/HistoriaMarca";
import { ProductShelf } from "@/components/produto/ProductShelf";

const SLUGS_RECOMENDADOS = [
  "curcuma-piperina-500",
  "vitamina-d3-k2-gotas",
  "serum-vitamina-c-10",
  "coenzima-q10-100",
  "ashwagandha-300",
  "creme-ureia-10",
  "multivitaminico-infantil",
  "xarope-propolis-mel",
];
const SLUGS_DESTAQUES = ["kit-noite-tranquila", "serum-vitamina-c-10", "colageno-hidrolisado-vitamina-c"];

export default async function Home() {
  const [produtos, destaques, criadores, especialistas, posts] = await Promise.all([
    getCatalogo(),
    Promise.all(SLUGS_DESTAQUES.map((s) => getProduto(s))).then((l) => l.filter((p): p is Produto => !!p)),
    getCriadores(),
    getEspecialistas(),
    getPosts(),
  ]);
  const porSlug = new Map(produtos.map((p) => [p.slug, p]));
  const pegar = (slugs: string[]) => slugs.map((s) => porSlug.get(s)).filter((p): p is ProdutoResumo => !!p);

  const maisVendidos = produtos.filter((p) => !p.receita).sort((a, b) => b.vendas - a.vendas).slice(0, 8);
  const kits = produtos.filter((p) => p.forma === "kits");
  const recomendados = pegar(SLUGS_RECOMENDADOS);

  return (
    <div className="space-y-16 pb-4 md:space-y-24">
      <h1 className="sr-only">Casa Magistral: farmácia de manipulação online</h1>
      <HeroCarrossel />
      <CategoriasCirculares />
      <ProductShelf titulo="Mais vendidos" href="/produtos?ordem=vendas" produtos={maisVendidos} />
      <FaixaPersonalizada />
      <GradeEditorial />
      <DestaquesProduto produtos={destaques} chamadas={["Rotina da noite", "Cuidado tópico", "Beleza de dentro para fora"]} />
      <CriadoresCarrossel criadores={criadores} />
      <ProductShelf
        titulo="Kits para a rotina"
        href="/produtos?forma=kits"
        produtos={kits}
        itemClassName="w-[72%] sm:w-[44%] lg:w-[calc((100%-4rem)/3)]"
      />
      <Depoimentos itens={depoimentos} />
      <EspecialistaDestaque especialistas={especialistas} />
      <ProductShelf titulo="Recomendados para você" href="/produtos" produtos={recomendados} />
      <BlogDestaques posts={posts.slice(0, 3)} />
      <HistoriaMarca />
      <FaqSecao itens={faqHome} />
    </div>
  );
}
