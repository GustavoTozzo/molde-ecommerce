"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formas, objetivos } from "@/data/taxonomia";
import { parseReais } from "@/lib/format";
import { prisma } from "@/server/prisma";
import { exigirEquipeNaAcao } from "@/server/sessao";
import { errosPorCampo, texto, type EstadoForm } from "@/server/validacao";

export type { EstadoForm };

const SELOS = ["mais-vendido", "lancamento", "oferta", "kit"] as const;
const FORMAS = formas.map((f) => f.id) as [string, ...string[]];
const OBJETIVOS = objetivos.map((o) => o.id);

/** Qualquer mudança no catálogo invalida o cache de leitura da vitrine na hora (leitura do próprio autor). */
function atualizarVitrine(slug?: string) {
  updateTag("catalogo");
  if (slug) updateTag(`produto:${slug}`);
  revalidatePath("/admin/produtos");
}

function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "Magnésio | 300 mg | 71%" por linha -> [{ item, qtd, vd }]. */
function lerTabela(bruto: string): { item: string; qtd: string; vd?: string }[] {
  return bruto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [item = "", qtd = "", vd = ""] = l.split("|").map((p) => p.trim());
      return { item, qtd, ...(vd && { vd }) };
    })
    .filter((l) => l.item && l.qtd);
}

const produtoSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome.").max(100),
  subtitulo: z.string().trim().min(2, "Informe o subtítulo.").max(80),
  forma: z.enum(FORMAS, "Escolha a forma."),
  objetivos: z.array(z.enum(OBJETIVOS as [string, ...string[]])).max(8),
  selos: z.array(z.enum(SELOS)).max(4),
  sabores: z.string().trim().max(300),
  descricao: z.string().trim().min(10, "Escreva a descrição.").max(2000),
  comoUsar: z.string().trim().min(5, "Informe como usar.").max(1000),
  ingredientes: z.string().trim().min(3, "Informe os ingredientes.").max(1000),
  porcao: z.string().trim().min(1, "Informe a porção.").max(60),
  tabela: z.string().max(2000),
});

const tamanhoSchema = z.object({
  rotulo: z.string().trim().min(1, "Informe o nome do tamanho.").max(60),
  preco: z.number().int().min(100, "O preço mínimo é R$ 1,00.").max(9_999_900),
  precoDe: z.number().int().min(100).max(9_999_900).nullable(),
  estoque: z.number().int().min(0).max(1_000_000),
});

function inteiro(v: string): number | null {
  return /^\d{1,7}$/.test(v.trim()) ? Number(v.trim()) : null;
}

/** Cria ou atualiza um produto e seus tamanhos. `id` nulo = produto novo. */
export async function salvarProduto(id: string | null, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  // Devolve tudo o que foi digitado (menos arquivos) para o formulário não perder edições quando há erro.
  const valores = Object.fromEntries([...dados.entries()].filter((e): e is [string, string] => typeof e[1] === "string" && !e[0].startsWith("$ACTION")));

  const parsed = produtoSchema.safeParse({
    nome: texto(dados, "nome"),
    subtitulo: texto(dados, "subtitulo"),
    forma: texto(dados, "forma"),
    sabores: texto(dados, "sabores"),
    descricao: texto(dados, "descricao"),
    comoUsar: texto(dados, "comoUsar"),
    ingredientes: texto(dados, "ingredientes"),
    porcao: texto(dados, "porcao"),
    tabela: texto(dados, "tabela"),
    objetivos: dados.getAll("objetivos").filter((v): v is string => typeof v === "string"),
    selos: dados.getAll("selos").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };
  const p = parsed.data;

  const tabela = lerTabela(p.tabela);
  if (p.forma !== "kits" && tabela.length === 0) {
    return { erros: { tabela: 'Informe ao menos uma linha, no formato "Componente | Quantidade | %VD".' }, valores };
  }
  const sabores = p.sabores ? p.sabores.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const descricao = p.descricao.split(/\r?\n\s*\r?\n/).map((x) => x.trim()).filter(Boolean);

  // Tamanhos existentes (campos t-<id>-*) e um novo opcional (t-novo-*).
  const existentes = id ? await prisma.tamanho.findMany({ where: { produtoId: id }, select: { id: true, codigo: true } }) : [];
  const atualizacoes: { id: string; dados: z.infer<typeof tamanhoSchema> }[] = [];
  for (const t of existentes) {
    const preco = parseReais(texto(dados, `t-${t.id}-preco`));
    const deTexto = texto(dados, `t-${t.id}-precoDe`).trim();
    const precoDe = deTexto ? parseReais(deTexto) : null;
    const estoque = inteiro(texto(dados, `t-${t.id}-estoque`));
    if (preco === null || estoque === null || (deTexto && precoDe === null)) return { erro: `Tamanho "${t.codigo}": confira preço, preço "de" e estoque (use números).`, valores };
    const r = tamanhoSchema.safeParse({ rotulo: texto(dados, `t-${t.id}-rotulo`), preco, precoDe, estoque });
    if (!r.success) return { erro: `Tamanho "${t.codigo}": ${r.error.issues[0].message}`, valores };
    if (r.data.precoDe !== null && r.data.precoDe <= r.data.preco) return { erro: `Tamanho "${t.codigo}": o preço "de" precisa ser maior que o preço atual.`, valores };
    atualizacoes.push({ id: t.id, dados: r.data });
  }

  let novo: ({ codigo: string } & z.infer<typeof tamanhoSchema>) | null = null;
  const codigoNovo = texto(dados, "t-novo-codigo").trim().toLowerCase();
  if (codigoNovo || !id) {
    if (!/^[a-z0-9-]{1,20}$/.test(codigoNovo)) return { erro: "Código do tamanho: use 1 a 20 letras minúsculas, números ou hífen (ex.: 60, 30ml).", valores };
    if (existentes.some((t) => t.codigo === codigoNovo)) return { erro: `Já existe um tamanho "${codigoNovo}" neste produto.`, valores };
    const precoDeTexto = texto(dados, "t-novo-precoDe").trim();
    const r = tamanhoSchema.safeParse({
      rotulo: texto(dados, "t-novo-rotulo"),
      preco: parseReais(texto(dados, "t-novo-preco")),
      precoDe: precoDeTexto ? parseReais(precoDeTexto) : null,
      estoque: inteiro(texto(dados, "t-novo-estoque") || "0"),
    });
    if (!r.success) return { erro: "Novo tamanho: preencha nome, preço e estoque com números válidos.", valores };
    novo = { codigo: codigoNovo, ...r.data };
  }

  const forma = formas.find((f) => f.id === p.forma)!;
  const comuns = {
    nome: p.nome,
    subtitulo: p.subtitulo,
    forma: p.forma,
    objetivos: p.objetivos,
    selos: p.selos,
    sabores,
    descricao,
    comoUsar: p.comoUsar,
    ingredientes: p.ingredientes,
    porcao: p.porcao,
    tabela: tabela as Prisma.InputJsonValue,
    receita: texto(dados, "receita") === "on",
    ativo: texto(dados, "ativo") === "on",
  };

  let slug: string;
  if (id) {
    const atual = await prisma.produto.findUnique({ where: { id }, select: { slug: true } });
    if (!atual) return { erro: "Produto não encontrado.", valores };
    slug = atual.slug;
    await prisma.$transaction(async (tx) => {
      await tx.produto.update({ where: { id }, data: comuns });
      for (const [i, a] of atualizacoes.entries()) {
        await tx.tamanho.update({ where: { id: a.id }, data: { rotulo: a.dados.rotulo, preco: a.dados.preco, precoDe: a.dados.precoDe, estoque: a.dados.estoque, ordem: i } });
      }
      if (novo) {
        await tx.tamanho.create({ data: { produtoId: id, codigo: novo.codigo, rotulo: novo.rotulo, preco: novo.preco, precoDe: novo.precoDe, estoque: novo.estoque, ordem: atualizacoes.length } });
      }
    });
  } else {
    const base = slugify(p.nome);
    if (!base) return { erros: { nome: "Use letras ou números no nome." }, valores };
    slug = base;
    for (let n = 2; await prisma.produto.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`;
    const maior = await prisma.produto.aggregate({ _max: { ordem: true } });
    const criado = await prisma.produto.create({
      data: {
        slug,
        ...comuns,
        artKind: forma.art,
        artAccent: forma.accent,
        fundo: forma.fundo,
        faq: [
          { q: `Posso usar ${p.nome} todos os dias?`, a: "O uso deve seguir a orientação do seu prescritor e a recomendação indicada no rótulo." },
          { q: "Como a fórmula é conservada?", a: "Mantenha em local fresco e seco, ao abrigo da luz e fora do alcance de crianças." },
        ],
        ordem: (maior._max.ordem ?? 0) + 10,
        tamanhos: { create: [{ codigo: novo!.codigo, rotulo: novo!.rotulo, preco: novo!.preco, precoDe: novo!.precoDe, estoque: novo!.estoque, ordem: 0 }] },
      },
      select: { id: true },
    });
    atualizarVitrine(slug);
    redirect(`/admin/produtos/${criado.id}?criado=1`);
  }

  atualizarVitrine(slug);
  return { ok: "Produto salvo. A vitrine já mostra a alteração.", valores };
}

/** Ajuste rápido de estoque direto da lista. */
export async function ajustarEstoque(tamanhoId: string, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const qtd = inteiro(texto(dados, "estoque"));
  if (qtd === null) return { erro: "Informe um número inteiro." };
  const t = await prisma.tamanho.update({ where: { id: z.string().min(1).max(40).parse(tamanhoId) }, data: { estoque: qtd }, select: { produto: { select: { slug: true } } } });
  atualizarVitrine(t.produto.slug);
  return { ok: "Salvo." };
}

/* ---------- cupons ---------- */

const cupomSchema = z.object({
  codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 a 30 letras, números, hífen ou sublinhado."),
  tipo: z.enum(["PERCENTUAL", "FRETE_GRATIS"]),
  percentual: z.number().int().min(0).max(100),
  validoAte: z.date().nullable(),
  usosMax: z.number().int().min(1).max(1_000_000).nullable(),
});

export async function criarCupom(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const valores = { codigo: texto(dados, "codigo"), tipo: texto(dados, "tipo"), percentual: texto(dados, "percentual"), validoAte: texto(dados, "validoAte"), usosMax: texto(dados, "usosMax") };
  const validade = valores.validoAte ? new Date(`${valores.validoAte}T23:59:59-03:00`) : null;
  const parsed = cupomSchema.safeParse({
    codigo: valores.codigo,
    tipo: valores.tipo,
    percentual: valores.tipo === "PERCENTUAL" ? inteiro(valores.percentual) : 0,
    validoAte: validade && !Number.isNaN(validade.getTime()) ? validade : null,
    usosMax: valores.usosMax ? inteiro(valores.usosMax) : null,
  });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };
  if (parsed.data.tipo === "PERCENTUAL" && (parsed.data.percentual < 1 || parsed.data.percentual > 90)) return { erros: { percentual: "Informe um percentual de 1 a 90." }, valores };
  const existe = await prisma.cupom.findUnique({ where: { codigo: parsed.data.codigo }, select: { id: true } });
  if (existe) return { erros: { codigo: "Já existe um cupom com este código." }, valores };
  await prisma.cupom.create({ data: parsed.data });
  revalidatePath("/admin/cupons");
  return { ok: `Cupom ${parsed.data.codigo} criado.` };
}

export async function alternarCupom(cupomId: string): Promise<void> {
  await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const c = await prisma.cupom.findUnique({ where: { id: z.string().min(1).max(40).parse(cupomId) }, select: { id: true, ativo: true } });
  if (c) await prisma.cupom.update({ where: { id: c.id }, data: { ativo: !c.ativo } });
  revalidatePath("/admin/cupons");
}

/* ---------- mensagens ---------- */

export async function alternarMensagemLida(mensagemId: string): Promise<void> {
  await exigirEquipeNaAcao();
  const m = await prisma.mensagemContato.findUnique({ where: { id: z.string().min(1).max(40).parse(mensagemId) }, select: { id: true, lida: true } });
  if (m) await prisma.mensagemContato.update({ where: { id: m.id }, data: { lida: !m.lida } });
  revalidatePath("/admin", "layout");
}
