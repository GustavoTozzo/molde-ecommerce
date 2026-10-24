import { expect, test } from "@playwright/test";
import { colocarNoCarrinho, db, MAGNESIO, resetar } from "./ajudantes";

test.describe("site público", () => {
  test.beforeEach(resetar);

  test("home abre com título, hero em carrossel e sem erro de console", async ({ page }) => {
    const erros: string[] = [];
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await page.goto("/");
    await expect(page).toHaveTitle(/Casa Magistral/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Casa Magistral");
    // O primeiro carrossel da página é o hero.
    const slide = page.locator('[aria-roledescription="slide"][aria-hidden="false"]').first();
    await expect(slide).toHaveAttribute("aria-label", "1 de 4");
    await page.getByRole("button", { name: "Próximo slide" }).first().click();
    await expect(slide).toHaveAttribute("aria-label", "2 de 4");
    expect(erros).toEqual([]);
  });

  test("catálogo: filtro por forma, URL e limpar", async ({ page }) => {
    await page.goto("/produtos");
    await expect(page.getByText(/^22 produtos$/)).toBeVisible();
    // O filtro vive na URL: o estado da caixa muda depois da navegação, então clica e confere a URL.
    await page.getByLabel("Cremes e géis").click();
    await expect(page.getByText(/^3 produtos$/)).toBeVisible();
    await expect(page).toHaveURL(/forma=cremes/);
    await page.getByRole("button", { name: "Limpar filtros" }).first().click();
    await expect(page.getByText(/^22 produtos$/)).toBeVisible();
  });

  test("busca tolera acento e mostra estado vazio", async ({ page }) => {
    await page.goto("/produtos?q=colageno");
    await expect(page.getByRole("link", { name: /Colágeno Hidrolisado/ }).first()).toBeVisible();
    await page.goto("/produtos?q=zzzxxyy");
    await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  });

  test("página do produto: assinatura, adicionar ao carrinho e contador", async ({ page }) => {
    await page.goto("/produtos/magnesio-teanina-limao");
    await page.getByRole("radio", { name: /Assinatura/ }).check({ force: true });
    await page.getByLabel("Receber", { exact: true }).selectOption("2");
    await page.getByRole("button", { name: /^Adicionar · R\$/ }).first().click();
    await expect(page.getByRole("button", { name: /Abrir carrinho, 1 item/ })).toBeVisible();
    const itens = await page.evaluate(() => JSON.parse(localStorage.getItem("casa-magistral:estado:v2") ?? "{}").itens);
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ slug: "magnesio-teanina-limao", frequencia: "2" });
  });

  test("carrinho: cupom é validado no servidor e o carrinho persiste ao recarregar", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 2 }]);
    await page.goto("/carrinho");
    const campo = page.getByPlaceholder("Digite o código");
    await campo.fill("NAOEXISTE");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Cupom inválido ou expirado");
    await campo.fill("bemvindo10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("BEMVINDO10 · 10% de desconto")).toBeVisible();
    // 10% de R$ 99,80 = R$ 9,98, calculado com o preço do banco
    await expect(page.getByText("−R$ 9,98")).toBeVisible();
    await page.reload();
    await expect(page.getByText("BEMVINDO10 · 10% de desconto")).toBeVisible();
    await expect(page.getByText("Magnésio Bisglicinato 300 mg").first()).toBeVisible();
  });

  test("cupom desativado no banco deixa de valer", async ({ page }) => {
    await db.cupom.create({ data: { codigo: "TESTEOFF", tipo: "PERCENTUAL", percentual: 20, ativo: false } });
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }]);
    await page.goto("/carrinho");
    await page.getByPlaceholder("Digite o código").fill("TESTEOFF");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Cupom inválido ou expirado");
  });

  test("rotas protegidas mandam o visitante para o login com retorno", async ({ page }) => {
    for (const rota of ["/conta", "/conta/pedidos", "/checkout", "/admin"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(new RegExp(`/entrar\\?callbackUrl=${encodeURIComponent(rota).replace("%2F", "%2F")}`));
    }
  });

  test("endereço inexistente mostra a página de não encontrado", async ({ page }) => {
    const resposta = await page.goto("/rota-que-nao-existe");
    expect(resposta?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await page.goto("/produtos/produto-que-nao-existe");
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

  test("newsletter exige consentimento e grava a inscrição", async ({ page }) => {
    await page.goto("/");
    const rodape = page.locator("footer");
    await rodape.getByPlaceholder("seu@email.com.br").fill("news@teste.example");
    await rodape.getByRole("button", { name: "Quero receber" }).click();
    await expect(rodape.getByRole("alert")).toContainText("Marque a caixa");
    await rodape.getByRole("checkbox").check();
    await rodape.getByRole("button", { name: "Quero receber" }).click();
    await expect(rodape.getByRole("status")).toContainText("Inscrição feita");
    expect(await db.inscritoNewsletter.count({ where: { email: "news@teste.example" } })).toBe(1);
  });

  test("contato valida os campos e grava a mensagem", async ({ page }) => {
    await page.goto("/contato?assunto=receita");
    await expect(page.getByLabel("Assunto")).toHaveValue("receita");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(4);
    const principal = page.getByRole("main");
    await principal.getByLabel("Nome", { exact: true }).fill("Visitante Teste");
    await principal.getByLabel("E-mail", { exact: true }).fill("visitante@teste.example");
    await principal.getByLabel("Mensagem", { exact: true }).fill("Qual o prazo de entrega para Belo Horizonte?");
    await principal.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("heading", { name: "Mensagem enviada" })).toBeVisible();
    const gravada = await db.mensagemContato.findFirstOrThrow({ where: { email: "visitante@teste.example" } });
    expect(gravada.assunto).toBe("receita");
    expect(gravada.lida).toBe(false);
  });
});
