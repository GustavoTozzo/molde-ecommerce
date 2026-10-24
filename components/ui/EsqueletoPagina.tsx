/** Reserva o espaço enquanto o conteúdo de uma rota dinâmica carrega (ver docs/decisoes-fase-5.md). */
export function EsqueletoPagina() {
  return (
    <div className="wrap pt-8 md:pt-12" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 animate-pulse rounded-full bg-cream" />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-panel bg-cream" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-full bg-cream" />
          <div className="h-5 w-full animate-pulse rounded-full bg-cream" />
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-cream" />
          <div className="mt-8 h-14 w-full animate-pulse rounded-full bg-cream" />
        </div>
      </div>
    </div>
  );
}
