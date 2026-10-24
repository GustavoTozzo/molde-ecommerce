import Link from "next/link";
import { logoGlyphSvg } from "@/lib/art";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Logo({ tom = "escuro", className }: { tom?: "escuro" | "claro"; className?: string }) {
  const claro = tom === "claro";
  return (
    <Link href="/" aria-label={`${site.nome}: página inicial`} className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="block size-9 shrink-0 md:size-11 [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: logoGlyphSvg(claro ? "#FFFFFF" : "#0B5D4B", "#F2A33A") }}
      />
      <span className={cn("font-display text-[1.45rem] leading-none font-extrabold tracking-tight md:text-[1.75rem]", claro ? "text-white" : "text-forest-dark")}>
        {site.nomeLogo}
      </span>
    </Link>
  );
}
