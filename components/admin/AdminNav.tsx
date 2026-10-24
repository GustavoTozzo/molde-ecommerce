"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileCheck2, LayoutDashboard, MessageSquare, Package, Pill, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/admin", rotulo: "Visão geral", icone: LayoutDashboard, exato: true, soAdmin: false },
  { href: "/admin/pedidos", rotulo: "Pedidos", icone: Package, soAdmin: false },
  { href: "/admin/receitas", rotulo: "Receitas", icone: FileCheck2, soAdmin: false },
  { href: "/admin/mensagens", rotulo: "Mensagens", icone: MessageSquare, soAdmin: false },
  { href: "/admin/produtos", rotulo: "Produtos e estoque", icone: Pill, soAdmin: true },
  { href: "/admin/cupons", rotulo: "Cupons", icone: Tag, soAdmin: true },
  { href: "/admin/usuarios", rotulo: "Usuários", icone: Users, soAdmin: true },
];

export function AdminNav({ ehAdmin }: { ehAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel administrativo" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-0">
      {ITENS.filter((i) => ehAdmin || !i.soAdmin).map(({ href, rotulo, icone: Icone, exato }) => {
        const atual = exato ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={atual ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-bold transition lg:rounded-2xl",
              atual ? "bg-forest-dark text-white" : "bg-cream text-ink hover:bg-mint lg:bg-transparent",
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
