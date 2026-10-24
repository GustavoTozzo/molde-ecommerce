import { expect, test } from "@playwright/test";

const ROTAS = ["/", "/produtos", "/produtos/magnesio-bisglicinato-300", "/assinatura", "/carrinho", "/contato", "/blog", "/entrar"];

test.describe("celular", () => {
  for (const rota of ROTAS) {
    test(`${rota}: sem rolagem horizontal`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.locator("main")).toBeVisible();
      const medidas = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, janela: window.innerWidth }));
      expect(medidas.conteudo).toBeLessThanOrEqual(medidas.janela + 1);
    });
  }

  test("menu lateral abre, navega e fecha", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu de navegação" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Entrar ou cadastrar-se" }).click();
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("barra de compra fixa aparece ao rolar a página do produto", async ({ page }) => {
    await page.goto("/produtos/magnesio-bisglicinato-300");
    await page.evaluate(() => window.scrollTo(0, 1400));
    await expect(page.locator("body[data-barra-compra]")).toHaveCount(1);
  });
});
