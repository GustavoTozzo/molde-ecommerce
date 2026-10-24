import type { Papel } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/server/prisma";

const credenciaisSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  senha: z.string().min(1).max(72),
});

// Hash válido de uma senha qualquer: quando o e-mail não existe, comparamos contra ele
// para gastar o mesmo tempo e não revelar (pelo tempo de resposta) quais e-mails têm conta.
const HASH_FALSO = "$2b$12$PfyUDLYC8.L4r.NcTWcgsuClP8ib1lv0n5oJKwwnfTWUSDPRqZqby";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // O JWT identifica a pessoa; a autoridade (papel, conta ativa) é conferida no banco
  // em cada ação sensível (server/sessao.ts). Sessão curta limita o estrago de um token roubado.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/entrar" },
  logger: {
    // Senha errada é um resultado normal, não um erro do servidor: não polui o log a cada tentativa.
    error(erro) {
      if ((erro as { type?: string }).type === "CredentialsSignin") return;
      console.error(erro);
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (credenciais) => {
        const parsed = credenciaisSchema.safeParse(credenciais);
        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({ where: { email: parsed.data.email } });
        const senhaConfere = await bcrypt.compare(parsed.data.senha, usuario?.senhaHash ?? HASH_FALSO);
        if (!usuario || !usuario.ativo || !senhaConfere) return null;

        return { id: usuario.id, email: usuario.email, name: usuario.nome, papel: usuario.papel };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.papel = user.papel;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.papel = token.papel as Papel;
      return session;
    },
  },
});
