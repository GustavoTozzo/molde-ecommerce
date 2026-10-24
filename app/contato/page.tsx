import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { ContatoForm } from "@/components/contato/ContatoForm";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com os farmacêuticos da Casa Magistral por WhatsApp, e-mail ou formulário.",
};

export default function PaginaContato() {
  const wa = `https://wa.me/${site.whatsapp.numero}?text=${encodeURIComponent(site.whatsapp.mensagem)}`;
  const canais = [
    { icone: MessageCircle, titulo: "WhatsApp", texto: site.whatsapp.exibicao, href: wa, externo: true },
    { icone: Mail, titulo: "E-mail", texto: site.email, href: `mailto:${site.email}` },
    { icone: Clock, titulo: "Horário", texto: site.horario },
    { icone: MapPin, titulo: "Endereço", texto: site.endereco },
  ];
  return (
    <div className="pb-4">
      <CabecalhoPagina titulo="Fale com a nossa equipe" sobretitulo="Contato" trilha={[{ rotulo: "Contato" }]} descricao="Dúvidas sobre pedidos, produtos ou envio de receita? Respondemos em horário comercial." />
      <div className="wrap mt-10 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
        <ul className="space-y-4">
          {canais.map(({ icone: Icone, titulo, texto, href, externo }) => (
            <li key={titulo} className="flex gap-4 rounded-2xl bg-cream p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-forest shadow-card">
                <Icone className="size-6" aria-hidden />
              </span>
              <div>
                <p className="font-bold">{titulo}</p>
                {href ? (
                  <a href={href} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-muted underline-offset-4 hover:text-forest hover:underline">
                    {texto}
                  </a>
                ) : (
                  <p className="text-muted">{texto}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <Suspense fallback={<div className="h-96 rounded-panel bg-cream" aria-hidden />}>
          <ContatoForm />
        </Suspense>
      </div>
    </div>
  );
}
