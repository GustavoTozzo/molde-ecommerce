import Link from "next/link";
import { FlaskConical, FileText, MessageCircle } from "lucide-react";
import { Selo } from "@/components/ui/Selo";

/**
 * Espaço reservado para a próxima etapa do projeto: o fluxo de manipulação
 * personalizada (orçamento a partir de receita). Por enquanto leva ao contato.
 */
export function FaixaPersonalizada() {
  return (
    <section aria-labelledby="personalizada-titulo" className="wrap">
      <div className="relative overflow-hidden rounded-panel bg-forest-dark p-7 text-white md:p-12">
        <div className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-forest/60" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -bottom-32 size-72 rounded-full bg-amber/20" aria-hidden />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Selo tom="ambar">Em breve</Selo>
            <h2 id="personalizada-titulo" className="mt-4 font-display text-3xl leading-tight font-bold md:text-[2.6rem]">
              Tem uma receita? Em breve, monte sua fórmula personalizada
            </h2>
            <p className="mt-3 max-w-xl text-lg text-white/80">
              Estamos preparando o envio de receita e o orçamento online de fórmulas sob medida. Enquanto isso, nossos farmacêuticos atendem pelo WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contato?assunto=formula-personalizada" className="inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3.5 text-base font-bold text-ink transition hover:bg-[#e8962a]">
                <MessageCircle className="size-5" aria-hidden /> Quero ser avisado
              </Link>
              <Link href="/institucional/venda-com-receita" className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white hover:text-forest-dark">
                <FileText className="size-5" aria-hidden /> Como funciona a receita
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-end md:block" aria-hidden>
            <div className="flex size-56 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <FlaskConical className="size-24 text-amber" strokeWidth={1.25} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
