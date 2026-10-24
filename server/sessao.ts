import "server-only";
import type { Papel } from "@prisma/client";
import { connection } from "next/server";
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
  // Declara que a leitura da sessão é por requisição. O Auth.js gera um token CSRF aleatório
  // (crypto.getRandomValues) a cada leitura, e o Next recusa valor aleatório durante a pré-renderização.
  await connection();
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

const EQUIPE: Papel[] = ["ADMINISTRADOR", "FARMACEUTICO"];

/**
 * Páginas do painel: sem sessão vai para o login; com sessão de papel insuficiente volta para
 * a conta. `papeis` restringe ainda mais (ex.: só ADMINISTRADOR em produtos e usuários).
 */
export async function exigirEquipe(destino: string, papeis: Papel[] = EQUIPE): Promise<UsuarioAtual> {
  const u = await exigirUsuario(destino);
  if (!papeis.includes(u.papel)) redirect("/conta");
  return u;
}

/** Server Actions do painel: papel conferido no banco a cada chamada; lança se não puder. */
export async function exigirEquipeNaAcao(papeis: Papel[] = EQUIPE): Promise<UsuarioAtual> {
  const u = await exigirUsuarioNaAcao();
  if (!papeis.includes(u.papel)) throw new Error("Sem permissão para esta ação.");
  return u;
}
