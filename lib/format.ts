/** Todos os valores monetários do molde são inteiros em centavos. */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(centavos: number): string {
  return brl.format(centavos / 100);
}

export function descontoCentavos(centavos: number, taxa: number): number {
  return Math.round(centavos * (1 - taxa));
}

export function percentual(precoDe: number, precoPor: number): number {
  return Math.round((1 - precoPor / precoDe) * 100);
}

export function parcelamento(
  centavos: number,
  maxParcelas: number,
  parcelaMinima: number,
): { parcelas: number; valor: number } {
  const parcelas = Math.max(1, Math.min(maxParcelas, Math.floor(centavos / parcelaMinima)));
  return { parcelas, valor: Math.round(centavos / parcelas) };
}

export function formatarNota(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}

export function mascararCep(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** "12/10/2026". Fixa o fuso em UTC para o servidor e o navegador mostrarem o mesmo dia. */
export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

/** "24/10/2026 14:32" no fuso de Brasília, igual no servidor e no navegador. */
export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(data).replace(",", "");
}

/** "49,90", "R$ 1.234,56" ou "49.90" -> centavos (4990). null se não for um valor válido. */
export function parseReais(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.]/g, "");
  if (!limpo) return null;
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? Math.round(n * 100) : null;
}

/** 4990 -> "49,90" (para preencher campos de formulário). */
export function centavosParaCampo(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}
