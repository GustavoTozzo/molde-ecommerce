import type { Metadata } from "next";
import { CalendarClock, PackageCheck, PauseCircle, Percent } from "lucide-react";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { SimuladorAssinatura } from "@/components/assinatura/SimuladorAssinatura";
import { FaqSecao } from "@/components/home/FaqSecao";
import { LinkBotao } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Assinatura",
  description: "Receba suas fórmulas no ritmo que combina com você, com 15% de desconto e sem fidelidade.",
};

const passos = [
  { icone: PackageCheck, titulo: "Escolha seus produtos", texto: "Em cada página de produto, selecione “Assinatura” em vez de compra única." },
  { icone: CalendarClock, titulo: "Defina a frequência", texto: "Receba a cada 1, 2 ou 3 meses. Você pode mudar o ritmo quando quiser." },
  { icone: Percent, titulo: "Pague 15% a menos", texto: "O desconto vale em todas as entregas, enquanto a assinatura estiver ativa." },
  { icone: PauseCircle, titulo: "Pause ou cancele", texto: "Sem multa e sem fidelidade. Basta avisar antes do próximo envio." },
];

const faq = [
  { q: "Existe fidelidade ou multa para cancelar?", a: "Não. Você pode pausar, alterar a frequência ou cancelar a qualquer momento, desde que avise antes do próximo envio." },
  { q: "Posso assinar produtos com venda sob receita?", a: "A recorrência de itens sob receita depende da validade do documento. O farmacêutico responsável avisa quando for necessário enviar uma nova receita." },
  { q: "O preço pode mudar?", a: "O desconto de 15% é mantido enquanto a assinatura estiver ativa. Reajustes gerais de preço, quando ocorrerem, são comunicados com antecedência." },
  { q: "Como altero o endereço de entrega?", a: "Pela área do cliente ou pelo atendimento, até 48 horas antes da data prevista do próximo envio." },
];

export default function PaginaAssinatura() {
  return (
    <div className="space-y-16 pb-4 md:space-y-24">
      <CabecalhoPagina
        titulo="Sua rotina chega sozinha, com 15% de desconto"
        sobretitulo="Assinatura"
        trilha={[{ rotulo: "Assinatura" }]}
        descricao="Sem fidelidade, sem multa e com a mesma rastreabilidade de lote de uma compra única."
      >
        <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-8">
          Escolher produtos
        </LinkBotao>
      </CabecalhoPagina>

      <section aria-label="Como funciona" className="wrap">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="rounded-panel bg-cream p-6">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-forest shadow-card">
                <Icone className="size-7" aria-hidden />
              </span>
              <p className="mt-5 font-display text-xl font-bold">
                {i + 1}. {titulo}
              </p>
              <p className="mt-2 text-muted">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Simulador de economia" className="wrap">
        <SimuladorAssinatura />
      </section>

      <FaqSecao itens={faq} titulo="Dúvidas sobre a assinatura" />
    </div>
  );
}
