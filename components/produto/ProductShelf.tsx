import type { ProdutoResumo } from "@/lib/types";
import { Carousel } from "@/components/ui/Carousel";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { ProductCard } from "./ProductCard";

/** Prateleira de produtos em carrossel (home, relacionados, especialistas). */
export function ProductShelf({
  titulo,
  href,
  produtos,
  ariaLabel,
  itemClassName,
  semWrap,
}: {
  titulo: string;
  href?: string;
  produtos: ProdutoResumo[];
  ariaLabel?: string;
  itemClassName?: string;
  semWrap?: boolean;
}) {
  return (
    <section aria-label={ariaLabel ?? titulo} className={semWrap ? undefined : "wrap"}>
      <SecaoTitulo href={href}>{titulo}</SecaoTitulo>
      <Carousel ariaLabel={ariaLabel ?? titulo} itemClassName={itemClassName}>
        {produtos.map((p) => (
          <ProductCard key={p.slug} produto={p} />
        ))}
      </Carousel>
    </section>
  );
}
