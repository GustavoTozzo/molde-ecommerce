import "server-only";
import type { FormaPagamento, FrequenciaEntrega, Prisma, StatusPagamento, StatusPedido } from "@prisma/client";
import { calcularCarrinho, chaveItem, type Frequencia, type ItemCarrinho } from "@/lib/carrinho";
import { parcelamento } from "@/lib/format";
import { site } from "@/lib/site";
import { paraResumo } from "./mapeadores";
import { buscarCupomValido } from "./cupons";
import { simularCobranca } from "./pagamento";
import { prisma } from "./prisma";

/** Falha esperada, com mensagem própria para a pessoa (estoque, cupom, item indisponível…). */
export class ErroDeNegocio extends Error {}

const FREQUENCIA: Record<Frequencia, FrequenciaEntrega> = { unica: "UNICA", "1": "MENSAL", "2": "BIMESTRAL", "3": "TRIMESTRAL" };
const MESES: Record<Frequencia, number> = { unica: 0, "1": 1, "2": 2, "3": 3 };

export interface ItemEntrada {
  slug: string;
  tamanhoId: string;
  sabor?: string;
  qtd: number;
  frequencia: Frequencia;
}

export interface EnderecoEntrega {
  apelido?: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface ArquivoReceita {
  nomeArquivo: string;
  tipoMime: string;
  conteudo: Uint8Array<ArrayBuffer>;
}

export interface EntradaPedido {
  usuarioId: string;
  itens: ItemEntrada[];
  cupomCodigo?: string;
  endereco: EnderecoEntrega;
  formaPagamento: FormaPagamento;
  cartaoFinal4?: string;
  /** Só vale para cartão; 1 = à vista. */
  parcelas?: number;
  receita: ArquivoReceita | null;
  chave: string;
}

export type ResultadoCriacao = { ok: true; pedidoId: string } | { ok: false; erro: string };

function somarMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + meses);
  return d;
}

function ehViolacaoUnica(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/**
 * Cria o pedido. Tudo que importa é decidido AQUI, com dados do banco: o navegador só
 * informa o que quer comprar (slug, tamanho, quantidade). Preço, desconto do cupom, frete,
 * exigência de receita e estoque são recalculados e conferidos dentro de uma transação.
 */
export async function criarPedido(entrada: EntradaPedido): Promise<ResultadoCriacao> {
  const existente = await prisma.pedido.findFirst({
    where: { usuarioId: entrada.usuarioId, chaveIdempotencia: entrada.chave },
    select: { id: true },
  });
  if (existente) return { ok: true, pedidoId: existente.id };

  const cobranca = simularCobranca(entrada.formaPagamento, entrada.cartaoFinal4);
  if (cobranca.statusPagamento === "FALHOU") return { ok: false, erro: cobranca.mensagem ?? "Pagamento recusado." };

  try {
    const pedidoId = await prisma.$transaction(
      async (tx) => {
        const slugs = [...new Set(entrada.itens.map((i) => i.slug))];
        const produtos = await tx.produto.findMany({ where: { slug: { in: slugs }, ativo: true }, include: { tamanhos: true } });
        const catalogo = new Map(produtos.map((p) => [p.slug, paraResumo(p)]));
        const idProduto = new Map(produtos.map((p) => [p.slug, p.id]));
        const idTamanho = new Map(produtos.flatMap((p) => p.tamanhos.map((t) => [`${p.slug}|${t.codigo}`, t.id] as const)));

        const itens: ItemCarrinho[] = [];
        for (const i of entrada.itens) {
          const produto = catalogo.get(i.slug);
          const tamanho = produto?.tamanhos.find((t) => t.id === i.tamanhoId);
          if (!produto || !tamanho) throw new ErroDeNegocio("Um dos itens do carrinho não está mais disponível. Revise o carrinho.");
          if (i.sabor && !(produto.sabores ?? []).includes(i.sabor)) throw new ErroDeNegocio(`O sabor escolhido para ${produto.nome} não existe mais.`);
          if (!i.sabor && (produto.sabores?.length ?? 0) > 0) throw new ErroDeNegocio(`Escolha o sabor de ${produto.nome}.`);
          itens.push({ key: chaveItem(i.slug, i.tamanhoId, i.sabor, i.frequencia), slug: i.slug, tamanhoId: i.tamanhoId, sabor: i.sabor, qtd: i.qtd, frequencia: i.frequencia });
        }

        let cupom = null;
        if (entrada.cupomCodigo) {
          cupom = await buscarCupomValido(entrada.cupomCodigo, tx);
          if (!cupom) throw new ErroDeNegocio("O cupom não é mais válido. Remova-o do carrinho para continuar.");
        }

        const resumo = calcularCarrinho(itens, cupom, catalogo);
        if (resumo.linhas.length === 0) throw new ErroDeNegocio("O carrinho está vazio.");
        if (resumo.precisaReceita && !entrada.receita) throw new ErroDeNegocio("Anexe a receita para finalizar: há itens de venda sob receita.");

        const parcelas = entrada.formaPagamento === "CARTAO" ? (entrada.parcelas ?? 1) : 1;
        if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > parcelamento(resumo.total, site.loja.parcelasMax, site.loja.parcelaMinima).parcelas) {
          throw new ErroDeNegocio("Número de parcelas indisponível para este valor.");
        }

        // Baixa de estoque: o UPDATE condicional é atômico, então duas compras simultâneas
        // do último frasco não passam ambas (a segunda encontra 0 linhas e a transação desfaz).
        for (const l of resumo.linhas) {
          const baixa = await tx.tamanho.updateMany({
            where: { id: idTamanho.get(`${l.produto.slug}|${l.tamanho.id}`), estoque: { gte: l.item.qtd } },
            data: { estoque: { decrement: l.item.qtd } },
          });
          if (baixa.count === 0) throw new ErroDeNegocio(`Estoque insuficiente de ${l.produto.nome} (${l.tamanho.rotulo}). Reduza a quantidade ou escolha outro tamanho.`);
        }

        if (cupom) {
          // Conta o uso respeitando o limite. O Prisma não compara colunas entre si, então lê-se
          // `usosMax` e o UPDATE condicional (usos < usosMax) continua atômico.
          const { usosMax } = await tx.cupom.findUniqueOrThrow({ where: { codigo: cupom.codigo }, select: { usosMax: true } });
          const usado = await tx.cupom.updateMany({
            where: { codigo: cupom.codigo, ...(usosMax !== null && { usos: { lt: usosMax } }) },
            data: { usos: { increment: 1 } },
          });
          if (usado.count === 0) throw new ErroDeNegocio("O cupom atingiu o limite de usos.");
        }

        const receita = entrada.receita
          ? await tx.receita.create({
              data: {
                usuarioId: entrada.usuarioId,
                nomeArquivo: entrada.receita.nomeArquivo,
                tipoMime: entrada.receita.tipoMime,
                tamanhoBytes: entrada.receita.conteudo.byteLength,
                conteudo: entrada.receita.conteudo,
              },
              select: { id: true },
            })
          : null;

        const confirmado = cobranca.statusPagamento === "CONFIRMADO";
        const status: StatusPedido = !confirmado ? "AGUARDANDO_PAGAMENTO" : resumo.precisaReceita ? "AGUARDANDO_RECEITA" : "EM_PREPARO";
        const agora = new Date();

        const pedido = await tx.pedido.create({
          data: {
            usuarioId: entrada.usuarioId,
            chaveIdempotencia: entrada.chave,
            status,
            subtotal: resumo.subtotal,
            descontoCupom: resumo.descontoCupom,
            frete: resumo.frete,
            total: resumo.total,
            cupomCodigo: cupom?.codigo ?? null,
            enderecoEntrega: entrada.endereco as unknown as Prisma.InputJsonValue,
            formaPagamento: entrada.formaPagamento,
            statusPagamento: cobranca.statusPagamento,
            codigoPagamento: cobranca.codigoPagamento || null,
            parcelas,
            cartaoFinal4: entrada.formaPagamento === "CARTAO" ? (entrada.cartaoFinal4 ?? null) : null,
            receitaId: receita?.id ?? null,
            itens: {
              create: resumo.linhas.map((l) => ({
                produtoId: idProduto.get(l.produto.slug)!,
                tamanhoId: idTamanho.get(`${l.produto.slug}|${l.tamanho.id}`)!,
                nome: l.produto.nome,
                tamanhoRotulo: l.tamanho.rotulo,
                sabor: l.item.sabor ?? null,
                qtd: l.item.qtd,
                precoTabela: l.tamanho.preco,
                precoUnitario: l.unitario,
                frequencia: FREQUENCIA[l.item.frequencia],
              })),
            },
            assinaturas: {
              create: resumo.linhas
                .filter((l) => l.item.frequencia !== "unica")
                .map((l) => ({
                  usuarioId: entrada.usuarioId,
                  produtoId: idProduto.get(l.produto.slug)!,
                  tamanhoId: idTamanho.get(`${l.produto.slug}|${l.tamanho.id}`)!,
                  sabor: l.item.sabor ?? null,
                  qtd: l.item.qtd,
                  frequencia: FREQUENCIA[l.item.frequencia],
                  proximaEntrega: somarMeses(agora, MESES[l.item.frequencia]),
                })),
            },
          },
          select: { id: true },
        });
        return pedido.id;
      },
      { timeout: 20_000 },
    );
    return { ok: true, pedidoId };
  } catch (e) {
    if (e instanceof ErroDeNegocio) return { ok: false, erro: e.message };
    if (ehViolacaoUnica(e)) {
      // Duas requisições com a mesma chave chegaram juntas: a segunda perde a corrida e devolve o pedido da primeira.
      const igual = await prisma.pedido.findFirst({ where: { usuarioId: entrada.usuarioId, chaveIdempotencia: entrada.chave }, select: { id: true } });
      if (igual) return { ok: true, pedidoId: igual.id };
    }
    throw e;
  }
}

/** Próximo status depois que o pagamento é confirmado. */
export function statusAposPagamento(temReceita: boolean, receitaAprovada: boolean): StatusPedido {
  return temReceita && !receitaAprovada ? "AGUARDANDO_RECEITA" : "EM_PREPARO";
}

/** Demonstração: o cliente "paga" o Pix/boleto fictício. Com gateway real isto vira um webhook. */
export async function confirmarPagamentoSimulado(pedidoId: string, usuarioId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.findFirst({
      where: { id: pedidoId, usuarioId, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "PENDENTE" },
      select: { id: true, receita: { select: { status: true } } },
    });
    if (!p) return false;
    const proximo = statusAposPagamento(p.receita !== null, p.receita?.status === "APROVADA");
    const r = await tx.pedido.updateMany({
      where: { id: p.id, status: "AGUARDANDO_PAGAMENTO", statusPagamento: "PENDENTE" },
      data: { status: proximo, statusPagamento: "CONFIRMADO" },
    });
    return r.count === 1;
  });
}

const CANCELAVEIS_PELO_CLIENTE: StatusPedido[] = ["AGUARDANDO_PAGAMENTO", "AGUARDANDO_RECEITA"];

/**
 * Cancela, devolve o estoque, estorna o pagamento já confirmado e encerra assinaturas
 * criadas pelo pedido. `usuarioId` = dono (cliente); `null` = equipe (sem restrição de dono).
 */
export async function cancelarPedido(pedidoId: string, usuarioId: string | null, statusPermitidos: StatusPedido[] = CANCELAVEIS_PELO_CLIENTE): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.findFirst({
      where: { id: pedidoId, ...(usuarioId && { usuarioId }), status: { in: statusPermitidos } },
      select: { id: true, statusPagamento: true, cupomCodigo: true, itens: { select: { tamanhoId: true, qtd: true } } },
    });
    if (!p) return false;
    const estorno: StatusPagamento = p.statusPagamento === "CONFIRMADO" ? "ESTORNADO" : p.statusPagamento;
    // O updateMany com o status esperado impede cancelar duas vezes (e devolver o estoque duas vezes).
    const r = await tx.pedido.updateMany({
      where: { id: p.id, status: { in: statusPermitidos } },
      data: { status: "CANCELADO", statusPagamento: estorno },
    });
    if (r.count !== 1) return false;
    for (const i of p.itens) {
      await tx.tamanho.update({ where: { id: i.tamanhoId }, data: { estoque: { increment: i.qtd } } });
    }
    if (p.cupomCodigo) {
      await tx.cupom.updateMany({ where: { codigo: p.cupomCodigo, usos: { gt: 0 } }, data: { usos: { decrement: 1 } } });
    }
    await tx.assinatura.updateMany({ where: { pedidoOrigemId: p.id }, data: { status: "CANCELADA" } });
    return true;
  });
}
