import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { colocarNoCarrinho, ESTADO_AUTH, MAGNESIO, resetar } from "./ajudantes";

/**
 * Varredura automática com axe-core (regras WCAG 2.0/2.1/2.2 A e AA). Pega o que a máquina
 * consegue pegar (contraste, nomes de controles, rótulos, ARIA inválido, hierarquia de títulos…);
 * não substitui teste com leitor de tela e navegação por teclado.
 */
async function varrer(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const graves = resultado.violations.map((v) => ({ regra: v.id, impacto: v.impact, alvos: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
  expect(graves, JSON.stringify(graves, null, 2)).toEqual([]);
}

const PUBLICAS = ["/", "/produtos", "/produtos/magnesio-bisglicinato-300", "/carrinho", "/assinatura", "/especialistas", "/blog", "/contato", "/entrar", "/institucional/privacidade"];

test.describe("acessibilidade (axe)", () => {
  test.beforeEach(resetar);

  for (const rota of PUBLICAS) {
    test(`público: ${rota}`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole("main")).toBeVisible();
      await varrer(page);
    });
  }

  test("carrinho com itens", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }]);
    await page.goto("/carrinho");
    await expect(page.getByText("Magnésio Bisglicinato 300 mg").first()).toBeVisible();
    await varrer(page);
  });
});

test.describe("acessibilidade (axe) com sessão", () => {
  test.use({ storageState: ESTADO_AUTH.cliente });
  test.beforeEach(resetar);

  for (const rota of ["/conta", "/conta/enderecos", "/conta/dados", "/conta/pedidos", "/favoritos"]) {
    test(`cliente: ${rota}`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole("main")).toBeVisible();
      await varrer(page);
    });
  }

  test("checkout (Pix e cartão)", async ({ page }) => {
    await colocarNoCarrinho(page, [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }]);
    await page.goto("/checkout");
    await expect(page.getByRole("button", { name: "Confirmar pedido" })).toBeVisible();
    await varrer(page);
    await page.getByRole("radio", { name: /Cartão de crédito/ }).check({ force: true });
    await expect(page.getByLabel("Número do cartão")).toBeVisible();
    await varrer(page);
  });
});

test.describe("acessibilidade (axe) no painel", () => {
  test.use({ storageState: ESTADO_AUTH.admin });
  test.beforeEach(resetar);

  for (const rota of ["/admin", "/admin/pedidos", "/admin/receitas", "/admin/mensagens", "/admin/produtos", "/admin/produtos/novo", "/admin/cupons", "/admin/usuarios"]) {
    test(`painel: ${rota}`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole("main")).toBeVisible();
      await varrer(page);
    });
  }
});
