import type { Papel } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; papel: Papel } & DefaultSession["user"];
  }

  interface User {
    papel: Papel;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    papel: Papel;
  }
}
