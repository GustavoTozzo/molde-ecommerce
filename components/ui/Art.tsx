import { avatarSvg, packshot, type ArtKind } from "@/lib/art";
import { avatares, type AvatarKey } from "@/data/avatares";
import { cn } from "@/lib/utils";

/** Embalagem ilustrada. `id` evita colisão de gradientes SVG na mesma página. */
export function ProductArt({
  kind,
  accent,
  id,
  className,
}: {
  kind: ArtKind;
  accent: string;
  id: string;
  className?: string;
}) {
  const uid = id.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <span
      aria-hidden="true"
      className={cn("block aspect-[5/6] [&>svg]:block [&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: packshot(kind, uid, accent) }}
    />
  );
}

export function Avatar({ nome, className }: { nome: AvatarKey; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block aspect-square overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: avatarSvg(avatares[nome]) }}
    />
  );
}
