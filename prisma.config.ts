import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: a URL do datasource mora aqui, não no schema. Usa a connection
// string DIRETA (sem "-pooler" na Neon), a mesma usada por migrate/db push.
// O runtime da aplicação usa DATABASE_URL via driver adapter (server/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
