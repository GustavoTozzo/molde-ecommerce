import { SearchX } from "lucide-react";
import { LinkBotao } from "@/components/ui/Button";

export default function NaoEncontrada() {
  return (
    <div className="wrap py-20 text-center md:py-28">
      <SearchX className="mx-auto size-16 text-forest" strokeWidth={1.3} aria-hidden />
      <h1 className="mt-6 font-display text-5xl font-extrabold text-forest-dark">Página não encontrada</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-muted">O endereço pode ter mudado ou não existir mais. Que tal voltar ao catálogo?</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkBotao href="/" variante="primario" tamanho="l">
          Ir para o início
        </LinkBotao>
        <LinkBotao href="/produtos" variante="contorno" tamanho="l">
          Ver produtos
        </LinkBotao>
      </div>
    </div>
  );
}
