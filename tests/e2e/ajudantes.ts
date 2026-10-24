import "dotenv/config";
import { expect, type Page } from "@playwright/test";
import { criarClientePrisma } from "../../server/cliente-prisma";
import { SEGREDO_REVALIDAR, URL_BASE } from "./constantes";

const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1|\[::1\]|postgres)[:/]/.test(url)) {
  throw new Error("Os testes de ponta a ponta alteram dados e só rodam contra um banco local ou de CI.");
}

export const db = criarClientePrisma();

function exigir(nome: string): string {
  const v = process.env[nome];
  if (!v) throw new Error(`${nome} não definida (veja .env.example).`);
  return v;
}

export const CRED = {
  cliente: { email: exigir("CLIENTE_SEED_EMAIL"), senha: exigir("CLIENTE_SEED_PASSWORD") },
  farmaceutica: { email: exigir("FARMACEUTICO_SEED_EMAIL"), senha: exigir("FARMACEUTICO_SEED_PASSWORD") },
  admin: { email: exigir("ADMIN_SEED_EMAIL"), senha: exigir("ADMIN_SEED_PASSWORD") },
};

export const ESTADO_AUTH = { cliente: "tests/e2e/.auth/cliente.json", farmaceutica: "tests/e2e/.auth/farmaceutica.json", admin: "tests/e2e/.auth/admin.json" };

export const ESTOQUE_SEED = 200;
export const MAGNESIO = { slug: "magnesio-bisglicinato-300", tamanhoId: "30", preco: 4990 };
export const COM_RECEITA = { slug: "vitamina-d3-50000" };

/**
 * Volta o banco ao estado do seed (o que os testes alteram): pedidos, receitas, assinaturas e
 * endereços extras do cliente, favoritos, usuários e produtos de teste, cupons de teste, estoque,
 * papéis das contas do seed e as filas de contato/newsletter.
 */
export async function resetar() {
  const cliente = await db.usuario.findUnique({ where: { email: CRED.cliente.email }, select: { id: true } });
  const testes = await db.usuario.findMany({ where: { email: { startsWith: "teste." } }, select: { id: true } });
  const donos = [...(cliente ? [cliente.id] : []), ...testes.map((u) => u.id)];

  await db.assinatura.deleteMany({ where: { usuarioId: { in: donos } } });
  await db.pedido.deleteMany({ where: { usuarioId: { in: donos } } });
  await db.receita.deleteMany({ where: { usuarioId: { in: donos } } });
  await db.favorito.deleteMany({ where: { usuarioId: { in: donos } } });
  if (cliente) {
    await db.endereco.deleteMany({ where: { usuarioId: cliente.id, NOT: { logradouro: "Rua Exemplo" } } });
    await db.usuario.update({ where: { id: cliente.id }, data: { telefone: null } });
  }
  await db.usuario.deleteMany({ where: { email: { startsWith: "teste." } } });
  await db.produto.deleteMany({ where: { slug: { startsWith: "produto-teste" } } });
  await db.cupom.deleteMany({ where: { codigo: { startsWith: "TESTE" } } });
  await db.cupom.updateMany({ data: { usos: 0 } });
  await db.tamanho.updateMany({ data: { estoque: ESTOQUE_SEED } });
  // preço e visibilidade do produto que os testes do painel editam
  await db.tamanho.updateMany({ where: { codigo: MAGNESIO.tamanhoId, produto: { slug: MAGNESIO.slug } }, data: { preco: MAGNESIO.preco } });
  await db.produto.updateMany({ where: { slug: MAGNESIO.slug }, data: { ativo: true } });
  for (const [email, papel] of [
    [CRED.admin.email, "ADMINISTRADOR"],
    [CRED.farmaceutica.email, "FARMACEUTICO"],
    [CRED.cliente.email, "CLIENTE"],
  ] as const) {
    await db.usuario.updateMany({ where: { email }, data: { papel, ativo: true } });
  }
  await db.mensagemContato.deleteMany({ where: { email: { endsWith: "@teste.example" } } });
  await db.inscritoNewsletter.deleteMany({ where: { email: { endsWith: "@teste.example" } } });
  await db.$executeRawUnsafe(`ALTER SEQUENCE pedidos_numero_seq RESTART WITH 1`);
  // As alterações acima foram feitas direto no banco, por fora do app: descarta o cache do catálogo
  // para a vitrine voltar a refletir o banco (o painel faz isso sozinho com updateTag).
  const r = await fetch(`${URL_BASE}/api/revalidar`, { method: "POST", headers: { "x-revalidate-secret": SEGREDO_REVALIDAR } });
  if (!r.ok) throw new Error(`Não foi possível invalidar o cache do catálogo (${r.status}).`);
}

export async function estoqueDe(slug: string, codigo: string): Promise<number> {
  const t = await db.tamanho.findFirstOrThrow({ where: { codigo, produto: { slug } }, select: { estoque: true } });
  return t.estoque;
}

/** Cria um usuário de teste direto no banco (para cenários que não passam pelo cadastro). */
export const ESTADO_CARRINHO = "casa-magistral:estado:v2";

export interface ItemTeste {
  slug: string;
  tamanhoId: string;
  qtd: number;
  sabor?: string;
  frequencia?: "unica" | "1" | "2" | "3";
}

/**
 * Coloca itens no carrinho do navegador (localStorage), como se a pessoa os tivesse adicionado.
 * Semeia ANTES do próximo carregamento de página (initScript de uso único): se escrevesse depois
 * da página carregada, o estado em memória do app (que persiste tudo a cada mudança, inclusive a
 * sincronização de favoritos logo após o login) sobrescreveria o que foi escrito.
 */
export async function colocarNoCarrinho(page: Page, itens: ItemTeste[], cupom: { codigo: string; tipo: "PERCENTUAL" | "FRETE_GRATIS"; percentual: number } | null = null) {
  const estado = JSON.stringify({
    itens: itens.map((i) => ({ key: `${i.slug}|${i.tamanhoId}|${i.sabor ?? ""}|${i.frequencia ?? "unica"}`, frequencia: "unica", ...i })),
    cupom,
    favoritos: [],
    favoritosDeConta: false,
  });
  const marca = `__semeado_${Date.now()}_${Math.random()}`;
  await page.addInitScript(
    ([k, v, m]) => {
      if (sessionStorage.getItem(m)) return;
      sessionStorage.setItem(m, "1");
      localStorage.setItem(k, v);
    },
    [ESTADO_CARRINHO, estado, marca],
  );
}

export async function preencherCartao(page: Page, numero = "4242 4242 4242 4242") {
  await page.getByLabel("Número do cartão").fill(numero);
  await page.getByLabel("Nome impresso no cartão").fill("PESSOA DE TESTE");
  await page.getByLabel("Validade (MM/AA)").fill("1230");
  await page.getByLabel("Código (CVV)").fill("123");
}

/** Abre o checkout e confirma o pedido; devolve o id do pedido criado. */
export async function finalizar(page: Page): Promise<string> {
  await page.getByRole("button", { name: /Confirmar pedido/ }).click();
  await page.waitForURL(/\/conta\/pedidos\/[a-z0-9]+\?novo=1/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

export async function escolherPagamento(page: Page, forma: "Pix" | "Cartão de crédito" | "Boleto") {
  await page.getByRole("radio", { name: new RegExp(forma) }).check({ force: true });
}

export async function esperarTexto(page: Page, texto: string | RegExp) {
  await expect(page.locator("body")).toContainText(texto);
}

export const SENHA = "senha-teste-2026";

/** Espera a sessão estar de fato aberta (não só a URL mudando) antes de seguir. */
export async function esperarLogado(page: Page) {
  await page.waitForURL("**/conta");
  await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
}

/** Cria a conta pela tela de cadastro (o caminho de verdade) e devolve o e-mail. */
export async function cadastrarPelaTela(page: Page, nome = "Pessoa de Teste"): Promise<string> {
  const email = `teste.${Date.now()}.${Math.floor(Math.random() * 1000)}@casamagistral.exemplo`;
  await page.goto("/entrar");
  const principal = page.getByRole("main");
  await principal.getByRole("tab", { name: "Criar conta" }).click();
  await principal.getByLabel("Nome completo").fill(nome);
  await principal.getByLabel("E-mail", { exact: true }).fill(email);
  await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
  await principal.getByLabel("Repita a senha").fill(SENHA);
  await principal.getByRole("checkbox").check();
  await principal.getByRole("button", { name: "Criar minha conta" }).click();
  await esperarLogado(page);
  return email;
}

export async function sair(page: Page) {
  await page.goto("/conta");
  // Deixa terminar as ações em segundo plano (sincronização de favoritos logo após o login) para a
  // saída não correr contra elas.
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await page.waitForURL((u) => u.pathname === "/");
}

export const PDF_VALIDO = { name: "receita.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF\n") };

/** Primeiro tamanho do produto sob receita usado nos testes. */
export async function itemComReceita(qtd = 1): Promise<ItemTeste> {
  const t = await db.tamanho.findFirstOrThrow({ where: { produto: { slug: COM_RECEITA.slug } }, orderBy: { ordem: "asc" } });
  return { slug: COM_RECEITA.slug, tamanhoId: t.codigo, qtd };
}

/** Compra pela interface (como uma pessoa de verdade) e devolve o id do pedido. `page` precisa estar logada. */
export async function comprarPelaTela(
  page: Page,
  { itens, forma, receita = false }: { itens: ItemTeste[]; forma: "Pix" | "Cartão de crédito" | "Boleto"; receita?: boolean },
): Promise<string> {
  await colocarNoCarrinho(page, itens);
  await page.goto("/checkout");
  await escolherPagamento(page, forma);
  if (forma === "Cartão de crédito") await preencherCartao(page);
  if (receita) await page.getByLabel("Arquivo da receita").setInputFiles(PDF_VALIDO);
  return finalizar(page);
}
