import { usuarioAtual } from "@/server/sessao";
import { SincronizarConta } from "./SincronizarConta";

/** Lê a sessão no servidor e entrega ao navegador. Renderize dentro de <Suspense>. */
export async function SessaoDoServidor() {
  const usuario = await usuarioAtual();
  return <SincronizarConta logado={!!usuario} />;
}
