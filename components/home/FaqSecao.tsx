import Link from "next/link";
import { Acordeao } from "@/components/ui/Acordeao";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";

export function FaqSecao({ itens, titulo = "Perguntas frequentes" }: { itens: { q: string; a: string }[]; titulo?: string }) {
  return (
    <section aria-label={titulo} className="wrap">
      <div className="grid gap-8 md:grid-cols-[1fr_1.7fr] md:gap-16">
        <div>
          <SecaoTitulo>{titulo}</SecaoTitulo>
          <p className="text-muted">Não encontrou o que procurava? Fale com a nossa equipe farmacêutica.</p>
          <Link href="/contato" className="mt-4 inline-block font-bold text-forest underline underline-offset-4">
            Ir para o atendimento
          </Link>
        </div>
        <Acordeao itens={itens.map((f, i) => ({ id: `faq-${i}`, titulo: f.q, conteudo: <p>{f.a}</p> }))} abertoInicial="faq-0" />
      </div>
    </section>
  );
}
