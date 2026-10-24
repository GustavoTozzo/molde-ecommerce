export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

/** Normaliza texto para busca tolerante a acentos e caixa. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}
