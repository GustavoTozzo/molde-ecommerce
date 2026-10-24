import { IconeWhatsapp } from "@/components/ui/Icones";
import { site } from "@/lib/site";

export function WhatsappFlutuante() {
  const href = `https://wa.me/${site.whatsapp.numero}?text=${encodeURIComponent(site.whatsapp.mensagem)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a farmácia pelo WhatsApp"
      className="whatsapp-flutuante group fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-forest px-4 py-3 text-white shadow-pop transition hover:bg-forest-dark sm:right-6 sm:bottom-6"
    >
      <IconeWhatsapp className="size-6" />
      <span className="hidden max-w-0 overflow-hidden text-sm font-bold whitespace-nowrap transition-all duration-300 group-hover:max-w-48 group-focus-visible:max-w-48 sm:block">
        Fale com um farmacêutico
      </span>
    </a>
  );
}
