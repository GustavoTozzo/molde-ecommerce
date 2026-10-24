"use server";

import { z } from "zod";
import { excedeuLimite } from "@/server/limite";
import { prisma } from "@/server/prisma";
import { ipDoCliente } from "@/server/validacao";

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string };

const ASSUNTOS = ["pedido", "produto", "receita", "formula-personalizada", "outro"] as const;

const mensagemSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  assunto: z.enum(ASSUNTOS),
  mensagem: z.string().trim().min(10).max(2000),
});

/** Formulário de contato: grava a mensagem para a equipe ler no painel. */
export async function enviarMensagem(entrada: z.input<typeof mensagemSchema>): Promise<ResultadoEnvio> {
  if (excedeuLimite(`contato:${await ipDoCliente()}`, 5, 60 * 60_000)) {
    return { ok: false, erro: "Muitas mensagens em pouco tempo. Tente de novo mais tarde." };
  }
  const parsed = mensagemSchema.safeParse(entrada);
  if (!parsed.success) return { ok: false, erro: "Confira os campos e tente de novo." };
  await prisma.mensagemContato.create({ data: parsed.data });
  return { ok: true };
}

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

/**
 * Inscrição na newsletter. Repetir um e-mail já inscrito também devolve sucesso, para o
 * formulário não servir de consulta sobre quem está na lista.
 */
export async function inscreverNewsletter(email: string): Promise<ResultadoEnvio> {
  if (excedeuLimite(`newsletter:${await ipDoCliente()}`, 10, 60 * 60_000)) {
    return { ok: false, erro: "Muitas tentativas. Tente de novo mais tarde." };
  }
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, erro: "Digite um e-mail válido, como nome@email.com.br." };
  await prisma.inscritoNewsletter.upsert({ where: { email: parsed.data }, update: {}, create: { email: parsed.data } });
  return { ok: true };
}
