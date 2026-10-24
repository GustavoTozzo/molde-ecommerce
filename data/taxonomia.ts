import type { ArtKind } from "@/lib/art";
import type { Fundo, FormaId, ObjetivoId } from "@/lib/types";

export const formas: { id: FormaId; rotulo: string; singular: string; art: ArtKind; accent: string; fundo: Fundo }[] = [
  { id: "capsulas", rotulo: "Cápsulas", singular: "Cápsula", art: "jar", accent: "#0B5D4B", fundo: "mint" },
  { id: "saches", rotulo: "Sachês", singular: "Sachê", art: "sachet", accent: "#E58A2E", fundo: "amber-soft" },
  { id: "gotas", rotulo: "Gotas", singular: "Gotas", art: "dropper", accent: "#E58A2E", fundo: "cream" },
  { id: "cremes", rotulo: "Cremes e géis", singular: "Creme", art: "tube", accent: "#2D8FB3", fundo: "sky-soft" },
  { id: "xaropes", rotulo: "Xaropes", singular: "Xarope", art: "syrup", accent: "#0B5D4B", fundo: "lilac-soft" },
  { id: "kits", rotulo: "Kits", singular: "Kit", art: "box", accent: "#E58A2E", fundo: "coral-soft" },
];

export const objetivos: { id: ObjetivoId; rotulo: string; chamada: string }[] = [
  { id: "sono", rotulo: "Sono e relaxamento", chamada: "Uma rotina de noite mais tranquila" },
  { id: "energia", rotulo: "Energia e foco", chamada: "Para a rotina do dia a dia" },
  { id: "imunidade", rotulo: "Imunidade", chamada: "Cuidado contínuo ao longo do ano" },
  { id: "beleza", rotulo: "Beleza e pele", chamada: "De dentro para fora" },
  { id: "mulher", rotulo: "Saúde da mulher", chamada: "Fórmulas pensadas para cada fase" },
  { id: "homem", rotulo: "Saúde do homem", chamada: "Praticidade para a rotina" },
  { id: "longevidade", rotulo: "Longevidade", chamada: "Hábitos que valem a pena manter" },
  { id: "familia", rotulo: "Cuidados da família", chamada: "Opções para todas as idades" },
];

export const fundoClasse: Record<Fundo, string> = {
  cream: "bg-cream",
  mint: "bg-mint",
  "amber-soft": "bg-amber-soft",
  "sky-soft": "bg-sky-soft",
  "lilac-soft": "bg-lilac-soft",
  "coral-soft": "bg-coral-soft",
};

export const formaPorId = Object.fromEntries(formas.map((f) => [f.id, f])) as Record<FormaId, (typeof formas)[number]>;
export const objetivoPorId = Object.fromEntries(objetivos.map((o) => [o.id, o])) as Record<
  ObjetivoId,
  (typeof objetivos)[number]
>;
