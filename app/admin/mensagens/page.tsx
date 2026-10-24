import type { Metadata } from "next";
import { Botao } from "@/components/ui/Button";
import { formatarDataHora } from "@/lib/format";
import { alternarMensagemLida } from "@/server/acoes/admin-catalogo";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Mensagens" };

const ASSUNTOS: Record<string, string> = {
  pedido: "Dúvida sobre um pedido",
  produto: "Dúvida sobre um produto",
  receita: "Envio de receita",
  "formula-personalizada": "Fórmula personalizada",
  outro: "Outro assunto",
};

export default async function PaginaMensagens() {
  await exigirEquipe("/admin/mensagens");
  const [mensagens, inscritos] = await Promise.all([
    prisma.mensagemContato.findMany({ orderBy: [{ lida: "asc" }, { criadoEm: "desc" }], take: 60 }),
    prisma.inscritoNewsletter.count(),
  ]);
  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-forest-dark">Mensagens</h2>
      <p className="mt-1 text-sm text-muted">Não lidas primeiro. A lista da newsletter tem {inscritos} {inscritos === 1 ? "inscrito" : "inscritos"}.</p>
      {mensagens.length === 0 ? (
        <p className="mt-6 rounded-card bg-cream p-6 text-muted">Nenhuma mensagem recebida.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {mensagens.map((m) => (
            <li key={m.id} className={`rounded-card border p-5 ${m.lida ? "border-line bg-white" : "border-amber bg-amber-soft/40"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-bold">
                  {m.nome} <a href={`mailto:${m.email}`} className="font-normal text-forest underline">{m.email}</a>
                </p>
                <time className="text-xs text-muted" dateTime={m.criadoEm.toISOString()}>
                  {formatarDataHora(m.criadoEm)}
                </time>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{ASSUNTOS[m.assunto] ?? m.assunto}</p>
              {/* O texto vem de um visitante: é exibido como texto puro (o React escapa), preservando quebras de linha. */}
              <p className="mt-3 text-sm whitespace-pre-wrap">{m.mensagem}</p>
              <form action={alternarMensagemLida.bind(null, m.id)} className="mt-3">
                <Botao type="submit" variante="claro" tamanho="p">
                  {m.lida ? "Marcar como não lida" : "Marcar como lida"}
                </Botao>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
