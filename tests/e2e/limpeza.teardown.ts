import { test as limpeza } from "@playwright/test";
import { db, resetar } from "./ajudantes";

/** Ao fim da suíte, devolve o banco ao estado do seed (o último teste costuma deixar mensagens, inscritos etc.). */
limpeza("restaurar o banco ao estado do seed", async () => {
  await resetar();
  await db.$disconnect();
});
