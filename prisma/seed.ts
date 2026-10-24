import "dotenv/config";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { criarClientePrisma } from "../server/cliente-prisma";
import { avaliacoesDoProduto, criadores, especialistas, posts } from "./dados/conteudo";
import { produtos } from "./dados/produtos";

/**
 * Popula o banco com o catálogo FICTÍCIO de demonstração e três usuários de
 * desenvolvimento. É idempotente: pode rodar de novo sem duplicar nada (produtos,
 * especialistas, criadores, posts e cupons são "upsert"; avaliações de exemplo
 * são recriadas).
 */

const prisma = criarClientePrisma();

const SENHAS_DE_DESENVOLVIMENTO = ["dev-admin-2026", "dev-farma-2026", "dev-cliente-2026"];

function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`${nome} não definida (veja .env.example).`);
  return valor;
}

/** "12/10/2026" -> Date ao meio-dia UTC (evita virar o dia anterior em fusos negativos). */
function dataBr(texto: string): Date {
  const [dia, mes, ano] = texto.split("/").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 12));
}

function recusarSenhasPadraoFora(desenvolvimento: boolean, senhas: string[]) {
  if (desenvolvimento) return;
  if (senhas.some((s) => SENHAS_DE_DESENVOLVIMENTO.includes(s))) {
    throw new Error(
      "Recusado: este banco não é local e os usuários do seed usariam as senhas de desenvolvimento. " +
        "Defina senhas próprias em ADMIN_SEED_PASSWORD, FARMACEUTICO_SEED_PASSWORD e CLIENTE_SEED_PASSWORD.",
    );
  }
}

async function usuarios() {
  const definicoes = [
    { papel: "ADMINISTRADOR" as const, nome: "Administração Casa Magistral", prefixo: "ADMIN" },
    { papel: "FARMACEUTICO" as const, nome: "Beatriz Lemos (farmacêutica)", prefixo: "FARMACEUTICO" },
    { papel: "CLIENTE" as const, nome: "Cliente de demonstração", prefixo: "CLIENTE" },
  ].map((d) => ({
    ...d,
    email: exigir(`${d.prefixo}_SEED_EMAIL`).toLowerCase(),
    senha: exigir(`${d.prefixo}_SEED_PASSWORD`),
  }));

  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
  recusarSenhasPadraoFora(
    local && process.env.NODE_ENV !== "production",
    definicoes.map((d) => d.senha),
  );

  for (const d of definicoes) {
    const senhaHash = await bcrypt.hash(d.senha, 12);
    const usuario = await prisma.usuario.upsert({
      where: { email: d.email },
      update: { nome: d.nome, papel: d.papel, senhaHash, ativo: true },
      create: { nome: d.nome, email: d.email, papel: d.papel, senhaHash },
    });
    if (d.papel === "CLIENTE") {
      const tem = await prisma.endereco.count({ where: { usuarioId: usuario.id } });
      if (tem === 0) {
        await prisma.endereco.create({
          data: {
            usuarioId: usuario.id,
            apelido: "Casa",
            cep: "00000-000",
            logradouro: "Rua Exemplo",
            numero: "100",
            bairro: "Centro",
            cidade: "Cidade Exemplo",
            uf: "SP",
            principal: true,
          },
        });
      }
    }
  }
  console.log(`  usuários: ${definicoes.map((d) => `${d.papel.toLowerCase()} <${d.email}>`).join(", ")}`);
}

async function catalogo() {
  const baseNovidades = Date.UTC(2026, 0, 5, 12);
  for (const p of produtos) {
    const dados = {
      nome: p.nome,
      subtitulo: p.subtitulo,
      forma: p.forma,
      objetivos: p.objetivos,
      artKind: p.art.kind,
      artAccent: p.art.accent,
      fundo: p.fundo,
      selos: p.selos,
      sabores: p.sabores ?? [],
      receita: p.receita,
      descricao: p.descricao,
      comoUsar: p.comoUsar,
      ingredientes: p.ingredientes,
      porcao: p.porcao,
      tabela: p.tabela as Prisma.InputJsonValue,
      faq: p.faq as Prisma.InputJsonValue,
      nota: p.nota,
      qtdAvaliacoes: p.avaliacoes,
      vendas: p.vendas,
      ordem: p.ordem,
      publicadoEm: new Date(baseNovidades + p.ordem * 86_400_000),
    };
    const produto = await prisma.produto.upsert({
      where: { slug: p.slug },
      update: dados,
      create: { slug: p.slug, ...dados },
    });
    for (const [i, t] of p.tamanhos.entries()) {
      const tam = { rotulo: t.rotulo, preco: t.preco, precoDe: t.precoDe ?? null, ordem: i };
      await prisma.tamanho.upsert({
        where: { produtoId_codigo: { produtoId: produto.id, codigo: t.id } },
        update: tam,
        create: { produtoId: produto.id, codigo: t.id, estoque: 200, ...tam },
      });
    }
    // Avaliações de exemplo (marcadas como tal) são regeradas; as reais nunca são tocadas.
    await prisma.avaliacao.deleteMany({ where: { produtoId: produto.id, exemplo: true } });
    await prisma.avaliacao.createMany({
      data: avaliacoesDoProduto(p.slug).map((a) => ({
        produtoId: produto.id,
        nomeExibicao: a.nome,
        nota: a.nota,
        titulo: a.titulo,
        texto: a.texto,
        util: a.util,
        exemplo: true,
        criadoEm: dataBr(a.data),
      })),
    });
  }
  console.log(`  produtos: ${produtos.length} (com tamanhos e avaliações de exemplo)`);
}

async function conteudo() {
  for (const [i, e] of especialistas.entries()) {
    const dados = { nome: e.nome, titulo: e.titulo, registro: e.registro, bio: e.bio, citacao: e.citacao, avatar: e.avatar, ordem: i };
    const registro = await prisma.especialista.upsert({ where: { slug: e.slug }, update: dados, create: { slug: e.slug, ...dados } });
    await prisma.produtoDeEspecialista.deleteMany({ where: { especialistaId: registro.id } });
    for (const [ordem, slug] of e.selecao.entries()) {
      const produto = await prisma.produto.findUniqueOrThrow({ where: { slug }, select: { id: true } });
      await prisma.produtoDeEspecialista.create({ data: { especialistaId: registro.id, produtoId: produto.id, ordem } });
    }
  }
  for (const [i, c] of criadores.entries()) {
    const produto = await prisma.produto.findUniqueOrThrow({ where: { slug: c.produto }, select: { id: true } });
    const dados = { avatar: c.avatar, legenda: c.legenda, produtoId: produto.id, ordem: i };
    await prisma.criador.upsert({ where: { handle: c.handle }, update: dados, create: { handle: c.handle, ...dados } });
  }
  for (const p of posts) {
    const dados = {
      titulo: p.titulo,
      resumo: p.resumo,
      categoria: p.categoria,
      leitura: p.leitura,
      artKind: p.art,
      artAccent: p.accent,
      fundo: p.fundo,
      publicadoEm: dataBr(p.data),
    };
    await prisma.post.upsert({ where: { slug: p.slug }, update: dados, create: { slug: p.slug, ...dados } });
  }
  console.log(`  especialistas: ${especialistas.length}, criadores: ${criadores.length}, posts: ${posts.length}`);
}

async function cupons() {
  await prisma.cupom.upsert({
    where: { codigo: "BEMVINDO10" },
    update: { tipo: "PERCENTUAL", percentual: 10, ativo: true },
    create: { codigo: "BEMVINDO10", tipo: "PERCENTUAL", percentual: 10 },
  });
  await prisma.cupom.upsert({
    where: { codigo: "FRETEGRATIS" },
    update: { tipo: "FRETE_GRATIS", percentual: 0, ativo: true },
    create: { codigo: "FRETEGRATIS", tipo: "FRETE_GRATIS" },
  });
  console.log("  cupons: BEMVINDO10, FRETEGRATIS");
}

async function main() {
  console.log("Populando o banco…");
  await usuarios();
  await catalogo();
  await conteudo();
  await cupons();
  console.log("Pronto.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
