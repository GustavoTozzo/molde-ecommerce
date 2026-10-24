import Link from "next/link";
import { AlertTriangle, FileCheck2, MessageSquare, Package, Truck, Wallet } from "lucide-react";
import { exigirEquipe } from "@/server/sessao";
import { prisma } from "@/server/prisma";

const ESTOQUE_BAIXO = 10;

export default async function PaginaAdmin() {
  const equipe = await exigirEquipe("/admin");
  const ehAdmin = equipe.papel === "ADMINISTRADOR";
  const [aguardandoPagamento, aguardandoReceita, receitasPendentes, emPreparo, enviados, mensagens, estoqueBaixo] = await Promise.all([
    prisma.pedido.count({ where: { status: "AGUARDANDO_PAGAMENTO" } }),
    prisma.pedido.count({ where: { status: "AGUARDANDO_RECEITA" } }),
    prisma.receita.count({ where: { status: "PENDENTE" } }),
    prisma.pedido.count({ where: { status: "EM_PREPARO" } }),
    prisma.pedido.count({ where: { status: "ENVIADO" } }),
    prisma.mensagemContato.count({ where: { lida: false } }),
    prisma.tamanho.findMany({
      where: { estoque: { lte: ESTOQUE_BAIXO }, produto: { ativo: true } },
      orderBy: { estoque: "asc" },
      take: 8,
      select: { id: true, rotulo: true, estoque: true, produto: { select: { nome: true } } },
    }),
  ]);

  const cartoes = [
    { href: "/admin/receitas", icone: FileCheck2, titulo: "Receitas para conferir", valor: receitasPendentes, destaque: receitasPendentes > 0 },
    { href: "/admin/pedidos?status=EM_PREPARO", icone: Package, titulo: "Em preparo", valor: emPreparo, destaque: emPreparo > 0 },
    { href: "/admin/pedidos?status=AGUARDANDO_PAGAMENTO", icone: Wallet, titulo: "Aguardando pagamento", valor: aguardandoPagamento, destaque: false },
    { href: "/admin/pedidos?status=AGUARDANDO_RECEITA", icone: FileCheck2, titulo: "Pagos, aguardando receita", valor: aguardandoReceita, destaque: false },
    { href: "/admin/pedidos?status=ENVIADO", icone: Truck, titulo: "Enviados", valor: enviados, destaque: false },
    { href: "/admin/mensagens", icone: MessageSquare, titulo: "Mensagens não lidas", valor: mensagens, destaque: mensagens > 0 },
  ];

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-forest-dark">Visão geral</h2>
      <p className="mt-1 text-muted">Olá, {equipe.nome.split(/\s+/)[0]}. Aqui está o que precisa de atenção agora.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cartoes.map(({ href, icone: Icone, titulo, valor, destaque }) => (
          <li key={titulo}>
            <Link href={href} className={`flex h-full items-center gap-4 rounded-card border p-5 transition hover:border-forest hover:bg-mint/40 ${destaque ? "border-amber bg-amber-soft/50" : "border-line bg-white"}`}>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-card">
                <Icone className="size-6" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-3xl font-bold">{valor}</span>
                <span className="text-sm text-muted">{titulo}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="estoque-titulo" className="mt-10">
        <h3 id="estoque-titulo" className="flex items-center gap-2 font-display text-xl font-bold">
          <AlertTriangle className="size-5 text-amber-dark" aria-hidden /> Estoque baixo (até {ESTOQUE_BAIXO} unidades)
        </h3>
        {estoqueBaixo.length === 0 ? (
          <p className="mt-3 rounded-card bg-cream p-5 text-muted">Nenhum item com estoque baixo.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-white">
            {estoqueBaixo.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span>
                  <strong>{t.produto.nome}</strong> <span className="text-muted">· {t.rotulo}</span>
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${t.estoque === 0 ? "bg-coral-soft" : "bg-amber-soft"}`}>{t.estoque === 0 ? "Esgotado" : `${t.estoque} un.`}</span>
              </li>
            ))}
          </ul>
        )}
        {ehAdmin && (
          <Link href="/admin/produtos" className="mt-3 inline-block text-sm font-bold text-forest underline">
            Ajustar estoque
          </Link>
        )}
      </section>
    </div>
  );
}
