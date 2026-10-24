import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Invalida o cache do catálogo por chamada externa (webhook de outro sistema, ou a suíte de testes
 * depois de alterar o banco diretamente). Desligada por padrão: sem `REVALIDATE_SECRET` no ambiente a
 * rota responde 404 como se não existisse. Com ele, exige o mesmo valor no cabeçalho `x-revalidate-secret`.
 * Não é Server Action, então não há `updateTag`: `{ expire: 0 }` descarta o conteúdo na hora.
 */
export async function POST(req: Request) {
  const segredo = process.env.REVALIDATE_SECRET;
  if (!segredo) return new Response("Não encontrado.", { status: 404 });

  const enviado = Buffer.from(req.headers.get("x-revalidate-secret") ?? "");
  const esperado = Buffer.from(segredo);
  if (enviado.length !== esperado.length || !timingSafeEqual(enviado, esperado)) {
    return new Response("Não autorizado.", { status: 401 });
  }
  revalidateTag("catalogo", { expire: 0 });
  return Response.json({ ok: true });
}
