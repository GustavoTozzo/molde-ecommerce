"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { excedeuLimite } from "@/server/limite";
import { prisma } from "@/server/prisma";
import { exigirUsuarioNaAcao, usuarioAtual } from "@/server/sessao";
import { CAMPOS_ENDERECO, enderecoSchema, errosPorCampo, ipDoCliente, senhaSchema, texto, valoresDe, type EstadoForm } from "@/server/validacao";

const CUSTO_BCRYPT = 12;

export type { EstadoForm };

/** Aceita só caminhos internos: bloqueia "https://outro.site" e "//outro.site" (open redirect). */
function destinoSeguro(valor: string): string {
  return valor.startsWith("/") && !valor.startsWith("//") && !valor.includes("\\") ? valor : "/conta";
}

/* ---------- entrar, cadastrar, sair ---------- */

const entrarSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  senha: z.string().min(1, "Informe a senha.").max(72),
});

export async function autenticar(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const valores = valoresDe(dados, ["email"]);
  const parsed = entrarSchema.safeParse({ email: texto(dados, "email"), senha: texto(dados, "senha") });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };

  const ip = await ipDoCliente();
  if (excedeuLimite(`login:${parsed.data.email}`, 8, 15 * 60_000) || excedeuLimite(`login-ip:${ip}`, 40, 15 * 60_000)) {
    return { erro: "Muitas tentativas de acesso. Aguarde alguns minutos e tente de novo.", valores };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: destinoSeguro(texto(dados, "redirectTo")) });
  } catch (e) {
    if (e instanceof AuthError) return { erro: "E-mail ou senha incorretos.", valores };
    throw e; // o redirecionamento de sucesso também é uma exceção e precisa seguir adiante
  }
}

const cadastrarSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome.").max(80, "O nome pode ter no máximo 80 caracteres."),
    email: z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido.")),
    senha: senhaSchema,
    confirmacao: z.string(),
    aceite: z.literal("on", "É preciso aceitar os termos e a política de privacidade."),
  })
  .refine((d) => d.senha === d.confirmacao, { path: ["confirmacao"], message: "As senhas não são iguais." })
  .refine((d) => d.senha.toLowerCase() !== d.email, { path: ["senha"], message: "A senha não pode ser igual ao e-mail." });

export async function cadastrar(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const valores = valoresDe(dados, ["nome", "email"]);
  const parsed = cadastrarSchema.safeParse({
    nome: texto(dados, "nome"),
    email: texto(dados, "email"),
    senha: texto(dados, "senha"),
    confirmacao: texto(dados, "confirmacao"),
    aceite: texto(dados, "aceite"),
  });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };

  if (excedeuLimite(`cadastro-ip:${await ipDoCliente()}`, 10, 60 * 60_000)) {
    return { erro: "Muitos cadastros a partir desta conexão. Tente de novo mais tarde.", valores };
  }

  const { nome, email, senha } = parsed.data;
  // Sempre CLIENTE: o papel nunca vem do formulário. Admin e farmacêutico são criados pelo seed/painel.
  try {
    await prisma.usuario.create({
      data: { nome, email, senhaHash: await bcrypt.hash(senha, CUSTO_BCRYPT), papel: "CLIENTE", aceiteTermosEm: new Date() },
    });
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return { erros: { email: "Este e-mail já tem cadastro. Tente entrar." }, valores };
    }
    throw e;
  }

  try {
    await signIn("credentials", { email, senha, redirectTo: destinoSeguro(texto(dados, "redirectTo")) });
  } catch (e) {
    if (e instanceof AuthError) return { erro: "Conta criada, mas não foi possível entrar automaticamente. Use a aba Entrar.", valores };
    throw e;
  }
}

export async function sair() {
  await signOut({ redirectTo: "/" });
}

/* ---------- dados pessoais e senha ---------- */

const dadosSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(80),
  telefone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 11), "Informe o telefone com DDD."),
});

export async function atualizarDados(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioNaAcao();
  const valores = valoresDe(dados, ["nome", "telefone"]);
  const parsed = dadosSchema.safeParse(valores);
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { nome: parsed.data.nome, telefone: parsed.data.telefone || null },
  });
  revalidatePath("/conta", "layout");
  return { ok: "Dados atualizados.", valores };
}

const trocaSenhaSchema = z
  .object({ atual: z.string().min(1, "Informe a senha atual.").max(72), nova: senhaSchema, confirmacao: z.string() })
  .refine((d) => d.nova === d.confirmacao, { path: ["confirmacao"], message: "As senhas não são iguais." })
  .refine((d) => d.nova !== d.atual, { path: ["nova"], message: "A nova senha precisa ser diferente da atual." });

export async function alterarSenha(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioNaAcao();
  const parsed = trocaSenhaSchema.safeParse({ atual: texto(dados, "atual"), nova: texto(dados, "nova"), confirmacao: texto(dados, "confirmacao") });
  if (!parsed.success) return { erros: errosPorCampo(parsed.error) };

  if (excedeuLimite(`senha:${usuario.id}`, 5, 15 * 60_000)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos." };
  }
  const registro = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id }, select: { senhaHash: true } });
  if (!(await bcrypt.compare(parsed.data.atual, registro.senhaHash))) {
    return { erros: { atual: "Senha atual incorreta." } };
  }
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await bcrypt.hash(parsed.data.nova, CUSTO_BCRYPT) } });
  return { ok: "Senha alterada." };
}

/* ---------- endereços ---------- */

const MAX_ENDERECOS = 5;

export async function salvarEndereco(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuarioNaAcao();
  const valores = valoresDe(dados, [...CAMPOS_ENDERECO]);
  const parsed = enderecoSchema.safeParse(valores);
  if (!parsed.success) return { erros: errosPorCampo(parsed.error), valores };

  const total = await prisma.endereco.count({ where: { usuarioId: usuario.id } });
  if (total >= MAX_ENDERECOS) return { erro: `Você pode guardar até ${MAX_ENDERECOS} endereços. Remova um para cadastrar outro.`, valores };

  const { apelido, complemento, ...resto } = parsed.data;
  await prisma.endereco.create({
    data: { ...resto, apelido: apelido || null, complemento: complemento || null, usuarioId: usuario.id, principal: total === 0 },
  });
  revalidatePath("/conta/enderecos");
  return { ok: "Endereço salvo." };
}

export async function removerEndereco(id: string): Promise<void> {
  const usuario = await exigirUsuarioNaAcao();
  // `usuarioId` no where garante que ninguém apague endereço alheio informando outro id.
  const removido = await prisma.endereco.deleteMany({ where: { id, usuarioId: usuario.id } });
  if (removido.count > 0) {
    const sobrou = await prisma.endereco.findFirst({ where: { usuarioId: usuario.id }, orderBy: { criadoEm: "asc" } });
    const temPrincipal = await prisma.endereco.count({ where: { usuarioId: usuario.id, principal: true } });
    if (sobrou && temPrincipal === 0) await prisma.endereco.update({ where: { id: sobrou.id }, data: { principal: true } });
  }
  revalidatePath("/conta/enderecos");
}

export async function tornarEnderecoPrincipal(id: string): Promise<void> {
  const usuario = await exigirUsuarioNaAcao();
  const dele = await prisma.endereco.findFirst({ where: { id, usuarioId: usuario.id }, select: { id: true } });
  if (!dele) return;
  await prisma.$transaction([
    prisma.endereco.updateMany({ where: { usuarioId: usuario.id }, data: { principal: false } }),
    prisma.endereco.update({ where: { id }, data: { principal: true } }),
  ]);
  revalidatePath("/conta/enderecos");
}

/* ---------- favoritos ---------- */

const slugSchema = z.string().trim().min(1).max(120);

export async function alternarFavoritoNoServidor(slug: string): Promise<boolean> {
  const usuario = await exigirUsuarioNaAcao();
  const alvo = slugSchema.parse(slug);
  const produto = await prisma.produto.findUnique({ where: { slug: alvo }, select: { id: true } });
  if (!produto) throw new Error("Produto não encontrado.");
  const chave = { usuarioId_produtoId: { usuarioId: usuario.id, produtoId: produto.id } };
  const existe = await prisma.favorito.findUnique({ where: chave });
  if (existe) {
    await prisma.favorito.delete({ where: chave });
    return false;
  }
  await prisma.favorito.create({ data: { usuarioId: usuario.id, produtoId: produto.id } });
  return true;
}

/**
 * No primeiro acesso após o login: junta os favoritos do navegador aos do banco e devolve a lista final.
 * Devolve `null` se a sessão acabou no meio do caminho (por exemplo, a pessoa saiu da conta em outra
 * aba): o navegador então não mexe nos favoritos que tem.
 */
export async function mesclarFavoritos(locais: string[]): Promise<string[] | null> {
  const usuario = await usuarioAtual();
  if (!usuario) return null;
  const slugs = z.array(slugSchema).max(200).parse(locais);
  if (slugs.length > 0) {
    const produtos = await prisma.produto.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
    await prisma.favorito.createMany({
      data: produtos.map((p) => ({ usuarioId: usuario.id, produtoId: p.id })),
      skipDuplicates: true,
    });
  }
  const todos = await prisma.favorito.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { criadoEm: "asc" },
    select: { produto: { select: { slug: true } } },
  });
  return todos.map((f) => f.produto.slug);
}
