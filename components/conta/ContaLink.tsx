import Link from "next/link";
import { User } from "lucide-react";
import { classesBotao } from "@/components/ui/Button";
import { usuarioAtual } from "@/server/sessao";

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/** Atalho do cabeçalho (desktop). Lê a sessão no servidor; renderize dentro de <Suspense>. */
export async function ContaLink() {
  const usuario = await usuarioAtual();
  return (
    <Link href={usuario ? "/conta" : "/entrar"} className="hidden items-center gap-2.5 rounded-full p-1.5 hover:bg-mint lg:flex">
      <User className="size-6" aria-hidden />
      <span className="text-left text-xs leading-tight">
        {usuario ? `Olá, ${primeiroNome(usuario.nome)}` : "Entrar ou"}
        <strong className="block text-sm">{usuario ? "Minha conta" : "cadastrar-se"}</strong>
      </span>
    </Link>
  );
}

/** Versão do menu lateral (mobile). */
export async function ContaLinkMobile() {
  const usuario = await usuarioAtual();
  return (
    <Link href={usuario ? "/conta" : "/entrar"} className={classesBotao("secundario", "m", "w-full")}>
      <User className="size-4" aria-hidden /> {usuario ? `Minha conta (${primeiroNome(usuario.nome)})` : "Entrar ou cadastrar-se"}
    </Link>
  );
}

/** Reserva o espaço enquanto a sessão carrega, sem mostrar "Entrar" para quem já está logado. */
export function ContaLinkEsqueleto() {
  return (
    <span className="hidden items-center gap-2.5 p-1.5 lg:flex" aria-hidden>
      <User className="size-6 text-line" />
      <span className="grid gap-1.5">
        <span className="h-2.5 w-14 rounded-full bg-cream" />
        <span className="h-3 w-24 rounded-full bg-cream" />
      </span>
    </span>
  );
}

export function ContaLinkMobileEsqueleto() {
  return <span className="block h-11 w-full rounded-full bg-cream" aria-hidden />;
}
