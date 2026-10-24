import "server-only";
import type { PrismaClient } from "@prisma/client";
import { criarClientePrisma } from "./cliente-prisma";

// Singleton: no dev o hot reload recarregaria o módulo e abriria um pool novo a cada edição.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? criarClientePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
