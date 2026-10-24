import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Guarda de primeira linha: manda quem não entrou para o login e fecha o /admin para
 * quem não é da equipe. É só a primeira barreira: cada página e cada Server Action
 * conferem de novo no banco (server/sessao.ts), porque um matcher errado aqui não
 * pode ser a única defesa. O matcher é estreito de propósito: as páginas públicas
 * continuam estáticas e não passam por aqui.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (!req.auth) {
    const login = new URL("/entrar", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }

  const papel = req.auth.user?.papel;
  if (pathname.startsWith("/admin") && papel !== "ADMINISTRADOR" && papel !== "FARMACEUTICO") {
    return NextResponse.redirect(new URL("/conta", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*", "/checkout/:path*"],
};
