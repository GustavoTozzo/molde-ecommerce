import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, Circle, CircleDot, FileText, XCircle } from "lucide-react";
import { BotaoCopiar, FormConfirmar, LimparCarrinhoAoConfirmar } from "@/components/conta/PedidoAcoes";
import { Botao } from "@/components/ui/Button";
import { formatBRL, formatarData } from "@/lib/format";
import { etapasDoPedido, podeCancelarPeloCliente, rotuloFormaPagamento, rotuloStatusPagamento, rotuloStatusPedido, rotuloStatusReceita } from "@/lib/pedidos";
import { cn } from "@/lib/utils";
import { cancelarMeuPedido, simularPagamento } from "@/server/acoes/pedido";
import type { EnderecoEntrega } from "@/server/pedidos";
import { prisma } from "@/server/prisma";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Pedido" };

export default async function PaginaPedido(props: PageProps<"/conta/pedidos/[id]">) {
  const { id } = await props.params;
  const { novo } = await props.searchParams;
  const usuario = await exigirUsuario(`/conta/pedidos/${id}`);

  // `usuarioId` no where: quem pedir o id de outra pessoa recebe 404, igual a um id que não existe.
  const p = await prisma.pedido.findFirst({
    where: { id, usuarioId: usuario.id },
    include: { itens: true, receita: { select: { id: true, status: true, observacao: true, nomeArquivo: true } } },
  });
  if (!p) notFound();

  const endereco = p.enderecoEntrega as unknown as EnderecoEntrega;
  const cancelado = p.status === "CANCELADO";
  const etapas = etapasDoPedido({ status: p.status, temReceita: p.receita !== null, receitaStatus: p.receita?.status ?? null });
  const pendente = p.statusPagamento === "PENDENTE" && !cancelado;
  const qr = pendente && p.formaPagamento === "PIX" && p.codigoPagamento ? await QRCode.toDataURL(p.codigoPagamento, { margin: 1, width: 220 }) : null;
  const unidades = p.itens.reduce((acc, i) => acc + i.qtd, 0);

  return (
    <div className="grid gap-8">
      {novo && <LimparCarrinhoAoConfirmar />}
      <div>
        <Link href="/conta/pedidos" className="text-sm font-semibold text-forest hover:underline">
          ← Meus pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold text-forest-dark">Pedido nº {p.numero}</h2>
          <span className={cn("rounded-full px-3 py-1 text-sm font-bold", cancelado ? "bg-coral-soft text-ink" : "bg-mint text-forest-dark")}>{rotuloStatusPedido[p.status]}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Feito em {formatarData(p.criadoEm)} · {unidades} {unidades === 1 ? "item" : "itens"} · {formatBRL(p.total)}
        </p>
      </div>

      {novo && (
        <div role="status" className="flex items-start gap-3 rounded-card bg-mint p-5">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-forest" aria-hidden />
          <div>
            <p className="font-bold text-forest-dark">Pedido recebido!</p>
            <p className="text-sm">
              {p.status === "AGUARDANDO_PAGAMENTO"
                ? "Assim que o pagamento for confirmado, começamos o preparo."
                : p.status === "AGUARDANDO_RECEITA"
                  ? "Pagamento confirmado. O farmacêutico vai conferir a receita antes de preparar a fórmula."
                  : "Pagamento confirmado. Sua fórmula entra em preparo."}
            </p>
          </div>
        </div>
      )}

      {cancelado ? (
        <div role="status" className="flex items-start gap-3 rounded-card bg-coral-soft p-5">
          <XCircle className="mt-0.5 size-6 shrink-0 text-coral" aria-hidden />
          <div>
            <p className="font-bold">Pedido cancelado</p>
            <p className="text-sm">{p.statusPagamento === "ESTORNADO" ? "O pagamento foi estornado." : "Nenhuma cobrança foi mantida."} O estoque dos itens foi liberado.</p>
          </div>
        </div>
      ) : (
        <ol aria-label="Acompanhamento do pedido" className="grid gap-3 rounded-card border border-line bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          {etapas.map((e) => (
            <li key={e.rotulo} className={cn("flex items-center gap-3 text-sm", e.estado === "pendente" && "text-muted")} aria-current={e.estado === "atual" ? "step" : undefined}>
              {e.estado === "feito" ? <CheckCircle2 className="size-5 shrink-0 text-forest" aria-hidden /> : e.estado === "atual" ? <CircleDot className="size-5 shrink-0 text-amber-dark" aria-hidden /> : <Circle className="size-5 shrink-0" aria-hidden />}
              <span className={cn(e.estado === "atual" && "font-bold")}>
                {e.rotulo}
                <span className="sr-only">{e.estado === "feito" ? " (concluído)" : e.estado === "atual" ? " (em andamento)" : " (pendente)"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <section aria-labelledby="pag-titulo" className="rounded-card border border-line bg-white p-5">
        <h3 id="pag-titulo" className="font-display text-xl font-bold">
          Pagamento
        </h3>
        <p className="mt-1 text-sm">
          {rotuloFormaPagamento[p.formaPagamento]}
          {p.formaPagamento === "CARTAO" && p.cartaoFinal4 ? ` final ${p.cartaoFinal4}${p.parcelas > 1 ? ` em ${p.parcelas}x de ${formatBRL(Math.round(p.total / p.parcelas))} sem juros` : " à vista"}` : ""} · {rotuloStatusPagamento[p.statusPagamento]}
        </p>
        {pendente && p.codigoPagamento && (
          <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL gerada no servidor, sem otimização possível
              <img src={qr} alt="QR Code do Pix (fictício, apenas demonstração)" width={220} height={220} className="rounded-2xl border border-line" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{p.formaPagamento === "PIX" ? "Pix copia e cola (fictício)" : "Linha digitável do boleto (fictícia)"}</p>
              <p className="mt-1 rounded-2xl bg-cream p-3 font-mono text-xs break-all">{p.codigoPagamento}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <BotaoCopiar texto={p.codigoPagamento} />
                <form action={simularPagamento.bind(null, p.id)}>
                  <Botao type="submit" variante="primario" tamanho="p">
                    Simular pagamento (demonstração)
                  </Botao>
                </form>
              </div>
              <p className="mt-2 text-xs text-muted">Este código não cobra nada. O botão acima faz o papel da confirmação que, numa loja real, viria do banco ou do gateway.</p>
            </div>
          </div>
        )}
      </section>

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
          {p.receita.observacao && <p className="mt-2 text-sm text-muted">Observação do farmacêutico: {p.receita.observacao}</p>}
        </section>
      )}

      <section aria-labelledby="it-titulo">
        <h3 id="it-titulo" className="mb-3 font-display text-xl font-bold">
          Itens
        </h3>
        <ul className="divide-y divide-line rounded-card border border-line bg-white">
          {p.itens.map((i) => (
            <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-2 p-4">
              <div>
                <p className="font-semibold">{i.nome}</p>
                <p className="text-sm text-muted">
                  {i.tamanhoRotulo}
                  {i.sabor ? ` · ${i.sabor}` : ""} · {i.qtd} un.
                  {i.frequencia !== "UNICA" ? ` · assinatura ${i.frequencia === "MENSAL" ? "mensal" : i.frequencia === "BIMESTRAL" ? "a cada 2 meses" : "a cada 3 meses"}` : ""}
                </p>
              </div>
              <p className="font-semibold">{formatBRL(i.precoUnitario * i.qtd)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatBRL(p.subtotal)}</dd>
          </div>
          {p.descontoCupom > 0 && (
            <div className="flex justify-between text-forest-dark">
              <dt>Cupom {p.cupomCodigo}</dt>
              <dd className="font-semibold">−{formatBRL(p.descontoCupom)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Frete</dt>
            <dd className="font-semibold">{p.frete === 0 ? "Grátis" : formatBRL(p.frete)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-2xl font-bold">{formatBRL(p.total)}</dd>
          </div>
        </dl>
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
        {p.codigoRastreio && <p className="mt-2 text-sm">Código de rastreio: <strong>{p.codigoRastreio}</strong></p>}
      </section>

      {podeCancelarPeloCliente(p.status) && (
        <FormConfirmar acao={cancelarMeuPedido.bind(null, p.id)} mensagem="Cancelar este pedido? O estoque é liberado e, se já houver pagamento, ele é estornado.">
          <Botao type="submit" variante="claro" tamanho="m">
            Cancelar pedido
          </Botao>
        </FormConfirmar>
      )}
    </div>
  );
}
