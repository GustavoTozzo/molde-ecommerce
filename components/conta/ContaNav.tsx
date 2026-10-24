"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, UserRound, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const itens = [
  { href: "/conta", rotulo: "Resumo", icone: UserRound, exato: true },
  { href: "/conta/pedidos", rotulo: "Meus pedidos", icone: Package },
  { href: "/conta/enderecos", rotulo: "Endereços", icone: MapPin },
  { href: "/favoritos", rotulo: "Favoritos", icone: Heart },
  { href: "/conta/dados", rotulo: "Dados e senha", icone: UserCog },
];

export function ContaNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Minha conta" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-0">
      {itens.map(({ href, rotulo, icone: Icone, exato }) => {
        const atual = exato ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-bold transition lg:rounded-2xl",
              atual ? "bg-forest text-white" : "bg-cream text-ink hover:bg-mint lg:bg-transparent",
            )}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
