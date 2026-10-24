"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown, CircleHelp, Heart, Menu, ShoppingBag, X } from "lucide-react";
import { formas, objetivos } from "@/data/taxonomia";
import { navPrincipal, site } from "@/lib/site";
import { abrirCarrinho, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Painel } from "@/components/ui/Painel";
import { ProductArt } from "@/components/ui/Art";
import { classesBotao } from "@/components/ui/Button";
import { Acordeao } from "@/components/ui/Acordeao";
import { BuscaCampo } from "./BuscaCampo";

function useQuantidadeCarrinho() {
  return useStore((s) => s.itens.reduce((acc, i) => acc + i.qtd, 0));
}

function MegaMenu({ aoFechar }: { aoFechar: () => void }) {
  return (
    <div>
      <div className="grid animate-fade-in gap-10 rounded-b-panel bg-white p-8 shadow-pop ring-1 ring-line lg:grid-cols-[1fr_1fr_1.1fr]">
        <div>
          <p className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">Por forma farmacêutica</p>
          <ul className="grid grid-cols-2 gap-1">
            {formas.map((f) => (
              <li key={f.id}>
                <Link href={`/produtos?forma=${f.id}`} onClick={aoFechar} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-mint">
                  <span className="block size-11 shrink-0 rounded-xl bg-cream p-1">
                    <ProductArt kind={f.art} accent={f.accent} id={`mm-${f.id}`} className="h-full" />
                  </span>
                  <span className="text-sm font-bold">{f.rotulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">Por objetivo</p>
          <ul className="grid grid-cols-1 gap-0.5">
            {objetivos.map((o) => (
              <li key={o.id}>
                <Link href={`/produtos?objetivo=${o.id}`} onClick={aoFechar} className="block rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-mint hover:text-forest-dark">
                  {o.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/assinatura" onClick={aoFechar} className="group relative flex flex-col justify-between overflow-hidden rounded-card bg-forest p-6 text-white">
          <div className="relative z-10 max-w-[60%]">
            <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-ink">Assinatura</span>
            <p className="mt-3 font-display text-2xl leading-tight font-bold">15% off em toda a rotina</p>
            <p className="mt-1.5 text-sm text-white/80">Receba no ritmo que combina com você. Cancele quando quiser.</p>
            <span className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Conhecer a assinatura</span>
          </div>
          <ProductArt kind="box" accent="#E58A2E" id="mm-assin" className="absolute -right-4 bottom-0 h-[85%] transition-transform duration-500 group-hover:scale-105" />
        </Link>
      </div>
    </div>
  );
}

function MenuMobile({ aberto, aoFechar, conta }: { aberto: boolean; aoFechar: () => void; conta: ReactNode }) {
  return (
    <Painel aberto={aberto} aoFechar={aoFechar} rotulo="Menu de navegação" lado="esquerda">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <Logo />
        <button type="button" data-autofocus onClick={aoFechar} aria-label="Fechar menu" className="rounded-full p-2 hover:bg-mint">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <BuscaCampo aoNavegar={aoFechar} />
        <nav aria-label="Menu principal" className="mt-4">
          <Acordeao
            itens={[
              {
                id: "formas",
                titulo: "Todos os produtos",
                conteudo: (
                  <ul className="grid gap-1">
                    <li>
                      <Link href="/produtos" onClick={aoFechar} className="block rounded-xl px-3 py-2 font-bold text-forest hover:bg-mint">
                        Ver todos
                      </Link>
                    </li>
                    {formas.map((f) => (
                      <li key={f.id}>
                        <Link href={`/produtos?forma=${f.id}`} onClick={aoFechar} className="block rounded-xl px-3 py-2 text-ink hover:bg-mint">
                          {f.rotulo}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "objetivos",
                titulo: "Por objetivo",
                conteudo: (
                  <ul className="grid gap-1">
                    {objetivos.map((o) => (
                      <li key={o.id}>
                        <Link href={`/produtos?objetivo=${o.id}`} onClick={aoFechar} className="block rounded-xl px-3 py-2 text-ink hover:bg-mint">
                          {o.rotulo}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
          <ul className="mt-2 divide-y divide-line">
            {navPrincipal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={aoFechar} className={cn("block py-4 text-lg font-bold", "destaque" in l && l.destaque ? "text-amber-dark" : "text-ink")}>
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-2">
          <div onClick={aoFechar}>{conta}</div>
          <Link href="/contato" onClick={aoFechar} className={classesBotao("claro", "m", "w-full")}>
            <CircleHelp className="size-4" aria-hidden /> Precisa de ajuda?
          </Link>
        </div>
      </div>
    </Painel>
  );
}

/**
 * `conta` e `contaMobile` vêm do servidor (leem a sessão) dentro de <Suspense>: o resto do
 * cabeçalho continua estático e só esse trecho chega por streaming.
 */
export function Header({ conta, contaMobile }: { conta: ReactNode; contaMobile: ReactNode }) {
  const pathname = usePathname();
  const megaId = useId();
  const [megaEm, setMegaEm] = useState<string | null>(null);
  const [mobileEm, setMobileEm] = useState<string | null>(null);
  const [rolou, setRolou] = useState(false);
  const qtd = useQuantidadeCarrinho();
  const favoritos = useStore((s) => s.favoritos.length);

  const megaAberto = megaEm === pathname;
  const mobileAberto = mobileEm === pathname;

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    if (!megaAberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setMegaEm(null);
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [megaAberto]);

  return (
    <header className={cn("sticky top-0 z-40 bg-white transition-shadow duration-300", rolou && "shadow-header")}>
      <div className="wrap flex items-center gap-3 py-3 md:gap-10 md:pt-5 md:pb-3">
        <button type="button" onClick={() => setMobileEm(pathname)} aria-label="Abrir menu" className="-ml-2 rounded-full p-2 text-ink hover:bg-mint md:hidden">
          <Menu className="size-6" aria-hidden />
        </button>
        <Logo />
        <BuscaCampo className="hidden max-w-3xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:gap-5">
          {conta}
          <Link href="/contato" aria-label="Ajuda" className="hidden items-center gap-2 rounded-full p-2 text-sm font-semibold hover:bg-mint md:flex">
            <CircleHelp className="size-6" aria-hidden />
            <span className="hidden xl:inline">Ajuda</span>
          </Link>
          <Link href="/favoritos" aria-label={`Favoritos (${favoritos})`} className="relative rounded-full p-2 hover:bg-mint">
            <Heart className="size-6" aria-hidden />
            {favoritos > 0 && <span className="absolute top-0.5 right-0 flex size-[18px] items-center justify-center rounded-full bg-coral text-[11px] font-bold text-white">{favoritos}</span>}
          </Link>
          <button type="button" onClick={abrirCarrinho} aria-label={`Abrir carrinho, ${qtd} ${qtd === 1 ? "item" : "itens"}`} className="relative rounded-full p-2 text-forest hover:bg-mint">
            <ShoppingBag className="size-7" aria-hidden />
            {qtd > 0 && <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-amber text-xs font-bold text-ink">{qtd}</span>}
          </button>
        </div>
      </div>

      <div className="wrap pb-3 md:hidden">
        <BuscaCampo />
        <nav aria-label="Atalhos de categorias" className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <Link href="/produtos" className="shrink-0 rounded-full bg-forest px-4 py-2 text-sm font-bold text-white">
            Todos os produtos
          </Link>
          {formas.map((f) => (
            <Link key={f.id} href={`/produtos?forma=${f.id}`} className="shrink-0 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink">
              {f.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative hidden border-b border-line md:block" onMouseLeave={() => setMegaEm(null)}>
        <nav aria-label="Menu principal" className="wrap relative flex items-center gap-8 pt-1 pb-3">
          <button
            type="button"
            aria-expanded={megaAberto}
            aria-controls={megaId}
            onClick={() => setMegaEm(megaAberto ? null : pathname)}
            onMouseEnter={() => setMegaEm(pathname)}
            className={classesBotao("primario", "m", "gap-2")}
          >
            Todos os produtos
            <ChevronDown className={cn("size-4 transition-transform", megaAberto && "rotate-180")} aria-hidden />
          </button>
          <ul className="flex flex-1 items-center justify-between gap-4 lg:justify-start lg:gap-9">
            {navPrincipal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn("rounded-full py-2 text-sm font-bold transition hover:text-forest", "destaque" in l && l.destaque ? "text-amber-dark" : "text-ink", pathname === l.href.split("?")[0] && "underline underline-offset-8 decoration-2")}
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
          <span className="hidden text-xs text-muted xl:block">{site.tagline}</span>
        </nav>
        {megaAberto && (
          <div id={megaId} className="absolute inset-x-0 top-full z-50">
            <div className="wrap">
              <MegaMenu aoFechar={() => setMegaEm(null)} />
            </div>
          </div>
        )}
      </div>

      <MenuMobile aberto={mobileAberto} aoFechar={() => setMobileEm(null)} conta={contaMobile} />
    </header>
  );
}
