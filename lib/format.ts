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
