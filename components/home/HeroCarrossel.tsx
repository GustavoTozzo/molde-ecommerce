"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { classesBotao } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/Art";
import type { ArtKind } from "@/lib/art";

interface Slide {
  id: string;
  sobretitulo: string;
  titulo: string;
  texto: string;
  cta: { rotulo: string; href: string };
  cta2?: { rotulo: string; href: string };
  pontos: string[];
  tema: "verde" | "ambar" | "menta" | "lilas";
  arte: { kind: ArtKind; accent: string; escala?: string }[];
  selo: { grande: string; pequeno: string };
}

const slides: Slide[] = [
  {
    id: "farmacia",
    sobretitulo: "Farmácia de manipulação online",
    titulo: "Manipulados de farmácia, direto na sua porta",
    texto: "Cápsulas, sachês, gotas e cremes preparados por farmacêuticos, com lote rastreado e entrega para todo o Brasil.",
    cta: { rotulo: "Ver mais vendidos", href: "/produtos?ordem=vendas" },
    cta2: { rotulo: "Como funciona", href: "/sobre" },
    pontos: ["Farmacêutico responsável", "Lote rastreável", "Frete grátis acima de R$ 249"],
    tema: "verde",
    arte: [
      { kind: "dropper", accent: "#E58A2E", escala: "left-[4%] bottom-[4%] h-[62%]" },
      { kind: "jar", accent: "#0B5D4B", escala: "left-1/2 -translate-x-1/2 bottom-[2%] h-[84%]" },
      { kind: "sachet", accent: "#E58A2E", escala: "right-[2%] bottom-[4%] h-[62%]" },
    ],
    selo: { grande: "15%", pequeno: "off na assinatura" },
  },
  {
    id: "assinatura",
    sobretitulo: "Assinatura",
    titulo: "Sua rotina chega sozinha, todo mês",
    texto: "Escolha a frequência, receba com 15% de desconto e pause ou cancele quando quiser. Sem fidelidade.",
    cta: { rotulo: "Conhecer a assinatura", href: "/assinatura" },
    pontos: ["15% off em todos os itens", "Pause quando quiser", "Frete grátis na recorrência"],
    tema: "ambar",
    arte: [
      { kind: "box", accent: "#0B5D4B", escala: "left-[8%] bottom-[2%] h-[78%]" },
      { kind: "jar", accent: "#E58A2E", escala: "right-[8%] bottom-[2%] h-[70%]" },
    ],
    selo: { grande: "−15%", pequeno: "sempre" },
  },
  {
    id: "pele",
    sobretitulo: "Cuidados tópicos",
    titulo: "Cremes e séruns manipulados para a sua pele",
    texto: "Fórmulas tópicas com ativos clássicos da dermatologia, preparadas em pequenos lotes e sempre com rotulagem completa.",
    cta: { rotulo: "Ver cremes e géis", href: "/produtos?forma=cremes" },
    pontos: ["Pequenos lotes", "Rotulagem completa", "Teste de sensibilidade recomendado"],
    tema: "menta",
    arte: [
      { kind: "serum", accent: "#0B5D4B", escala: "left-[10%] bottom-[2%] h-[80%]" },
      { kind: "tube", accent: "#2D8FB3", escala: "right-[10%] bottom-[2%] h-[72%]" },
    ],
    selo: { grande: "Novo", pequeno: "gel hialurônico" },
  },
  {
    id: "familia",
    sobretitulo: "Cuidados da família",
    titulo: "Fórmulas líquidas para toda a casa",
    texto: "Gotas e xaropes com sabor agradável e copo ou conta-gotas dosador. Uso sempre sob orientação profissional.",
    cta: { rotulo: "Ver gotas e xaropes", href: "/produtos?objetivo=familia" },
    pontos: ["Dosador incluso", "Sabores suaves", "Embalagem com lacre"],
    tema: "lilas",
    arte: [
      { kind: "syrup", accent: "#0B5D4B", escala: "left-[8%] bottom-[2%] h-[82%]" },
      { kind: "dropper", accent: "#E58A2E", escala: "left-1/2 bottom-[2%] h-[66%]" },
      { kind: "syrup", accent: "#E58A2E", escala: "right-[6%] bottom-[2%] h-[72%]" },
    ],
    selo: { grande: "Frete", pequeno: "grátis acima de R$ 249" },
  },
];

const temas: Record<Slide["tema"], { fundo: string; texto: string; sub: string; arco: string; pontos: string; cta: string }> = {
  verde: { fundo: "bg-forest", texto: "text-white", sub: "text-white/85", arco: "bg-forest-dark", pontos: "text-mint-deep", cta: "ambar" },
  ambar: { fundo: "bg-amber-soft", texto: "text-ink", sub: "text-ink/75", arco: "bg-amber/40", pontos: "text-forest-dark", cta: "primario" },
  menta: { fundo: "bg-mint", texto: "text-forest-dark", sub: "text-ink/75", arco: "bg-mint-deep", pontos: "text-forest", cta: "primario" },
  lilas: { fundo: "bg-lilac-soft", texto: "text-ink", sub: "text-ink/75", arco: "bg-white/70", pontos: "text-forest-dark", cta: "primario" },
};

export function HeroCarrossel() {
  const [indice, setIndice] = useState(0);
  const [pausadoManual, setPausadoManual] = useState(false);
  const [pausadoHover, setPausadoHover] = useState(false);
  const [reduzMovimento, setReduzMovimento] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ler = () => setReduzMovimento(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  const rodando = !pausadoManual && !pausadoHover && !reduzMovimento;

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [rodando]);

  const ir = (i: number) => setIndice((i + slides.length) % slides.length);

  return (
    <section
      ref={raiz}
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      className="wrap pt-4 md:pt-6"
      onMouseEnter={() => setPausadoHover(true)}
      onMouseLeave={() => setPausadoHover(false)}
      onFocus={() => setPausadoHover(true)}
      onBlur={(e) => {
        if (!raiz.current?.contains(e.relatedTarget as Node)) setPausadoHover(false);
      }}
    >
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem]">
        <div className="grid" aria-live={rodando ? "off" : "polite"}>
          {slides.map((s, i) => {
            const t = temas[s.tema];
            const ativo = i === indice;
            return (
              <div
                key={s.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${slides.length}`}
                aria-hidden={!ativo}
                inert={!ativo}
                className={cn(
                  "col-start-1 row-start-1 grid min-h-[34rem] items-center gap-6 px-6 pt-10 pb-24 transition-opacity duration-700 md:min-h-[35rem] md:grid-cols-[1.05fr_1fr] md:px-14 md:py-12 lg:px-20",
                  t.fundo,
                  t.texto,
                  ativo ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <div className="relative z-10 max-w-xl">
                  <p className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold ring-1 ring-current/25">{s.sobretitulo}</p>
                  <h2 className="font-display text-[2.4rem] leading-[1.04] font-extrabold tracking-tight md:text-[3.6rem]">{s.titulo}</h2>
                  <p className={cn("mt-5 max-w-lg text-lg leading-relaxed", t.sub)}>{s.texto}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={s.cta.href} className={classesBotao(t.cta as "ambar" | "primario", "l")}>
                      {s.cta.rotulo}
                    </Link>
                    {s.cta2 && (
                      <Link href={s.cta2.href} className={classesBotao(s.tema === "verde" ? "claro" : "contorno", "l")}>
                        {s.cta2.rotulo}
                      </Link>
                    )}
                  </div>
                  <ul className={cn("mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold", t.pontos)}>
                    {s.pontos.map((p) => (
                      <li key={p} className="flex items-center gap-1.5">
                        <Check className="size-4" aria-hidden /> {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative mx-auto h-72 w-full max-w-lg md:h-[26rem] md:max-w-none">
                  <div className={cn("absolute inset-x-[6%] bottom-0 h-[92%] rounded-t-full", t.arco)} aria-hidden />
                  <div className="absolute inset-x-[2%] bottom-0 h-[84%]">
                    {s.arte.map((a, k) => (
                      <ProductArt
                        key={k}
                        kind={a.kind}
                        accent={a.accent}
                        id={`hero-${s.id}-${k}`}
                        className={cn("absolute drop-shadow-xl", a.escala)}
                      />
                    ))}
                  </div>
                  <div className="absolute top-0 right-[4%] flex size-24 rotate-6 flex-col items-center justify-center rounded-full bg-amber text-center text-ink shadow-pop md:size-28">
                    <span className="font-display text-2xl leading-none font-extrabold md:text-3xl">{s.selo.grande}</span>
                    <span className="mt-0.5 max-w-[5.5rem] text-[0.7rem] leading-tight font-bold">{s.selo.pequeno}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-card md:right-8 md:bottom-6">
          <div className="flex items-center gap-1.5 px-2" role="tablist" aria-label="Escolher slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === indice}
                aria-label={`Ir para o slide ${i + 1}`}
                onClick={() => ir(i)}
                className="group flex h-6 min-w-6 items-center justify-center px-1"
              >
                {/* o botão tem 24 px de área de toque (WCAG 2.5.8); o ponto desenhado é menor */}
                <span className={cn("block h-2.5 rounded-full transition-all", i === indice ? "w-7 bg-forest" : "w-2.5 bg-line group-hover:bg-sage")} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPausadoManual((p) => !p)} aria-label={pausadoManual ? "Retomar apresentação" : "Pausar apresentação"} className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-mint">
            {pausadoManual ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          </button>
          <button type="button" onClick={() => ir(indice - 1)} aria-label="Slide anterior" className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-mint">
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button type="button" onClick={() => ir(indice + 1)} aria-label="Próximo slide" className="flex size-9 items-center justify-center rounded-full text-ink hover:bg-mint">
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
