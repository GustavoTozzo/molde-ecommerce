import type { Metadata } from "next";
import { Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import { site } from "@/lib/site";
import { Avatar } from "@/components/ui/Art";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { LinkBotao } from "@/components/ui/Button";
import { HistoriaMarca } from "@/components/home/HistoriaMarca";
import { getEspecialista } from "@/server/catalogo";

export const metadata: Metadata = {
  title: "Sobre a Casa Magistral",
  description: "Conheça a farmácia de manipulação, o responsável técnico e como cada fórmula é preparada.",
};

const valores = [
  { icone: ShieldCheck, titulo: "Segurança primeiro", texto: "Conferência de receita, pesagem registrada e rastreabilidade de lote em todas as fórmulas." },
  { icone: Eye, titulo: "Transparência", texto: "Ingredientes, doses e modo de conservação na página do produto, sem letras miúdas." },
  { icone: HeartHandshake, titulo: "Atendimento humano", texto: "Farmacêuticos de verdade respondem as suas dúvidas pelo WhatsApp e pelo formulário." },
];

export default async function PaginaSobre() {
  const responsavel = await getEspecialista("beatriz-lemos");
  return (
    <div className="space-y-16 pb-4 md:space-y-24">
      <CabecalhoPagina
        titulo="Uma farmácia de manipulação com a praticidade de uma loja online"
        sobretitulo="Sobre nós"
        trilha={[{ rotulo: "Sobre" }]}
        descricao="A Casa Magistral é um molde de demonstração. Substitua este texto pela história real da sua farmácia."
      />

      <section aria-label="Nossos valores" className="wrap">
        <ul className="grid gap-5 md:grid-cols-3">
          {valores.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="rounded-panel bg-cream p-7">
              <Icone className="size-10 text-forest" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-bold">{titulo}</h2>
              <p className="mt-2 text-muted">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <HistoriaMarca />

      {responsavel && (
        <section aria-labelledby="resp-titulo" className="wrap">
          <div className="grid items-center gap-8 rounded-panel border border-line bg-white p-7 md:grid-cols-[auto_1fr] md:gap-12 md:p-12">
            <Avatar nome={responsavel.avatar} className="mx-auto size-44 rounded-full ring-8 ring-mint" />
            <div>
              <p className="eyebrow">Responsável técnica</p>
              <h2 id="resp-titulo" className="mt-1 font-display text-3xl font-bold md:text-4xl">
                {responsavel.nome}
              </h2>
              <p className="text-muted">
                {responsavel.titulo} · {responsavel.registro}
              </p>
              <p className="mt-4 max-w-2xl text-lg">{responsavel.bio}</p>
              <p className="mt-3 max-w-2xl text-sm text-muted">
                Licença e autorização: {site.legal.afe} · {site.legal.licenca} (dados fictícios; substitua pelos documentos reais).
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="wrap text-center" aria-label="Chamada final">
        <h2 className="font-display text-3xl font-bold text-forest-dark md:text-4xl">Pronto para conhecer as fórmulas?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkBotao href="/produtos" variante="primario" tamanho="l">
            Ver produtos
          </LinkBotao>
          <LinkBotao href="/contato" variante="contorno" tamanho="l">
            Falar com a equipe
          </LinkBotao>
        </div>
      </section>
    </div>
  );
}
