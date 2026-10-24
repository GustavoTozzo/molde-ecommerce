import type { ArtKind } from "./art";

export type FormaId = "capsulas" | "saches" | "gotas" | "cremes" | "xaropes" | "kits";
export type ObjetivoId =
  | "sono"
  | "energia"
  | "imunidade"
  | "beleza"
  | "mulher"
  | "homem"
  | "longevidade"
  | "familia";
export type Selo = "mais-vendido" | "lancamento" | "oferta" | "kit";
export type Fundo = "cream" | "mint" | "amber-soft" | "sky-soft" | "lilac-soft" | "coral-soft";

export interface Tamanho {
  /** Código curto do tamanho dentro do produto ("60", "30ml"...), não o id do banco. */
  id: string;
  rotulo: string;
  /** centavos */
  preco: number;
  /** centavos (preço "de", opcional) */
  precoDe?: number;
}

/** Campos que os cartões, a busca e o carrinho precisam (catálogo inteiro cabe no cliente). */
export interface ProdutoResumo {
  slug: string;
  nome: string;
  subtitulo: string;
  forma: FormaId;
  objetivos: ObjetivoId[];
  art: { kind: ArtKind; accent: string };
  fundo: Fundo;
  tamanhos: Tamanho[];
  sabores?: string[];
  selos: Selo[];
  nota: number;
  avaliacoes: number;
  vendas: number;
  ordem: number;
  /** Venda condicionada à apresentação de receita. */
  receita: boolean;
  /** Entra no resumo porque a busca do site também procura por ingrediente. */
  ingredientes: string;
}

/** Página de produto: resumo + conteúdo longo (carregado só onde é exibido). */
export interface Produto extends ProdutoResumo {
  descricao: string[];
  comoUsar: string;
  porcao: string;
  tabela: { item: string; qtd: string; vd?: string }[];
  faq: { q: string; a: string }[];
}

export interface Especialista {
  slug: string;
  nome: string;
  titulo: string;
  registro: string;
  bio: string;
  citacao: string;
  avatar: AvatarKey;
  selecao: string[];
}

export interface Criador {
  handle: string;
  avatar: AvatarKey;
  produto: string;
  legenda: string;
}

export type AvatarKey =
  | "helena"
  | "rafael"
  | "camila"
  | "beatriz"
  | "pedro"
  | "juliana"
  | "theo"
  | "duda"
  | "lara"
  | "bruno"
  | "nina";

export interface Avaliacao {
  nome: string;
  nota: number;
  data: string;
  titulo: string;
  texto: string;
  util: number;
}

export interface Post {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  data: string;
  leitura: string;
  art: ArtKind;
  accent: string;
  fundo: Fundo;
}

/** Cupom já validado pelo servidor; o desconto real é recalculado no checkout. */
export interface CupomAplicado {
  codigo: string;
  tipo: "PERCENTUAL" | "FRETE_GRATIS";
  /** Percentual inteiro (10 = 10%). Zero em FRETE_GRATIS. */
  percentual: number;
}
