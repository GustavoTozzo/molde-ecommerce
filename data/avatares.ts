import type { AvatarConfig } from "@/lib/art";

/** Avatares ilustrados (sem rosto). Substitua por fotos reais via campo `foto` quando houver. */
export const avatares = {
  helena: { skin: "#E3B48E", hair: "#5A3220", hairStyle: "long", top: "#0B5D4B", bg: "#E4F1EA" },
  rafael: { skin: "#C58C62", hair: "#2A1A12", hairStyle: "short", beard: true, top: "#F2A33A", bg: "#FBE9CC" },
  camila: { skin: "#F0C9A8", hair: "#B0763A", hairStyle: "bun", top: "#2D8FB3", bg: "#DDF0F7" },
  beatriz: { skin: "#8D5A3B", hair: "#17110E", hairStyle: "curly", top: "#7A5CC4", bg: "#EAE3F7" },
  pedro: { skin: "#6E4530", hair: "#0D0A09", hairStyle: "short", top: "#C8431F", bg: "#F9E1D8" },
  juliana: { skin: "#F0C9A8", hair: "#6B3A1E", hairStyle: "long", coat: false, top: "#F2A33A", bg: "#FBE9CC" },
  theo: { skin: "#C58C62", hair: "#2A1A12", hairStyle: "short", beard: true, coat: false, top: "#0B5D4B", bg: "#E4F1EA" },
  duda: { skin: "#8D5A3B", hair: "#17110E", hairStyle: "curly", coat: false, top: "#C8431F", bg: "#F9E1D8" },
  lara: { skin: "#E3B48E", hair: "#17110E", hairStyle: "bun", coat: false, top: "#7A5CC4", bg: "#EAE3F7" },
  bruno: { skin: "#6E4530", hair: "#0D0A09", hairStyle: "short", coat: false, top: "#2D8FB3", bg: "#DDF0F7" },
  nina: { skin: "#F0C9A8", hair: "#2A1A12", hairStyle: "long", coat: false, top: "#0B5D4B", bg: "#E4F1EA" },
} satisfies Record<string, AvatarConfig>;

export type AvatarKey = keyof typeof avatares;
