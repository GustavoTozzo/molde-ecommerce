import { Beaker, ClipboardCheck, PackageCheck, Scale } from "lucide-react";
import { ProductArt } from "@/components/ui/Art";
import { LinkBotao } from "@/components/ui/Button";
import { Contador } from "./Contador";

const etapas = [
  { icone: ClipboardCheck, titulo: "Conferência", texto: "Receita e dados do pedido são conferidos pelo farmacêutico." },
  { icone: Scale, titulo: "Pesagem", texto: "Cada insumo é pesado em balança calibrada e registrado." },
  { icone: Beaker, titulo: "Preparo", texto: "A fórmula é manipulada em ambiente controlado." },
  { icone: PackageCheck, titulo: "Rotulagem", texto: "Lote, validade e responsável impressos no rótulo." },
];

const numeros = [
  { alvo: 12000, sufixo: "+", rotulo: "pedidos entregues*" },
  { alvo: 4, sufixo: "", rotulo: "etapas de conferência por fórmula" },
  { alvo: 100, sufixo: "%", rotulo: "dos frascos com lote impresso" },
];

export function HistoriaMarca() {
  return (
    <section aria-labelledby="historia-titulo" className="wrap">
      <div className="grid items-center gap-10 overflow-hidden rounded-panel bg-cream p-7 md:grid-cols-[1.15fr_1fr] md:gap-14 md:p-14">
        <div>
          <p className="eyebrow">Como fazemos</p>
          <h2 id="historia-titulo" className="mt-2 font-display text-3xl leading-tight font-bold text-forest-dark md:text-[2.6rem]">
            Farmácia de manipulação, com a praticidade de uma loja online
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Cada fórmula passa pelas mesmas etapas de uma farmácia de bairro: conferência, pesagem, preparo e rotulagem. A diferença é que você acompanha tudo
            pelo celular e recebe em casa.
          </p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2">
            {etapas.map(({ icone: Icone, titulo, texto }, i) => (
              <li key={titulo} className="flex gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-forest shadow-card">
                  <Icone className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-bold">
                    {i + 1}. {titulo}
                  </p>
                  <p className="text-sm text-muted">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <LinkBotao href="/sobre" variante="primario" tamanho="l" className="mt-8">
            Conheça a Casa Magistral
          </LinkBotao>
        </div>
        <div className="relative">
          <div className="relative mx-auto aspect-square max-w-md rounded-full bg-mint">
            <ProductArt kind="jar" accent="#0B5D4B" id="hist-a" className="absolute bottom-[8%] left-[6%] h-[62%] -rotate-6" />
            <ProductArt kind="dropper" accent="#E58A2E" id="hist-b" className="absolute right-[10%] bottom-[10%] h-[52%] rotate-3" />
            <ProductArt kind="tube" accent="#2D8FB3" id="hist-c" className="absolute top-[8%] left-1/2 h-[44%] -translate-x-1/2" />
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
            {numeros.map((n) => (
              <div key={n.rotulo} className="rounded-2xl bg-white p-3 shadow-card">
                <dt className="sr-only">{n.rotulo}</dt>
                <dd>
                  <Contador alvo={n.alvo} sufixo={n.sufixo} className="font-display text-2xl font-extrabold text-forest md:text-3xl" />
                  <span className="mt-1 block text-xs leading-tight text-muted">{n.rotulo}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-center text-xs text-muted">*Números ilustrativos do molde.</p>
        </div>
      </div>
    </section>
  );
}
