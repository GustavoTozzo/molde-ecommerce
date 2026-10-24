import { prisma } from "@/server/prisma";
import { usuarioAtual } from "@/server/sessao";

/**
 * Entrega o arquivo de uma receita. Só o dono ou a equipe (farmacêutico/administrador) acessam;
 * para qualquer outra pessoa a resposta é 404, igual à de um id que não existe (não confirma
 * a existência da receita de ninguém). O tipo vem da assinatura do arquivo gravada no envio.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/receitas/[id]">) {
  const usuario = await usuarioAtual();
  if (!usuario) return new Response("Faça login para continuar.", { status: 401 });

  const { id } = await ctx.params;
  const receita = await prisma.receita.findUnique({
    where: { id },
    select: { usuarioId: true, nomeArquivo: true, tipoMime: true, conteudo: true },
  });
  const equipe = usuario.papel === "ADMINISTRADOR" || usuario.papel === "FARMACEUTICO";
  if (!receita || (receita.usuarioId !== usuario.id && !equipe)) return new Response("Receita não encontrada.", { status: 404 });

  return new Response(receita.conteudo, {
    headers: {
      "Content-Type": receita.tipoMime,
      "Content-Length": String(receita.conteudo.byteLength),
      "Content-Disposition": `inline; filename="${receita.nomeArquivo.replace(/[^\w.-]/g, "_")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
