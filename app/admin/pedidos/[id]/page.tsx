import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { EnviarForm } from "@/components/admin/Formularios";
import { FormConfirmar } from "@/components/conta/PedidoAcoes";
import { Botao } from "@/components/ui/Button";
import { formatBRL, formatarDataHora } from "@/lib/format";
import { rotuloFormaPagamento, rotuloStatusPagamento, rotuloStatusPedido, rotuloStatusReceita } from "@/lib/pedidos";
import { cancelarPedidoPelaEquipe, confirmarPagamentoPelaEquipe, entregarPedido } from "@/server/acoes/admin-pedidos";
import { CANCELAVEIS_PELA_EQUIPE, type EnderecoEntrega } from "@/server/pedidos";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Pedido" };

export default async function PaginaPedidoAdmin(props: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await props.params;
  await exigirEquipe(`/admin/pedidos/${id}`);
  const p = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: true,
      usuario: { select: { nome: true, email: true, telefone: true } },
      receita: { select: { id: true, status: true, observacao: true, nomeArquivo: true, revisadaEm: true, revisadaPor: { select: { nome: true } } } },
      eventos: { orderBy: { criadoEm: "asc" }, include: { autor: { select: { nome: true } } } },
    },
  });
  if (!p) notFound();
  const endereco = p.enderecoEntrega as unknown as EnderecoEntrega;

  return (
    <div className="grid gap-8">
      <div>
        <Link href="/admin/pedidos" className="text-sm font-semibold text-forest hover:underline">
          ← Pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold text-forest-dark">Pedido nº {p.numero}</h2>
          <span className="rounded-full bg-mint px-3 py-1 text-sm font-bold text-forest-dark">{rotuloStatusPedido[p.status]}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatarDataHora(p.criadoEm)} · {p.usuario.nome} ({p.usuario.email}
          {p.usuario.telefone ? ` · ${p.usuario.telefone}` : ""})
        </p>
      </div>

      <section aria-labelledby="acoes-titulo" className="grid gap-4 rounded-card border border-line bg-white p-5">
        <h3 id="acoes-titulo" className="font-display text-xl font-bold">
          Ações
        </h3>
        {p.status === "AGUARDANDO_PAGAMENTO" && (
          <form action={confirmarPagamentoPelaEquipe.bind(null, p.id)}>
            <Botao type="submit" variante="primario" tamanho="m">
              Marcar pagamento como recebido
            </Botao>
            <p className="mt-2 text-xs text-muted">Use depois de conferir o Pix ou o boleto no extrato.</p>
          </form>
        )}
        {p.status === "AGUARDANDO_RECEITA" && (
          <p className="text-sm">
            {p.receita?.status === "PENDENTE" ? (
              <>
                A receita aguarda conferência: <Link href="/admin/receitas" className="font-bold text-forest underline">abrir a fila de receitas</Link>.
              </>
            ) : (
              "A receita foi recusada. O pedido segue parado até o cliente enviar outro arquivo."
            )}
          </p>
        )}
        {p.status === "EM_PREPARO" && <EnviarForm pedidoId={p.id} />}
        {p.status === "ENVIADO" && (
          <form action={entregarPedido.bind(null, p.id)}>
            <Botao type="submit" variante="primario" tamanho="m">
              Marcar como entregue
            </Botao>
          </form>
        )}
        {(p.status === "ENTREGUE" || p.status === "CANCELADO") && <p className="text-sm text-muted">Pedido encerrado: não há ações pendentes.</p>}
        {CANCELAVEIS_PELA_EQUIPE.includes(p.status) && (
          <FormConfirmar acao={cancelarPedidoPelaEquipe.bind(null, p.id)} mensagem="Cancelar este pedido? O estoque volta e o pagamento confirmado é estornado.">
            <Botao type="submit" variante="claro" tamanho="p">
              Cancelar pedido
            </Botao>
          </FormConfirmar>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pag-titulo" className="rounded-card border border-line bg-white p-5">
          <h3 id="pag-titulo" className="font-display text-xl font-bold">
            Pagamento
          </h3>
          <p className="mt-1 text-sm">
            {rotuloFormaPagamento[p.formaPagamento]}
            {p.formaPagamento === "CARTAO" && p.cartaoFinal4 ? ` final ${p.cartaoFinal4} (${p.parcelas}x)` : ""} · {rotuloStatusPagamento[p.statusPagamento]}
          </p>
          {p.codigoPagamento && <p className="mt-2 rounded-2xl bg-cream p-2.5 font-mono text-xs break-all">{p.codigoPagamento}</p>}
        </section>
        <section aria-labelledby="ent-titulo" className="rounded-card border border-line bg-white p-5">
          <h3 id="ent-titulo" className="font-display text-xl font-bold">
            Entrega
          </h3>
          <p className="mt-1 text-sm">
            {endereco.logradouro}, {endereco.numero}
            {endereco.complemento ? ` · ${endereco.complemento}` : ""}
          </p>
          <p className="text-sm text-muted">
            {endereco.bairro} · {endereco.cidade}/{endereco.uf} · CEP {endereco.cep}
          </p>
          {p.codigoRastreio && (
            <p className="mt-2 text-sm">
              Rastreio: <strong>{p.codigoRastreio}</strong>
            </p>
          )}
        </section>
      </div>

      {p.receita && (
        <section aria-labelledby="rec-titulo" className="rounded-card border border-line bg-white p-5">
          <h3 id="rec-titulo" className="font-display text-xl font-bold">
            Receita
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <FileText className="size-4 text-forest" aria-hidden />
            <a href={`/api/receitas/${p.receita.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest underline">
              {p.receita.nomeArquivo}
            </a>
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-forest-dark">{rotuloStatusReceita[p.receita.status]}</span>
          </p>
          {p.receita.revisadaPor && (
            <p className="mt-1 text-xs text-muted">
              Conferida por {p.receita.revisadaPor.nome}
              {p.receita.revisadaEm ? ` em ${formatarDataHora(p.receita.revisadaEm)}` : ""}.
              {p.receita.observacao ? ` Observação: ${p.receita.observacao}` : ""}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="it-titulo">
        <h3 id="it-titulo" className="mb-3 font-display text-xl font-bold">
          Itens
        </h3>
        <ul className="divide-y divide-line rounded-card border border-line bg-white">
          {p.itens.map((i) => (
            <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4 text-sm">
              <span>
                <strong>{i.nome}</strong>
                <span className="block text-muted">
                  {i.tamanhoRotulo}
                  {i.sabor ? ` · ${i.sabor}` : ""} · {i.qtd} un.
                </span>
              </span>
              <span className="font-semibold">{formatBRL(i.precoUnitario * i.qtd)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatBRL(p.subtotal)}</dd></div>
          {p.descontoCupom > 0 && <div className="flex justify-between"><dt>Cupom {p.cupomCodigo}</dt><dd>−{formatBRL(p.descontoCupom)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Frete</dt><dd>{p.frete === 0 ? "Grátis" : formatBRL(p.frete)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd>{formatBRL(p.total)}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="hist-titulo">
        <h3 id="hist-titulo" className="mb-3 font-display text-xl font-bold">
          Histórico
        </h3>
        <ol className="grid gap-2 text-sm">
          {p.eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3 rounded-2xl bg-cream px-4 py-2.5">
              <time className="font-mono text-xs text-muted" dateTime={e.criadoEm.toISOString()}>
                {formatarDataHora(e.criadoEm)}
              </time>
              <span>{e.descricao}</span>
              {e.autor && <span className="text-muted">· {e.autor.nome}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
