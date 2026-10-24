import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SecaoTitulo({
  children,
  sobretitulo,
  href,
  linkRotulo = "Ver todos os produtos",
  id,
  className,
  centralizado,
  claro,
}: {
  children: ReactNode;
  sobretitulo?: string;
  href?: string;
  linkRotulo?: string;
  id?: string;
  className?: string;
  centralizado?: boolean;
  claro?: boolean;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 md:mb-8", centralizado && "justify-center text-center", className)}>
      <div>
        {sobretitulo && <p className={cn("eyebrow mb-1.5", claro && "text-amber")}>{sobretitulo}</p>}
        <h2 id={id} className={cn("font-display text-[1.75rem] leading-[1.1] font-bold md:text-[2.5rem]", claro ? "text-white" : "text-forest")}>
          {children}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn("inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline", claro ? "text-white" : "text-ink")}
        >
          {linkRotulo}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
