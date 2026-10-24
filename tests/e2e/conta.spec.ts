import { expect, test } from "@playwright/test";
import { cadastrarPelaTela, CRED, db, ESTADO_AUTH, esperarLogado, resetar, sair, SENHA } from "./ajudantes";

test.describe("cadastro e acesso", () => {
  test.beforeEach(resetar);

  test("cadastro valida, preserva o digitado, cria CLIENTE com aceite e guarda só o hash", async ({ page }) => {
    const email = `teste.${Date.now()}@casamagistral.exemplo`;
    await page.goto("/entrar");
    const principal = page.getByRole("main");
    await principal.getByRole("tab", { name: "Criar conta" }).click();
    await principal.getByLabel("Nome completo").fill("Pessoa de Teste");
    await principal.getByLabel("E-mail", { exact: true }).fill(email);
    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByLabel("Repita a senha").fill("senha-DIFERENTE");
    await principal.getByRole("checkbox").check();
    await principal.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(principal.getByRole("alert")).toContainText("As senhas não são iguais");
    // o React limpa o formulário depois da ação; o servidor devolve o que não é segredo
    await expect(principal.getByLabel("Nome completo")).toHaveValue("Pessoa de Teste");
    await expect(principal.getByLabel("E-mail", { exact: true })).toHaveValue(email);

    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByLabel("Repita a senha").fill(SENHA);
    if (!(await principal.getByRole("checkbox").isChecked())) await principal.getByRole("checkbox").check();
    await principal.getByRole("button", { name: "Criar minha conta" }).click();
    await page.waitForURL("**/conta");
    await expect(page.getByRole("heading", { name: "Olá, Pessoa" })).toBeVisible();

    const u = await db.usuario.findUniqueOrThrow({ where: { email } });
    expect(u.papel).toBe("CLIENTE");
    expect(u.aceiteTermosEm).not.toBeNull();
    expect(u.senhaHash).toMatch(/^\$2[aby]\$12\$/);
    expect(u.senhaHash).not.toContain(SENHA);
  });

  test("e-mail repetido é recusado", async ({ page }) => {
    const email = await cadastrarPelaTela(page);
    await sair(page);
    await page.goto("/entrar");
    const principal = page.getByRole("main");
    await principal.getByRole("tab", { name: "Criar conta" }).click();
    await principal.getByLabel("Nome completo").fill("Outra Pessoa");
    await principal.getByLabel("E-mail", { exact: true }).fill(email);
    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByLabel("Repita a senha").fill(SENHA);
    await principal.getByRole("checkbox").check();
    await principal.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(principal.getByRole("alert")).toContainText("já tem cadastro");
  });

  test("login: senha errada dá erro genérico e mantém o e-mail; certa volta à página pedida", async ({ page }) => {
    const email = await cadastrarPelaTela(page);
    await sair(page);

    await page.goto("/conta/enderecos");
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=%2Fconta%2Fenderecos/);
    const principal = page.getByRole("main");
    await principal.getByLabel("E-mail", { exact: true }).fill(email);
    await principal.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(principal.getByRole("alert")).toContainText("E-mail ou senha incorretos");
    await expect(principal.getByLabel("E-mail", { exact: true })).toHaveValue(email);

    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/conta/enderecos");
    await expect(page.getByRole("link", { name: /Minha conta/ }).first()).toBeVisible();
  });

  test("callbackUrl para outro site é ignorado (sem redirecionamento aberto)", async ({ page }) => {
    const email = await cadastrarPelaTela(page);
    for (const alvo of ["https://evil.example/x", "//evil.example/x"]) {
      await sair(page);
      await page.goto(`/entrar?callbackUrl=${encodeURIComponent(alvo)}`);
      const principal = page.getByRole("main");
      await principal.getByLabel("E-mail", { exact: true }).fill(email);
      await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
      await principal.getByRole("button", { name: "Entrar", exact: true }).click();
      await esperarLogado(page);
      expect(new URL(page.url()).host).toBe(new URL(test.info().project.use.baseURL ?? "http://localhost:3100").host);
    }
  });

  test("dados e senha: telefone só com dígitos e troca de senha exige a atual", async ({ page }) => {
    const email = await cadastrarPelaTela(page);
    await page.goto("/conta/dados");
    const principal = page.getByRole("main");
    await principal.getByLabel(/Telefone/).fill("123");
    await principal.getByRole("button", { name: "Salvar dados" }).click();
    await expect(principal.getByRole("alert")).toContainText("telefone com DDD");
    await principal.getByLabel(/Telefone/).fill("(11) 91234-5678");
    await principal.getByRole("button", { name: "Salvar dados" }).click();
    await expect(principal.getByRole("status")).toContainText("Dados atualizados");
    expect((await db.usuario.findUniqueOrThrow({ where: { email } })).telefone).toBe("11912345678");

    await principal.getByLabel("Senha atual").fill("nao-e-a-senha");
    await principal.getByLabel("Nova senha", { exact: true }).fill("outra-senha-2026");
    await principal.getByLabel("Repita a nova senha").fill("outra-senha-2026");
    await principal.getByRole("button", { name: "Alterar senha" }).click();
    await expect(principal.getByRole("alert")).toContainText("Senha atual incorreta");

    // depois de cada ação o React limpa o formulário: preenche tudo de novo
    await principal.getByLabel("Senha atual").fill(SENHA);
    await principal.getByLabel("Nova senha", { exact: true }).fill("outra-senha-2026");
    await principal.getByLabel("Repita a nova senha").fill("outra-senha-2026");
    await principal.getByRole("button", { name: "Alterar senha" }).click();
    await expect(principal.getByRole("status").last()).toContainText("Senha alterada");
    // a senha antiga não vale mais
    await sair(page);
    await page.goto("/entrar");
    await principal.getByLabel("E-mail", { exact: true }).fill(email);
    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(principal.getByRole("alert")).toContainText("incorretos");
    await principal.getByLabel("Senha", { exact: true }).fill("outra-senha-2026");
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await esperarLogado(page);
  });

  test("conta bloqueada não consegue entrar nem seguir usando a sessão", async ({ page, browser }) => {
    const email = await cadastrarPelaTela(page);
    await db.usuario.update({ where: { email }, data: { ativo: false } });
    await page.goto("/conta"); // sessão já aberta, mas a conta foi bloqueada no banco
    await expect(page).toHaveURL(/\/entrar/);
    const ctx = await browser.newContext();
    const outra = await ctx.newPage();
    await outra.goto("/entrar");
    const principal = outra.getByRole("main");
    await principal.getByLabel("E-mail", { exact: true }).fill(email);
    await principal.getByLabel("Senha", { exact: true }).fill(SENHA);
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(principal.getByRole("alert")).toContainText("incorretos");
    await ctx.close();
  });
});

test.describe("área do cliente", () => {
  test.use({ storageState: ESTADO_AUTH.cliente });
  test.beforeEach(resetar);

  test("endereços: valida CEP, mascara, salva, troca o principal e remove", async ({ page }) => {
    await page.goto("/conta/enderecos");
    const principal = page.getByRole("main");
    await principal.getByLabel(/^CEP/).fill("12");
    await principal.getByLabel("Rua", { exact: true }).fill("Rua dos Testes");
    await principal.getByLabel("Número", { exact: true }).fill("10");
    await principal.getByLabel("Bairro").fill("Centro");
    await principal.getByLabel("Cidade").fill("São Paulo");
    await principal.getByLabel("Estado").selectOption("SP");
    await principal.getByRole("button", { name: "Salvar endereço" }).click();
    await expect(principal.getByRole("alert")).toContainText("CEP com 8 números");
    // o que foi digitado continua lá (inclusive o estado escolhido)
    await expect(principal.getByLabel("Rua", { exact: true })).toHaveValue("Rua dos Testes");
    await expect(principal.getByLabel("Estado")).toHaveValue("SP");

    await principal.getByLabel(/^CEP/).fill("");
    await principal.getByLabel(/^CEP/).pressSequentially("01310100");
    await expect(principal.getByLabel(/^CEP/)).toHaveValue("01310-100");
    await principal.getByRole("button", { name: "Salvar endereço" }).click();
    await expect(principal.getByText("Rua dos Testes, 10")).toBeVisible();
    expect(await db.endereco.count({ where: { usuario: { email: CRED.cliente.email } } })).toBe(2);

    await principal.getByRole("button", { name: "Tornar principal" }).click();
    await expect.poll(async () => (await db.endereco.findFirstOrThrow({ where: { logradouro: "Rua dos Testes" } })).principal).toBe(true);
    await principal.getByRole("button", { name: "Remover endereço Rua dos Testes" }).click();
    await expect.poll(() => db.endereco.count({ where: { usuario: { email: CRED.cliente.email } } })).toBe(1);
    // sobrou um endereço e ele virou o principal
    expect((await db.endereco.findFirstOrThrow({ where: { usuario: { email: CRED.cliente.email } } })).principal).toBe(true);
  });

  test("favoritos ficam na conta e aparecem em outro navegador; sair limpa os do navegador", async ({ page, browser }) => {
    await page.goto("/produtos/magnesio-bisglicinato-300");
    await page.getByRole("button", { name: /Salvar .* nos favoritos/ }).first().click();
    await expect.poll(() => db.favorito.count({ where: { usuario: { email: CRED.cliente.email } } })).toBe(1);

    const ctx = await browser.newContext({ storageState: ESTADO_AUTH.cliente });
    const outro = await ctx.newPage();
    await outro.goto("/favoritos");
    await expect(outro.getByRole("main").getByText("Magnésio Bisglicinato 300 mg").first()).toBeVisible();
    await ctx.close();

    await sair(page);
    const locais = await page.evaluate(() => (JSON.parse(localStorage.getItem("casa-magistral:estado:v2") ?? "{}").favoritos ?? []).length);
    expect(locais).toBe(0);
  });

  test("o cliente não entra no painel", async ({ page }) => {
    for (const rota of ["/admin", "/admin/pedidos", "/admin/produtos", "/admin/usuarios"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/conta$/);
    }
  });
});
