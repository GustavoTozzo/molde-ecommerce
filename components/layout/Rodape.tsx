import Link from "next/link";
import { CreditCard, FileText, Lock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { formas, objetivos } from "@/data/taxonomia";
import { linksInstitucionais, linksSuporte, site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { IconeInstagram, IconePix, IconeWhatsapp, IconeYoutube } from "@/components/ui/Icones";
import { NewsletterForm } from "./NewsletterForm";

const link = "text-white/75 transition hover:text-white hover:underline underline-offset-4";

function Coluna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-sans text-sm font-bold tracking-wide text-white uppercase">{titulo}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

export function Rodape() {
  const { legal } = site;
  return (
    <footer className="mt-24 md:mt-32">
      <section aria-labelledby="newsletter-titulo" className="wrap relative z-10 -mb-16 md:-mb-20">
        <div className="grid items-center gap-8 rounded-panel bg-mint p-6 md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-12">
          <div>
            <h2 id="newsletter-titulo" className="font-display text-3xl leading-tight font-bold text-forest-dark md:text-4xl">
              Receba novidades e 10% na primeira compra
            </h2>
            <p className="mt-2 text-muted">Lançamentos, conteúdos de saúde e ofertas direto no seu e-mail.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <div className="bg-forest-deeper pt-28 text-white md:pt-36">
        <div className="wrap">
          <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
            <div className="sm:col-span-2 lg:col-span-1">
              <Logo tom="claro" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">{site.descricao}</p>
              <div className="mt-5 flex gap-2">
                <a href="#" aria-label="Instagram" className="flex size-11 items-center justify-center rounded-full border border-white/25 transition hover:bg-white hover:text-forest-dark">
                  <IconeInstagram className="size-5" />
                </a>
                <a href="#" aria-label="YouTube" className="flex size-11 items-center justify-center rounded-full border border-white/25 transition hover:bg-white hover:text-forest-dark">
                  <IconeYoutube className="size-5" />
                </a>
                <a
                  href={`https://wa.me/${site.whatsapp.numero}`}
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-11 items-center justify-center rounded-full border border-white/25 transition hover:bg-white hover:text-forest-dark"
                >
                  <IconeWhatsapp className="size-5" />
                </a>
              </div>
            </div>
            <Coluna titulo="Produtos">
              <li>
                <Link href="/produtos" className={link}>
                  Todos os produtos
                </Link>
              </li>
              {formas.map((f) => (
                <li key={f.id}>
                  <Link href={`/produtos?forma=${f.id}`} className={link}>
                    {f.rotulo}
                  </Link>
                </li>
              ))}
            </Coluna>
            <Coluna titulo="Objetivos">
              {objetivos.map((o) => (
                <li key={o.id}>
                  <Link href={`/produtos?objetivo=${o.id}`} className={link}>
                    {o.rotulo}
                  </Link>
                </li>
              ))}
            </Coluna>
            <Coluna titulo="Suporte">
              {linksSuporte.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.rotulo}
                  </Link>
                </li>
              ))}
            </Coluna>
            <Coluna titulo="Institucional">
              {linksInstitucionais.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.rotulo}
                  </Link>
                </li>
              ))}
              <li className="flex items-start gap-2 pt-2 text-white/75">
                <Phone className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
                {site.whatsapp.exibicao}
              </li>
              <li className="flex items-start gap-2 text-white/75">
                <Mail className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
                {site.email}
              </li>
            </Coluna>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 border-y border-white/15 py-6">
            <div className="flex flex-wrap items-center gap-2" aria-label="Formas de pagamento">
              {["Visa", "Mastercard", "Elo"].map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-bold text-white/85">
                  <CreditCard className="size-4" aria-hidden />
                  {m}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-bold text-white/85">
                <IconePix className="size-4" />
                Pix
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-bold text-white/85">
                <FileText className="size-4" aria-hidden />
                Boleto
              </span>
            </div>
            <p className="text-sm font-bold">Pague em até {site.loja.parcelasMax}x sem juros no cartão ou à vista com desconto</p>
            <div className="flex items-center gap-4 text-xs font-semibold text-white/85">
              <span className="flex items-center gap-2">
                <Lock className="size-5 text-amber" aria-hidden />
                Site seguro (SSL)
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber" aria-hidden />
                Farmácia licenciada
              </span>
            </div>
          </div>

          <div className="grid gap-6 py-8 text-xs leading-relaxed text-white/65 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <p>
                <strong className="text-white/90">{legal.razaoSocial}</strong> · CNPJ {legal.cnpj}
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {site.endereco}
              </p>
              <p>
                Farmacêutico(a) responsável: {legal.farmaceutico} · {legal.crf} · {legal.afe} · {legal.licenca}
              </p>
              <p>Atendimento: {site.horario}.</p>
            </div>
            <div className="space-y-3">
              <p>
                Fórmulas manipuladas são preparadas sob responsabilidade técnica de farmacêutico. Itens sujeitos a prescrição só são dispensados mediante receita. Suplementos alimentares não são medicamentos; não exceda a recomendação diária indicada e consulte um profissional de saúde.
              </p>
              <p>Imagens meramente ilustrativas. Conteúdo, nomes, preços e dados legais deste molde são fictícios.</p>
            </div>
          </div>
          <p className="border-t border-white/15 py-5 text-xs text-white/55">
            © {site.ano} {site.nome}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
