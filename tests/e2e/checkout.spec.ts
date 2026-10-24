import { expect, test } from "@playwright/test";
import {
  cadastrarPelaTela,
  colocarNoCarrinho,
  COM_RECEITA,
  db,
  CRED,
  ESTADO_AUTH,
  escolherPagamento,
  estoqueDe,
  finalizar,
  MAGNESIO,
  preencherCartao,
  resetar,
} from "./ajudantes";

const PDF_VALIDO = { name: "receita.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF\n") };

test.describe("checkout", () => {
  test.use({ storageState: ESTADO_AUTH.cliente });
  test.beforeEach(resetar);

  async function itemComReceita() {
    const t = await db.tamanho.findFirstOrThrow({ where: { produto: { slug: COM_RECEITA.slug } }, orderBy: { ordem: "asc" } });
    return { slug: COM_RECEITA.slug, tamanhoId: t.codigo, qtd: 1 };
  }

  test("carrinho vazio mostra o aviso em vez do formulário", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
  });

  test("Pix com cupom e endereço salvo: totais do servidor, estoque, cupom e carrinho esvaziado", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 2 }], { codigo: "BEMVINDO10", tipo: "PERCENTUAL", percentual: 10 });
    await page.goto("/checkout");
    await expect(page.getByRole("radio", { name: /Casa/ })).toBeChecked();
    const id = await finalizar(page);

    await expect(page.getByText("Pedido recebido!")).toBeVisible();
    await expect(page.getByText("Pix copia e cola (fictício)")).toBeVisible();
    await expect(page.getByAltText(/QR Code do Pix/)).toBeVisible();

    const p = await db.pedido.findUniqueOrThrow({ where: { id } });
    // 2 × R$ 49,90 = 9980; cupom 10% = 998; frete fixo 1990 (abaixo de R$ 249)
    expect([p.subtotal, p.descontoCupom, p.frete, p.total]).toEqual([9980, 998, 1990, 10972]);
    expect([p.status, p.statusPagamento, p.formaPagamento]).toEqual(["AGUARDANDO_PAGAMENTO", "PENDENTE", "PIX"]);
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(198);
    expect((await db.cupom.findUniqueOrThrow({ where: { codigo: "BEMVINDO10" } })).usos).toBe(1);
    const carrinho = await page.evaluate(() => JSON.parse(localStorage.getItem("casa-magistral:estado:v2") ?? "{}").itens);
    expect(carrinho).toHaveLength(0);

    await page.getByRole("button", { name: /Simular pagamento/ }).click();
    await expect(page.getByText("Pagamento confirmado").first()).toBeVisible();
    expect((await db.pedido.findUniqueOrThrow({ where: { id } })).status).toBe("EM_PREPARO");
    // o histórico registra o que aconteceu
    await expect(page.getByRole("list").filter({ hasText: "Pedido criado." })).toContainText("Pagamento confirmado.");
  });

  test("cancelar um pedido aguardando pagamento devolve o estoque", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 2 }]);
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await page.waitForURL(/\/conta\/pedidos\/.+novo=1/);
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(198);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(page.getByText("Pedido cancelado", { exact: true })).toBeVisible();
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(200);
    await expect(page.getByRole("button", { name: /Simular pagamento/ })).toHaveCount(0);
  });

  test("cartão: formato conferido no navegador, recusa sem efeitos e aprovação sem enviar o número", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }]);
    await page.goto("/checkout");
    await escolherPagamento(page, "Cartão de crédito");
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText("Confira o número do cartão")).toBeVisible();
    expect(await db.pedido.count()).toBe(0);

    await preencherCartao(page, "4000 0000 0000 0002");
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText(/Pagamento recusado/)).toBeVisible();
    expect(await db.pedido.count()).toBe(0);
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(200);

    const corpos: string[] = [];
    page.on("request", (r) => r.method() === "POST" && corpos.push(r.postData() ?? ""));
    await preencherCartao(page, "4242 4242 4242 4242");
    await page.getByLabel("Parcelas").selectOption("2");
    const id = await finalizar(page);
    const p = await db.pedido.findUniqueOrThrow({ where: { id } });
    expect([p.formaPagamento, p.statusPagamento, p.status, p.parcelas, p.cartaoFinal4]).toEqual(["CARTAO", "CONFIRMADO", "EM_PREPARO", 2, "4242"]);
    const enviado = corpos.join("\n");
    expect(enviado).toContain("4242"); // os 4 últimos dígitos vão
    expect(enviado).not.toMatch(/4242\s?4242\s?4242\s?4242/);
    expect(enviado).not.toContain("PESSOA DE TESTE");
    await expect(page.getByText(/final 4242 em 2x/)).toBeVisible();
  });

  test("receita: arquivo falso e arquivo grande são barrados; válido segue para a conferência; novo endereço é salvo", async ({ page }) => {
    await colocarNoCarrinho(page, [await itemComReceita()]);
    await page.goto("/checkout");
    await expect(page.getByText("Arquivo da receita")).toBeVisible();
    await page.getByRole("radio", { name: /Entregar em outro endereço/ }).check();
    await page.getByLabel(/^CEP/).fill("30130010");
    await page.getByLabel("Rua", { exact: true }).fill("Rua da Receita");
    await page.getByLabel("Número", { exact: true }).fill("77");
    await page.getByLabel("Bairro", { exact: true }).fill("Savassi");
    await page.getByLabel("Cidade", { exact: true }).fill("Belo Horizonte");
    await page.getByLabel("Estado", { exact: true }).selectOption("MG");
    await page.getByLabel("Salvar este endereço na minha conta").check();
    await escolherPagamento(page, "Cartão de crédito");
    await preencherCartao(page);

    await page.getByLabel("Arquivo da receita").setInputFiles({ name: "falsa.pdf", mimeType: "application/pdf", buffer: Buffer.from("isto é só texto com extensão pdf") });
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText("Formato de receita não aceito")).toBeVisible();
    await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua da Receita"); // o que foi digitado fica

    await page.getByLabel("Arquivo da receita").setInputFiles({ name: "grande.pdf", mimeType: "application/pdf", buffer: Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(3.5 * 1024 * 1024, 65)]) });
    await expect(page.getByText("passa de 3 MB")).toBeVisible();

    await page.getByLabel("Arquivo da receita").setInputFiles(PDF_VALIDO);
    await preencherCartao(page); // o formulário é limpo após cada ação do servidor
    const id = await finalizar(page);
    const p = await db.pedido.findUniqueOrThrow({ where: { id }, include: { receita: true } });
    expect([p.status, p.statusPagamento, p.receita?.status]).toEqual(["AGUARDANDO_RECEITA", "CONFIRMADO", "PENDENTE"]);
    expect((p.enderecoEntrega as { logradouro: string }).logradouro).toBe("Rua da Receita");
    expect(await db.endereco.count({ where: { logradouro: "Rua da Receita", usuario: { email: CRED.cliente.email } } })).toBe(1);
    await expect(page.getByText("receita.pdf")).toBeVisible();
    await expect(page.getByText("Aguardando conferência").first()).toBeVisible();
  });

  test("a receita só é aberta pelo dono e pela equipe; o pedido é invisível para outras pessoas", async ({ page, browser }) => {
    await colocarNoCarrinho(page, [await itemComReceita()]);
    await page.goto("/checkout");
    await escolherPagamento(page, "Pix");
    await page.getByLabel("Arquivo da receita").setInputFiles(PDF_VALIDO);
    const id = await finalizar(page);
    const pedido = await db.pedido.findUniqueOrThrow({ where: { id } });
    const receitaId = pedido.receitaId!;

    const dono = await page.request.get(`/api/receitas/${receitaId}`);
    expect(dono.status()).toBe(200);
    expect(dono.headers()["content-type"]).toBe("application/pdf");
    expect(dono.headers()["x-content-type-options"]).toBe("nosniff");
    expect(dono.headers()["cache-control"]).toContain("no-store");

    // `request` herdaria a sessão do cliente; um contexto novo e vazio representa o visitante anônimo
    const anonimo = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    expect((await anonimo.request.get(`/api/receitas/${receitaId}`)).status()).toBe(401);
    await anonimo.close();

    // contextos novos herdam o estado de login do teste: aqui precisa ser uma pessoa sem sessão
    const outro = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const outraPagina = await outro.newPage();
    await cadastrarPelaTela(outraPagina, "Outro Cliente");
    expect((await outraPagina.request.get(`/api/receitas/${receitaId}`)).status()).toBe(404);
    await outraPagina.goto(`/conta/pedidos/${id}`);
    await expect(outraPagina.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await outro.close();

    const equipe = await browser.newContext({ storageState: ESTADO_AUTH.farmaceutica });
    expect((await equipe.request.get(`/api/receitas/${receitaId}`)).status()).toBe(200);
    await equipe.close();
  });

  test("estoque insuficiente mostra mensagem clara e não cria pedido", async ({ page }) => {
    await db.tamanho.updateMany({ where: { codigo: MAGNESIO.tamanhoId, produto: { slug: MAGNESIO.slug } }, data: { estoque: 1 } });
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 3 }]);
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText(/Estoque insuficiente de Magnésio/)).toBeVisible();
    expect(await db.pedido.count()).toBe(0);
  });

  test("carrinho adulterado (produto inexistente) não quebra e aparece vazio", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: "nao-existe", tamanhoId: "30", qtd: 1 }]);
    await page.goto("/checkout");
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
  });
});
