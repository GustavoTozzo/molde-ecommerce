"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { exigirEquipeNaAcao } from "@/server/sessao";
import { errosPorCampo, senhaSchema, texto, type EstadoForm } from "@/server/validacao";

export type { EstadoForm };

const idSchema = z.string().min(1).max(40);
const papelSchema = z.enum(["CLIENTE", "FARMACEUTICO", "ADMINISTRADOR"]);

/** Quantos administradores ativos existem fora `exceto`: a loja nunca pode ficar sem nenhum. */
async function outrosAdministradores(exceto: string): Promise<number> {
  return prisma.usuario.count({ where: { papel: "ADMINISTRADOR", ativo: true, id: { not: exceto } } });
}

export async function alterarPapel(usuarioId: string, papel: string): Promise<void> {
  const eu = await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const id = idSchema.parse(usuarioId);
  const novo = papelSchema.parse(papel);
  if (id === eu.id) return; // ninguém muda o próprio papel (evita se trancar para fora)
  const alvo = await prisma.usuario.findUnique({ where: { id }, select: { papel: true } });
  if (!alvo) return;
  if (alvo.papel === "ADMINISTRADOR" && novo !== "ADMINISTRADOR" && (await outrosAdministradores(id)) === 0) return;
  await prisma.usuario.update({ where: { id }, data: { papel: novo } });
  revalidatePath("/admin/usuarios");
}

export async function alternarAtivo(usuarioId: string): Promise<void> {
  const eu = await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const id = idSchema.parse(usuarioId);
  if (id === eu.id) return;
  const alvo = await prisma.usuario.findUnique({ where: { id }, select: { ativo: true, papel: true } });
  if (!alvo) return;
  if (alvo.ativo && alvo.papel === "ADMINISTRADOR" && (await outrosAdministradores(id)) === 0) return;
  await prisma.usuario.update({ where: { id }, data: { ativo: !alvo.ativo } });
  revalidatePath("/admin/usuarios");
}

const novaPessoaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(80),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido.")),
  papel: z.enum(["FARMACEUTICO", "ADMINISTRADOR"], "Escolha o papel."),
  senha: senhaSchema,
});

/** Cria alguém da equipe com uma senha inicial (a pessoa deve trocá-la em Minha conta). */
export async function criarPessoaDaEquipe(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirEquipeNaAcao(["ADMINISTRADOR"]);
  const valores = { nome: texto(dados, "nome"), email: texto(dados, "email"), papel: texto(dados, "papel") };
  const parsed = novaPessoaSchema.safeParse({ ...valores, senha: texto(dados, "senha") });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };
  const { senha, ...resto } = parsed.data;
  const existe = await prisma.usuario.findUnique({ where: { email: resto.email }, select: { id: true } });
  if (existe) return { erros: { email: "Já existe uma conta com este e-mail." }, valores };
  await prisma.usuario.create({ data: { ...resto, senhaHash: await bcrypt.hash(senha, 12) } });
  revalidatePath("/admin/usuarios");
  return { ok: `${resto.nome} foi adicionado(a). Peça para trocar a senha no primeiro acesso.` };
}
