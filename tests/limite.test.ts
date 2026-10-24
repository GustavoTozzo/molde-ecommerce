import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { excedeuLimite, limparLimite } from "../server/limite";

describe("limitador de tentativas", () => {
  test("permite até o máximo e bloqueia a tentativa seguinte", () => {
    const chave = `teste-${Date.now()}-a`;
    for (let i = 0; i < 3; i++) assert.equal(excedeuLimite(chave, 3, 60_000), false, `tentativa ${i + 1} deve passar`);
    assert.equal(excedeuLimite(chave, 3, 60_000), true);
    assert.equal(excedeuLimite(chave, 3, 60_000), true);
  });

  test("chaves diferentes não se afetam", () => {
    const a = `teste-${Date.now()}-b1`;
    const b = `teste-${Date.now()}-b2`;
    for (let i = 0; i < 5; i++) excedeuLimite(a, 2, 60_000);
    assert.equal(excedeuLimite(a, 2, 60_000), true);
    assert.equal(excedeuLimite(b, 2, 60_000), false);
  });

  test("a janela expira: tentativas antigas deixam de contar", async () => {
    const chave = `teste-${Date.now()}-c`;
    excedeuLimite(chave, 1, 30);
    assert.equal(excedeuLimite(chave, 1, 30), true);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(excedeuLimite(chave, 1, 30), false);
  });

  test("limparLimite zera a contagem", () => {
    const chave = `teste-${Date.now()}-d`;
    excedeuLimite(chave, 1, 60_000);
    assert.equal(excedeuLimite(chave, 1, 60_000), true);
    limparLimite(chave);
    assert.equal(excedeuLimite(chave, 1, 60_000), false);
  });
});
