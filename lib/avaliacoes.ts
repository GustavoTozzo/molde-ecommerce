/**
 * Distribuição de notas (5★ → 1★, em %) exibida no resumo das avaliações.
 * DEMONSTRAÇÃO: estima o histograma a partir da nota média. Quando houver
 * avaliações reais em volume, trocar por um `groupBy nota` no banco.
 */
export function distribuicaoNotas(nota: number): number[] {
  const mapa: Record<number, number[]> = {
    49: [90, 7, 2, 0, 1],
    48: [84, 11, 3, 1, 1],
    47: [78, 15, 4, 2, 1],
    46: [72, 18, 6, 2, 2],
    45: [68, 20, 7, 3, 2],
  };
  return mapa[Math.round(nota * 10)] ?? [70, 18, 7, 3, 2];
}
