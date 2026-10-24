import type { ArtKind } from "@/lib/art";
import type { Fundo, FormaId, ObjetivoId, ProdutoResumo, Selo } from "@/lib/types";

export type LinhaResumo = {
  slug: string;
  nome: string;
  subtitulo: string;
  forma: string;
  objetivos: string[];
  artKind: string;
  artAccent: string;
  fundo: string;
  selos: string[];
  sabores: string[];
  receita: boolean;
  ingredientes: string;
  nota: number;
  qtdAvaliacoes: number;
  vendas: number;
  ordem: number;
  tamanhos: { codigo: string; rotulo: string; preco: number; precoDe: number | null }[];
};

/** Converte uma linha do banco no tipo da vitrine. Também usada pelo checkout, que lê preços direto do banco. */
export function paraResumo(l: LinhaResumo): ProdutoResumo {
  return {
    slug: l.slug,
    nome: l.nome,
    subtitulo: l.subtitulo,
    forma: l.forma as FormaId,
    objetivos: l.objetivos as ObjetivoId[],
    art: { kind: l.artKind as ArtKind, accent: l.artAccent },
    fundo: l.fundo as Fundo,
    tamanhos: l.tamanhos.map((t) => ({
      id: t.codigo,
      rotulo: t.rotulo,
      preco: t.preco,
      ...(t.precoDe != null && { precoDe: t.precoDe }),
    })),
    ...(l.sabores.length > 0 && { sabores: l.sabores }),
    selos: l.selos as Selo[],
    nota: l.nota,
    avaliacoes: l.qtdAvaliacoes,
    vendas: l.vendas,
    ordem: l.ordem,
    receita: l.receita,
    ingredientes: l.ingredientes,
  };
}
