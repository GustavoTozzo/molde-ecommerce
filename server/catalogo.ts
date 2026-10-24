import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ArtKind } from "@/lib/art";
import { formatarData } from "@/lib/format";
import type {
  AvatarKey,
  Avaliacao,
  Criador,
  Especialista,
  Fundo,
  Post,
  Produto,
  ProdutoResumo,
} from "@/lib/types";
import { paraResumo } from "./mapeadores";
import { prisma } from "./prisma";

/**
 * Leitura do catálogo e do conteúdo editorial. É a ÚNICA porta de entrada para
 * esses dados: páginas e componentes recebem os tipos de `lib/types.ts` e não sabem
 * que existe Prisma. Para migrar para a Shopify (docs/decisoes-fase-8.md), basta
 * reimplementar este arquivo com a Storefront API, mantendo as mesmas assinaturas.
 *
 * Tudo é cacheado com `use cache`; mutações do admin chamam `updateTag("catalogo")`.
 */

const TAG = "catalogo";

const selecaoTamanhos = {
  orderBy: { ordem: "asc" },
  select: { codigo: true, rotulo: true, preco: true, precoDe: true },
} as const;

const selecaoResumo = {
  slug: true,
  nome: true,
  subtitulo: true,
  forma: true,
  objetivos: true,
  artKind: true,
  artAccent: true,
  fundo: true,
  selos: true,
  sabores: true,
  receita: true,
  ingredientes: true,
  nota: true,
  qtdAvaliacoes: true,
  vendas: true,
  ordem: true,
  tamanhos: selecaoTamanhos,
} as const;

/** Todos os produtos ativos, só com o que cartões, busca e carrinho precisam. */
export async function getCatalogo(): Promise<ProdutoResumo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const linhas = await prisma.produto.findMany({
    where: { ativo: true },
    select: selecaoResumo,
    orderBy: [{ vendas: "desc" }, { slug: "asc" }],
  });
  return linhas.map(paraResumo);
}

/** Página de produto: resumo + descrição, tabela nutricional e FAQ. */
export async function getProduto(slug: string): Promise<Produto | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG, `produto:${slug}`);
  const l = await prisma.produto.findFirst({
    where: { slug, ativo: true },
    select: { ...selecaoResumo, descricao: true, comoUsar: true, porcao: true, tabela: true, faq: true },
  });
  if (!l) return null;
  return {
    ...paraResumo(l),
    descricao: l.descricao,
    comoUsar: l.comoUsar,
    porcao: l.porcao,
    tabela: l.tabela as Produto["tabela"],
    faq: l.faq as Produto["faq"],
  };
}

export async function getAvaliacoes(slug: string): Promise<Avaliacao[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG, `avaliacoes:${slug}`);
  const linhas = await prisma.avaliacao.findMany({
    where: { produto: { slug } },
    orderBy: { criadoEm: "desc" },
    take: 30,
  });
  return linhas.map((a) => ({
    nome: a.nomeExibicao,
    nota: a.nota,
    data: formatarData(a.criadoEm),
    titulo: a.titulo,
    texto: a.texto,
    util: a.util,
  }));
}

type LinhaEspecialista = {
  slug: string;
  nome: string;
  titulo: string;
  registro: string;
  bio: string;
  citacao: string;
  avatar: string;
  selecao: { produto: { slug: string } }[];
};

const selecaoEspecialista = {
  slug: true,
  nome: true,
  titulo: true,
  registro: true,
  bio: true,
  citacao: true,
  avatar: true,
  selecao: { orderBy: { ordem: "asc" }, select: { produto: { select: { slug: true } } } },
} as const;

function paraEspecialista(l: LinhaEspecialista): Especialista {
  return {
    slug: l.slug,
    nome: l.nome,
    titulo: l.titulo,
    registro: l.registro,
    bio: l.bio,
    citacao: l.citacao,
    avatar: l.avatar as AvatarKey,
    selecao: l.selecao.map((s) => s.produto.slug),
  };
}

export async function getEspecialistas(): Promise<Especialista[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const linhas = await prisma.especialista.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
    select: selecaoEspecialista,
  });
  return linhas.map(paraEspecialista);
}

export async function getEspecialista(slug: string): Promise<Especialista | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const l = await prisma.especialista.findFirst({ where: { slug, ativo: true }, select: selecaoEspecialista });
  return l ? paraEspecialista(l) : null;
}

export async function getCriadores(): Promise<Criador[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const linhas = await prisma.criador.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
    select: { handle: true, avatar: true, legenda: true, produto: { select: { slug: true } } },
  });
  return linhas.map((c) => ({
    handle: c.handle,
    avatar: c.avatar as AvatarKey,
    legenda: c.legenda,
    produto: c.produto.slug,
  }));
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);
  const linhas = await prisma.post.findMany({ where: { publicado: true }, orderBy: { publicadoEm: "desc" } });
  return linhas.map((p) => ({
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo,
    categoria: p.categoria,
    data: formatarData(p.publicadoEm),
    leitura: p.leitura,
    art: p.artKind as ArtKind,
    accent: p.artAccent,
    fundo: p.fundo as Fundo,
  }));
}
