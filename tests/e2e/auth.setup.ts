import { test as setup, expect } from "@playwright/test";
import { CRED, ESTADO_AUTH, resetar } from "./ajudantes";

/**
 * Entra uma vez por papel e guarda a sessão em disco; os testes reaproveitam esse estado.
 * Isso também evita esbarrar no limite de tentativas de login por e-mail do servidor.
 */
setup.beforeAll(async () => {
  await resetar();
});

for (const [papel, cred] of Object.entries(CRED) as [keyof typeof CRED, (typeof CRED)[keyof typeof CRED]][]) {
  setup(`sessão: ${papel}`, async ({ page }) => {
    await page.goto("/entrar");
    const principal = page.getByRole("main"); // o rodapé também tem um campo de e-mail (newsletter)
    await principal.getByLabel("E-mail").fill(cred.email);
    await principal.getByLabel("Senha").fill(cred.senha);
    await principal.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/conta");
    await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    await page.context().storageState({ path: ESTADO_AUTH[papel] });
  });
}
