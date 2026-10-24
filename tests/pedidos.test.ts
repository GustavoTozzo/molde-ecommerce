import "dotenv/config";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cancelarPedido, confirmarPagamentoSimulado, criarPedido, type EntradaPedido } from "../server/pedidos";
import { prisma } from "../server/prisma";

/**
 * Testes de integração do pedido contra o Postgres LOCAL. Rodam com
 * `npm run test` (precisa do banco de pé e do seed aplicado).
 * Recusam-se a rodar contra qualquer banco que não seja local.
 */

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url)) {
  throw new Error("Estes testes alteram dados e só rodam contra um banco local.");
}

const ENDERECO = { cep: "01310-100", logradouro: "Av. Teste", numero: "1", bairro: "Centro", cidade: "São Paulo", uf: "SP" };
const SIMPLES = { slug: "magnesio-bisglicinato-300", tamanhoId: "30", preco: 4990 };
const COM_RECEITA = { slug: "vitamina-d3-50000" };

let usuarioId = "";
let estoqueOriginal = 0;
let tamanhoDbId = "";
let usosOriginais: { codigo: string; usos: number }[] = [];

function entrada(extra: Partial<EntradaPedido> = {}): EntradaPedido {
  return {
    usuarioId,
    itens: [{ slug: SIMPLES.slug, tamanhoId: SIMPLES.tamanhoId, qtd: 1, frequencia: "unica" }],
    endereco: ENDERECO,
    formaPagamento: "CARTAO",
    cartaoFinal4: "4242",
    receita: null,
    chave: randomUUID(),
    ...extra,
  };
}

async function estoque(): Promise<number> {
  return (await prisma.tamanho.findUniqueOrThrow({ where: { id: tamanhoDbId }, select: { estoque: true } })).estoque;
}

async function definirEstoque(n: number) {
  await prisma.tamanho.update({ where: { id: tamanhoDbId }, data: { estoque: n } });
}

before(async () => {
  const usuario = await prisma.usuario.create({
    data: { nome: "Teste de pedidos", email: `teste.pedidos.${Date.now()}@casamagistral.exemplo`, senhaHash: await bcrypt.hash("nao-usada-123", 4) },
  });
  usuarioId = usuario.id;
  const t = await prisma.tamanho.findFirstOrThrow({ where: { codigo: SIMPLES.tamanhoId, produto: { slug: SIMPLES.slug } } });
  tamanhoDbId = t.id;
  estoqueOriginal = t.estoque;
  usosOriginais = await prisma.cupom.findMany({ select: { codigo: true, usos: true } });
});

after(async () => {
  await definirEstoque(estoqueOriginal);
  await prisma.cupom.deleteMany({ where: { codigo: { startsWith: "TESTE" } } });
  for (const c of usosOriginais) await prisma.cupom.updateMany({ where: { codigo: c.codigo }, data: { usos: c.usos } });
  await prisma.assinatura.deleteMany({ where: { usuarioId } });
  await prisma.pedido.deleteMany({ where: { usuarioId } });
  await prisma.receita.deleteMany({ where: { usuarioId } });
  await prisma.usuario.delete({ where: { id: usuarioId } });
  await prisma.$disconnect();
});

describe("criação de pedido", () => {
  test("cartão aprovado: grava totais, snapshot dos itens, baixa o estoque e vai direto para preparo", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada({ itens: [{ slug: SIMPLES.slug, tamanhoId: SIMPLES.tamanhoId, qtd: 2, frequencia: "unica" }] }));
    assert.ok(r.ok);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId }, include: { itens: true } });
    assert.equal(p.subtotal, SIMPLES.preco * 2);
    assert.equal(p.total, SIMPLES.preco * 2 + p.frete);
    assert.equal(p.status, "EM_PREPARO");
    assert.equal(p.statusPagamento, "CONFIRMADO");
    assert.equal(p.cartaoFinal4, "4242");
    assert.equal(p.itens.length, 1);
    assert.equal(p.itens[0].nome, "Magnésio Bisglicinato 300 mg");
    assert.equal(p.itens[0].precoUnitario, SIMPLES.preco);
    assert.equal(await estoque(), 8);
  });

  test("frete grátis acima do mínimo e frete fixo abaixo dele", async () => {
    await definirEstoque(50);
    const barato = await criarPedido(entrada());
    const caro = await criarPedido(entrada({ itens: [{ slug: SIMPLES.slug, tamanhoId: SIMPLES.tamanhoId, qtd: 6, frequencia: "unica" }] }));
    assert.ok(barato.ok && caro.ok);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: barato.pedidoId } })).frete, 1990);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: caro.pedidoId } })).frete, 0);
  });

  test("Pix fica aguardando pagamento; confirmar leva a preparo e só funciona uma vez", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada({ formaPagamento: "PIX", cartaoFinal4: undefined }));
    assert.ok(r.ok);
    const antes = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } });
    assert.equal(antes.status, "AGUARDANDO_PAGAMENTO");
    assert.equal(antes.statusPagamento, "PENDENTE");
    assert.match(antes.codigoPagamento ?? "", /^PIX-SIMULADO-/);
    assert.equal(await confirmarPagamentoSimulado(r.pedidoId, usuarioId), true);
    assert.equal(await confirmarPagamentoSimulado(r.pedidoId, usuarioId), false);
    const depois = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } });
    assert.equal(depois.status, "EM_PREPARO");
    assert.equal(depois.statusPagamento, "CONFIRMADO");
  });

  test("outra pessoa não consegue confirmar o pagamento do pedido alheio", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada({ formaPagamento: "BOLETO", cartaoFinal4: undefined }));
    assert.ok(r.ok);
    assert.equal(await confirmarPagamentoSimulado(r.pedidoId, "id-de-outra-pessoa"), false);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } })).status, "AGUARDANDO_PAGAMENTO");
  });

  test("cartão recusado (final 0002) não cria pedido nem mexe no estoque", async () => {
    await definirEstoque(10);
    const antes = await prisma.pedido.count({ where: { usuarioId } });
    const r = await criarPedido(entrada({ cartaoFinal4: "0002" }));
    assert.equal(r.ok, false);
    assert.equal(await prisma.pedido.count({ where: { usuarioId } }), antes);
    assert.equal(await estoque(), 10);
  });

  test("item de venda sob receita exige o arquivo; com ele o pedido aguarda a conferência", async () => {
    const itens = [{ slug: COM_RECEITA.slug, tamanhoId: (await prisma.tamanho.findFirstOrThrow({ where: { produto: { slug: COM_RECEITA.slug } }, orderBy: { ordem: "asc" } })).codigo, qtd: 1, frequencia: "unica" as const }];
    const sem = await criarPedido(entrada({ itens }));
    assert.equal(sem.ok, false);
    const com = await criarPedido(
      entrada({ itens, receita: { nomeArquivo: "receita.pdf", tipoMime: "application/pdf", conteudo: new Uint8Array(Buffer.from("%PDF-1.4 teste")) } }),
    );
    assert.ok(com.ok);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id: com.pedidoId }, include: { receita: true } });
    assert.equal(p.status, "AGUARDANDO_RECEITA");
    assert.equal(p.receita?.status, "PENDENTE");
    assert.equal(p.receita?.tamanhoBytes, 14);
  });

  test("tamanho ou produto inexistente é recusado", async () => {
    assert.equal((await criarPedido(entrada({ itens: [{ slug: SIMPLES.slug, tamanhoId: "999", qtd: 1, frequencia: "unica" }] }))).ok, false);
    assert.equal((await criarPedido(entrada({ itens: [{ slug: "nao-existe", tamanhoId: "30", qtd: 1, frequencia: "unica" }] }))).ok, false);
  });

  test("sabor inválido ou ausente é recusado quando o produto tem sabores", async () => {
    const t = (await prisma.tamanho.findFirstOrThrow({ where: { produto: { slug: "magnesio-teanina-limao" } }, orderBy: { ordem: "asc" } })).codigo;
    const base = { slug: "magnesio-teanina-limao", tamanhoId: t, qtd: 1, frequencia: "unica" as const };
    assert.equal((await criarPedido(entrada({ itens: [base] }))).ok, false);
    assert.equal((await criarPedido(entrada({ itens: [{ ...base, sabor: "Sabor Inventado" }] }))).ok, false);
  });

  test("assinatura gera registro de assinatura e aplica o desconto de assinatura", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada({ itens: [{ slug: SIMPLES.slug, tamanhoId: SIMPLES.tamanhoId, qtd: 1, frequencia: "2" }] }));
    assert.ok(r.ok);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId }, include: { itens: true, assinaturas: true } });
    assert.equal(p.itens[0].frequencia, "BIMESTRAL");
    assert.equal(p.itens[0].precoUnitario, Math.round(SIMPLES.preco * 0.85));
    assert.equal(p.itens[0].precoTabela, SIMPLES.preco);
    assert.equal(p.assinaturas.length, 1);
    assert.equal(p.assinaturas[0].status, "ATIVA");
  });
});

describe("idempotência e concorrência", () => {
  test("repetir a mesma chave devolve o mesmo pedido e baixa o estoque uma vez só", async () => {
    await definirEstoque(10);
    const e = entrada();
    const a = await criarPedido(e);
    const b = await criarPedido(e);
    assert.ok(a.ok && b.ok);
    assert.equal(a.pedidoId, b.pedidoId);
    assert.equal(await estoque(), 9);
  });

  test("duas requisições simultâneas com a mesma chave resultam em um único pedido", async () => {
    await definirEstoque(10);
    const e = entrada();
    const [a, b] = await Promise.all([criarPedido(e), criarPedido(e)]);
    assert.ok(a.ok && b.ok);
    assert.equal(a.pedidoId, b.pedidoId);
    assert.equal(await prisma.pedido.count({ where: { usuarioId, chaveIdempotencia: e.chave } }), 1);
    assert.equal(await estoque(), 9);
  });

  test("8 compras simultâneas com 3 unidades em estoque: exatamente 3 passam, o estoque nunca fica negativo", async () => {
    await definirEstoque(3);
    const resultados = await Promise.all(Array.from({ length: 8 }, () => criarPedido(entrada())));
    const ok = resultados.filter((r) => r.ok).length;
    assert.equal(ok, 3);
    assert.equal(resultados.filter((r) => !r.ok && /Estoque insuficiente/.test(r.erro)).length, 5);
    assert.equal(await estoque(), 0);
  });
});

describe("cupom", () => {
  test("percentual: desconto calculado no servidor e uso contabilizado", async () => {
    await definirEstoque(10);
    const antes = (await prisma.cupom.findUniqueOrThrow({ where: { codigo: "BEMVINDO10" } })).usos;
    // Pix: o pedido fica aguardando pagamento, estado em que o cliente ainda pode cancelar.
    const r = await criarPedido(entrada({ cupomCodigo: "bemvindo10", formaPagamento: "PIX", cartaoFinal4: undefined }));
    assert.ok(r.ok);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } });
    assert.equal(p.descontoCupom, Math.round(SIMPLES.preco * 0.1));
    assert.equal(p.cupomCodigo, "BEMVINDO10");
    assert.equal((await prisma.cupom.findUniqueOrThrow({ where: { codigo: "BEMVINDO10" } })).usos, antes + 1);
    assert.equal(await cancelarPedido(r.pedidoId, usuarioId), true);
    assert.equal((await prisma.cupom.findUniqueOrThrow({ where: { codigo: "BEMVINDO10" } })).usos, antes);
  });

  test("cupom de frete grátis zera o frete", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada({ cupomCodigo: "FRETEGRATIS" }));
    assert.ok(r.ok);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } })).frete, 0);
  });

  test("cupom inexistente, vencido ou esgotado é recusado", async () => {
    await definirEstoque(10);
    assert.equal((await criarPedido(entrada({ cupomCodigo: "NAOEXISTE" }))).ok, false);
    await prisma.cupom.create({ data: { codigo: "TESTEVENCIDO", tipo: "PERCENTUAL", percentual: 50, validoAte: new Date(Date.now() - 86_400_000) } });
    assert.equal((await criarPedido(entrada({ cupomCodigo: "TESTEVENCIDO" }))).ok, false);
    await prisma.cupom.create({ data: { codigo: "TESTEUMUSO", tipo: "PERCENTUAL", percentual: 5, usosMax: 1 } });
    assert.ok((await criarPedido(entrada({ cupomCodigo: "TESTEUMUSO" }))).ok);
    assert.equal((await criarPedido(entrada({ cupomCodigo: "TESTEUMUSO" }))).ok, false);
  });

  test("duas compras simultâneas com um cupom de uso único: só uma passa e o estoque da outra volta", async () => {
    await definirEstoque(10);
    await prisma.cupom.create({ data: { codigo: "TESTECORRIDA", tipo: "PERCENTUAL", percentual: 5, usosMax: 1 } });
    const [a, b] = await Promise.all([criarPedido(entrada({ cupomCodigo: "TESTECORRIDA" })), criarPedido(entrada({ cupomCodigo: "TESTECORRIDA" }))]);
    assert.equal([a, b].filter((r) => r.ok).length, 1);
    assert.equal(await estoque(), 9);
  });
});

describe("cancelamento", () => {
  test("devolve o estoque, estorna o cartão e encerra a assinatura; não cancela duas vezes", async () => {
    await definirEstoque(10);
    const r = await criarPedido(
      entrada({ receita: null, itens: [{ slug: SIMPLES.slug, tamanhoId: SIMPLES.tamanhoId, qtd: 2, frequencia: "1" }], formaPagamento: "PIX", cartaoFinal4: undefined }),
    );
    assert.ok(r.ok);
    assert.equal(await estoque(), 8);
    assert.equal(await cancelarPedido(r.pedidoId, usuarioId), true);
    assert.equal(await estoque(), 10);
    assert.equal(await cancelarPedido(r.pedidoId, usuarioId), false);
    assert.equal(await estoque(), 10);
    const p = await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId }, include: { assinaturas: true } });
    assert.equal(p.status, "CANCELADO");
    assert.equal(p.assinaturas[0].status, "CANCELADA");
  });

  test("pedido de cartão já aprovado em estado cancelável é estornado", async () => {
    await definirEstoque(10);
    const itens = [{ slug: COM_RECEITA.slug, tamanhoId: (await prisma.tamanho.findFirstOrThrow({ where: { produto: { slug: COM_RECEITA.slug } }, orderBy: { ordem: "asc" } })).codigo, qtd: 1, frequencia: "unica" as const }];
    const r = await criarPedido(entrada({ itens, receita: { nomeArquivo: "r.pdf", tipoMime: "application/pdf", conteudo: new Uint8Array(Buffer.from("%PDF-1.4")) } }));
    assert.ok(r.ok);
    assert.equal(await cancelarPedido(r.pedidoId, usuarioId), true);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } })).statusPagamento, "ESTORNADO");
  });

  test("cliente não cancela pedido já em preparo, nem o de outra pessoa", async () => {
    await definirEstoque(10);
    const r = await criarPedido(entrada());
    assert.ok(r.ok);
    assert.equal(await cancelarPedido(r.pedidoId, usuarioId), false);
    assert.equal((await prisma.pedido.findUniqueOrThrow({ where: { id: r.pedidoId } })).status, "EM_PREPARO");
    const pix = await criarPedido(entrada({ formaPagamento: "PIX", cartaoFinal4: undefined }));
    assert.ok(pix.ok);
    assert.equal(await cancelarPedido(pix.pedidoId, "id-de-outra-pessoa"), false);
  });
});
