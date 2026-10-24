import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { PORTA, SEGREDO_REVALIDAR, URL_BASE } from "./tests/e2e/constantes";

/**
 * Testes de ponta a ponta. Pré-requisitos: Postgres no ar com migrações e seed aplicados
 * (README) e o app compilado (`npm run build`). O servidor sobe sozinho na porta 3100.
 *
 * Os testes escrevem no banco (pedidos, usuários de teste) e limpam depois; por isso rodam
 * em série e só contra banco local ou de CI (tests/e2e/ajudantes.ts recusa qualquer outro).
 */
// Localmente usa o Chrome já instalado; no CI, o Chromium que o Playwright baixa.
const canal = process.env.CI ? {} : { channel: "chrome" as const };

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: URL_BASE, locale: "pt-BR", timezoneId: "America/Sao_Paulo", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, teardown: "limpeza", use: { ...devices["Desktop Chrome"], ...canal } },
    { name: "limpeza", testMatch: /limpeza\.teardown\.ts/ },
    {
      name: "desktop",
      testIgnore: [/auth\.setup\.ts/, /limpeza\.teardown\.ts/, /\.mobile\.spec\.ts/],
      use: { ...devices["Desktop Chrome"], ...canal, viewport: { width: 1440, height: 900 } },
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      testMatch: /\.mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], ...canal },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next start -p ${PORTA}`,
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // O Auth.js usa AUTH_URL para montar redirecionamentos: precisa apontar para a porta do teste.
    env: { AUTH_URL: URL_BASE, LIMITES_RELAXADOS: "1", REVALIDATE_SECRET: SEGREDO_REVALIDAR },
  },
});
