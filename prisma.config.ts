import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: a URL do datasource mora aqui, não no schema. Usa a connection
// string DIRETA (sem "-pooler" na Neon), a mesma usada por migrate/db push.
// O runtime da aplicação usa DATABASE_URL via driver adapter (server/prisma.ts).
//
// `prisma generate` (rodado no postinstall, inclusive na Vercel) não conecta em banco nenhum, então
// não pode quebrar a instalação só porque DIRECT_URL não foi definida: sem ela, cai em DATABASE_URL
// e, na falta das duas, num valor de preenchimento. Comandos que conectam de verdade (migrate, seed)
// falham com erro de conexão claro se a URL estiver errada ou ausente.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://sem-url-definida@localhost:5432/sem_banco";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
