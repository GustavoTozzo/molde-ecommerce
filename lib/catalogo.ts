import { formaPorId, objetivoPorId } from "@/data/taxonomia";
import type { FormaId, ObjetivoId, ProdutoResumo, Selo } from "@/lib/types";
import { normalizar } from "@/lib/utils";

export type Ordem = "relevancia" | "vendas" | "menor-preco" | "maior-preco" | "avaliacao" | "novidades";

export interface Filtros {
  q: string;
  formas: FormaId[];
  objetivos: ObjetivoId[];
  min?: number;
  max?: number;
  receita?: "com" | "sem";
  oferta: boolean;
  selo?: Selo;
  notaMin?: number;
  ordem: Ordem;
}

export const ordens: { id: Ordem; rotulo: string }[] = [
  { id: "relevancia", rotulo: "Relevância" },
  { id: "vendas", rotulo: "Mais vendidos" },
  { id: "avaliacao", rotulo: "Melhor avaliados" },
  { id: "novidades", rotulo: "Novidades" },
  { id: "menor-preco", rotulo: "Menor preço" },
  { id: "maior-preco", rotulo: "Maior preço" },
];

export const faixasPreco: { id: string; rotulo: string; min?: number; max?: number }[] = [
  { id: "ate-50", rotulo: "Até R$ 50", max: 5000 },
  { id: "50-100", rotulo: "R$ 50 a R$ 100", min: 5000, max: 10000 },
  { id: "100-150", rotulo: "R$ 100 a R$ 150", min: 10000, max: 15000 },
  { id: "150-mais", rotulo: "Acima de R$ 150", min: 15000 },
];

export function precoInicial(p: ProdutoResumo): number {
  return Math.min(...p.tamanhos.map((t) => t.preco));
}

function textoDeBusca(p: ProdutoResumo): string {
  return normalizar(
    [p.nome, p.subtitulo, formaPorId[p.forma].rotulo, ...p.objetivos.map((o) => objetivoPorId[o].rotulo), p.ingredientes].join(" "),
  );
}

/** Busca tolerante a acento; todos os termos precisam aparecer. Nome vale mais. */
export function buscar(q: string, produtos: readonly ProdutoResumo[]): ProdutoResumo[] {
  const termos = normalizar(q).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [];
  return produtos
    .map((p) => {
      const texto = textoDeBusca(p);
      if (!termos.every((t) => texto.includes(t))) return null;
      const nome = normalizar(p.nome);
      const pontos = termos.reduce((acc, t) => acc + (nome.startsWith(t) ? 4 : nome.includes(t) ? 3 : 1), 0);
      return { p, pontos: pontos * 1000 + p.vendas / 10 };
    })
    .filter((x): x is { p: ProdutoResumo; pontos: number } => x !== null)
    .sort((a, b) => b.pontos - a.pontos)
    .map((x) => x.p);
}

export function filtrar(lista: readonly ProdutoResumo[], f: Filtros): ProdutoResumo[] {
  const base = f.q.trim() ? buscar(f.q, lista) : lista;
  return base.filter((p) => {
    if (f.formas.length && !f.formas.includes(p.forma)) return false;
    if (f.objetivos.length && !p.objetivos.some((o) => f.objetivos.includes(o))) return false;
    const preco = precoInicial(p);
    if (f.min !== undefined && preco < f.min) return false;
    if (f.max !== undefined && preco >= f.max) return false;
    if (f.receita === "com" && !p.receita) return false;
    if (f.receita === "sem" && p.receita) return false;
    if (f.oferta && !p.tamanhos.some((t) => t.precoDe)) return false;
    if (f.selo && !p.selos.includes(f.selo)) return false;
    if (f.notaMin && p.nota < f.notaMin) return false;
    return true;
  });
}

export function ordenar(lista: readonly ProdutoResumo[], ordem: Ordem, temBusca: boolean): ProdutoResumo[] {
  const copia = [...lista];
  switch (ordem) {
    case "vendas":
      return copia.sort((a, b) => b.vendas - a.vendas);
    case "avaliacao":
      return copia.sort((a, b) => b.nota - a.nota || b.avaliacoes - a.avaliacoes);
    case "novidades":
      return copia.sort((a, b) => b.ordem - a.ordem);
    case "menor-preco":
      return copia.sort((a, b) => precoInicial(a) - precoInicial(b));
    case "maior-preco":
      return copia.sort((a, b) => precoInicial(b) - precoInicial(a));
    default:
      return temBusca ? copia : copia.sort((a, b) => b.vendas * b.nota - a.vendas * a.nota);
  }
}

const listaDe = <T extends string>(valor: string | null, validos: readonly T[]): T[] =>
  (valor ?? "")
    .split(",")
    .filter((v): v is T => (validos as readonly string[]).includes(v));

export function lerFiltros(params: URLSearchParams): Filtros {
  const formasValidas = Object.keys(formaPorId) as FormaId[];
  const objetivosValidos = Object.keys(objetivoPorId) as ObjetivoId[];
  const num = (k: string) => {
    const v = params.get(k);
    return v && /^\d+$/.test(v) ? Number(v) : undefined;
  };
  const ordemParam = params.get("ordem") as Ordem | null;
  const receita = params.get("receita");
  const selo = params.get("selo") as Selo | null;
  return {
    q: params.get("q") ?? "",
    formas: listaDe(params.get("forma"), formasValidas),
    objetivos: listaDe(params.get("objetivo"), objetivosValidos),
    min: num("min"),
    max: num("max"),
    receita: receita === "com" || receita === "sem" ? receita : undefined,
    oferta: params.get("oferta") === "1",
    selo: selo === "mais-vendido" || selo === "lancamento" || selo === "kit" || selo === "oferta" ? selo : undefined,
    notaMin: num("nota"),
    ordem: ordens.some((o) => o.id === ordemParam) ? (ordemParam as Ordem) : "relevancia",
  };
}

export function serializarFiltros(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.formas.length) p.set("forma", f.formas.join(","));
  if (f.objetivos.length) p.set("objetivo", f.objetivos.join(","));
  if (f.min !== undefined) p.set("min", String(f.min));
  if (f.max !== undefined) p.set("max", String(f.max));
  if (f.receita) p.set("receita", f.receita);
  if (f.oferta) p.set("oferta", "1");
  if (f.selo) p.set("selo", f.selo);
  if (f.notaMin) p.set("nota", String(f.notaMin));
  if (f.ordem !== "relevancia") p.set("ordem", f.ordem);
  return p.toString();
}

export function relacionados(p: ProdutoResumo, produtos: readonly ProdutoResumo[], limite = 8): ProdutoResumo[] {
  return produtos
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({
      o,
      afinidade: o.objetivos.filter((x) => p.objetivos.includes(x)).length * 10 + (o.forma === p.forma ? 3 : 0) + o.vendas / 1000,
    }))
    .sort((a, b) => b.afinidade - a.afinidade)
    .slice(0, limite)
    .map((x) => x.o);
}
