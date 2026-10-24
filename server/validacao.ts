import "server-only";
import { headers } from "next/headers";
import { z } from "zod";

/**
 * Peças de validação compartilhadas pelas Server Actions. Fica fora de `server/acoes/*`
 * porque arquivos "use server" só podem exportar funções assíncronas.
 */

/**
 * Estado devolvido aos formulários (useActionState). `erros` é por campo; `erro` é geral.
 * `valores` devolve o que foi digitado (nunca senhas nem dados de cartão), porque o React
 * limpa o formulário depois de cada ação e a pessoa não deveria perder o que escreveu.
 */
export type EstadoForm = { erro?: string; erros?: Record<string, string>; ok?: string; valores?: Record<string, string> } | undefined;

export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const i of erro.issues) {
    const campo = String(i.path[0] ?? "form");
    saida[campo] ??= i.message;
  }
  return saida;
}

export function texto(dados: FormData, campo: string): string {
  const v = dados.get(campo);
  return typeof v === "string" ? v : "";
}

export function valoresDe(dados: FormData, campos: string[]): Record<string, string> {
  return Object.fromEntries(campos.map((c) => [c, texto(dados, c)]));
}

export async function ipDoCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

export const senhaSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

export const CAMPOS_ENDERECO = ["apelido", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"] as const;

export const enderecoSchema = z.object({
  apelido: z.string().trim().max(30).optional(),
  cep: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "Informe um CEP com 8 números.")
    .transform((v) => `${v.replace("-", "").slice(0, 5)}-${v.replace("-", "").slice(5)}`),
  logradouro: z.string().trim().min(2, "Informe a rua.").max(120),
  numero: z.string().trim().min(1, "Informe o número.").max(10),
  complemento: z.string().trim().max(60).optional(),
  bairro: z.string().trim().min(2, "Informe o bairro.").max(60),
  cidade: z.string().trim().min(2, "Informe a cidade.").max(60),
  uf: z.string().trim().toUpperCase().refine((v) => (UFS as readonly string[]).includes(v), "Escolha o estado."),
});

export type EnderecoEntrada = z.infer<typeof enderecoSchema>;
