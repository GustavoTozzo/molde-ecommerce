import Link from "next/link";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, UserCog } from "lucide-react";
import { Botao, LinkBotao } from "@/components/ui/Button";
import { prisma } from "@/server/prisma";
import { sair } from "@/server/acoes/conta";
import { exigirUsuario } from "@/server/sessao";

export default async function PaginaConta() {
  const usuario = await exigirUsuario("/conta");
  const [pedidos, enderecos, favoritos] = await Promise.all([
    prisma.pedido.count({ where: { usuarioId: usuario.id } }),
    prisma.endereco.count({ where: { usuarioId: usuario.id } }),
    prisma.favorito.count({ where: { usuarioId: usuario.id } }),
  ]);

  const atalhos = [
    { href: "/conta/pedidos", icone: Package, titulo: "Meus pedidos", detalhe: pedidos === 0 ? "Nenhum pedido ainda" : `${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"}` },
    { href: "/conta/enderecos", icone: MapPin, titulo: "Endereços", detalhe: enderecos === 0 ? "Nenhum endereço salvo" : `${enderecos} ${enderecos === 1 ? "endereço" : "endereços"}` },
    { href: "/favoritos", icone: Heart, titulo: "Favoritos", detalhe: favoritos === 0 ? "Nenhum favorito" : `${favoritos} ${favoritos === 1 ? "produto" : "produtos"}` },
    { href: "/conta/dados", icone: UserCog, titulo: "Dados e senha", detalhe: "Nome, telefone e senha" },
  ];

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-forest-dark">Olá, {usuario.nome.split(/\s+/)[0]}</h2>
      <p className="mt-1 text-muted">{usuario.email}</p>
      {(usuario.papel === "ADMINISTRADOR" || usuario.papel === "FARMACEUTICO") && (
        <LinkBotao href="/admin" variante="primario" tamanho="m" className="mt-4">
          <LayoutDashboard className="size-4" aria-hidden /> Ir para o painel da loja
        </LinkBotao>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {atalhos.map(({ href, icone: Icone, titulo, detalhe }) => (
          <li key={href}>
            <Link href={href} className="flex h-full items-start gap-4 rounded-card border border-line bg-white p-5 transition hover:border-forest hover:bg-mint/40">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint text-forest">
                <Icone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-bold">{titulo}</span>
                <span className="text-sm text-muted">{detalhe}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <form action={sair} className="mt-8">
        <Botao type="submit" variante="claro" tamanho="m">
          <LogOut className="size-4" aria-hidden /> Sair da conta
        </Botao>
      </form>
    </div>
  );
}
