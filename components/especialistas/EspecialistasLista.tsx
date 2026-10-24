"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Especialista } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Art";

export function EspecialistasLista({ especialistas }: { especialistas: Especialista[] }) {
  const titulos = useMemo(() => ["Todos", ...Array.from(new Set(especialistas.map((e) => e.titulo)))], [especialistas]);
  const [filtro, setFiltro] = useState("Todos");
  const lista = filtro === "Todos" ? especialistas : especialistas.filter((e) => e.titulo === filtro);

  return (
    <div className="wrap mt-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por especialidade">
        {titulos.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={filtro === t}
            onClick={() => setFiltro(t)}
            className={cn("rounded-full px-5 py-2.5 text-sm font-bold transition", filtro === t ? "bg-forest text-white" : "bg-cream text-ink hover:bg-mint")}
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((e) => (
          <li key={e.slug}>
            <Link href={`/especialistas/${e.slug}`} className="group flex h-full flex-col rounded-panel border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-card">
              <Avatar nome={e.avatar} className="size-28 rounded-full ring-4 ring-mint" />
              <h2 className="mt-5 font-display text-2xl font-bold">{e.nome}</h2>
              <p className="font-semibold text-forest">{e.titulo}</p>
              <p className="text-sm text-muted">{e.registro}</p>
              <p className="mt-4 flex-1 text-muted">“{e.citacao}”</p>
              <span className="mt-5 font-bold text-forest underline-offset-4 group-hover:underline">Ver seleção e perfil</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
