import "server-only";
import type { Papel } from "@prisma/client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "./prisma";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
}

/**
 * Usuário logado conferido NO BANCO (o JWT só diz quem é; papel e conta ativa podem
 * ter mudado desde que o token foi emitido). Devolve null se não houver sessão válida.
 */
// `cache` deduplica dentro da mesma requisição: cabeçalho, página e ações chamam e só o primeiro consulta o banco.
export const usuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id) return null;
  const u = await prisma.usuario.findUnique({ where: { id }, select: { id: true, nome: true, email: true, papel: true, ativo: true } });
  if (!u || !u.ativo) return null;
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel };
});

/** Para páginas: sem sessão, manda para o login e volta para `destino` depois. */
export async function exigirUsuario(destino: string): Promise<UsuarioAtual> {
  const u = await usuarioAtual();
  if (!u) redirect(`/entrar?callbackUrl=${encodeURIComponent(destino)}`);
  return u;
}

/** Para Server Actions: lança em vez de redirecionar (a ação não deve seguir sem usuário). */
export async function exigirUsuarioNaAcao(): Promise<UsuarioAtual> {
  const u = await usuarioAtual();
  if (!u) throw new Error("Sessão expirada. Entre novamente.");
  return u;
}

export function temPapel(u: UsuarioAtual, ...papeis: Papel[]): boolean {
  return papeis.includes(u.papel);
}
