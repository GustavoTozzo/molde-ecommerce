import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { site } from "@/lib/site";
import { Aviso } from "@/components/layout/Aviso";
import { BarraAvisos } from "@/components/layout/BarraAvisos";
import { Header } from "@/components/layout/Header";
import { Rodape } from "@/components/layout/Rodape";
import { WhatsappFlutuante } from "@/components/layout/WhatsappFlutuante";
import { CarrinhoGaveta } from "@/components/carrinho/CarrinhoGaveta";
import { CatalogoProvider } from "@/components/catalogo/CatalogoContext";
import { getCatalogo } from "@/server/catalogo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${site.nome} · ${site.tagline}`, template: `%s · ${site.nome}` },
  description: site.descricao,
  // Conteúdo fictício de demonstração: não indexar até a marca real ser configurada.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0B5D4B" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalogo = await getCatalogo();
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-bold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <CatalogoProvider produtos={catalogo}>
          <BarraAvisos />
          <Header />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Rodape />
          <CarrinhoGaveta />
          <Aviso />
          <WhatsappFlutuante />
        </CatalogoProvider>
      </body>
    </html>
  );
}
