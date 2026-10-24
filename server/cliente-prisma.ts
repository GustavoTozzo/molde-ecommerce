import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

/**
 * Fábrica do PrismaClient. Fica separada de `server/prisma.ts` para que o seed
 * (rodado com tsx, fora do Next) reaproveite a mesma escolha de driver sem
 * importar `server-only`.
 *
 * - Neon (host *.neon.tech): driver serverless por WebSocket, recomendado em
 *   ambientes como a Vercel; usa a connection string POOLED (DATABASE_URL).
 * - Qualquer outro Postgres (o container local do README): driver `pg` comum.
 */
export function criarClientePrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida (veja .env.example).");

  if (url.includes("neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
