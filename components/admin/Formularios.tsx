"use client";

import { useActionState, useId, type ReactNode } from "react";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem, classeEntrada } from "@/components/ui/Campo";
import { enviarPedido, recusarReceita } from "@/server/acoes/admin-pedidos";

/** Formulário de envio: código de rastreio obrigatório. */
export function EnviarForm({ pedidoId }: { pedidoId: string }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(enviarPedido.bind(null, pedidoId), undefined);
  return (
    <form action={acao} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <Campo id={`${uid}-rastreio`} name="rastreio" rotulo="Código de rastreio" required placeholder="Ex.: BR123456789BR" autoComplete="off" defaultValue={estado?.valores?.rastreio} erro={estado?.erros?.rastreio} />
      <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
        {pendente ? "Enviando…" : "Marcar como enviado"}
      </Botao>
      {estado?.erro && (
        <div className="sm:col-span-2">
          <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>
        </div>
      )}
    </form>
  );
}

/** Recusa de receita com motivo (o cliente lê o motivo na página do pedido). */
export function RecusarForm({ receitaId, children }: { receitaId: string; children?: ReactNode }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(recusarReceita.bind(null, receitaId), undefined);
  if (estado?.ok) return <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>;
  return (
    <form action={acao} className="grid gap-2">
      <label htmlFor={`${uid}-motivo`} className="text-sm font-bold">
        Motivo da recusa
      </label>
      <textarea
        id={`${uid}-motivo`}
        name="motivo"
        required
        rows={2}
        maxLength={300}
        defaultValue={estado?.valores?.motivo}
        aria-invalid={estado?.erros?.motivo ? true : undefined}
        aria-describedby={estado?.erros?.motivo ? `${uid}-motivo-erro` : undefined}
        placeholder="Ex.: imagem ilegível, receita vencida, falta assinatura do prescritor"
        className={classeEntrada}
      />
      {estado?.erros?.motivo && (
        <p id={`${uid}-motivo-erro`} role="alert" className="text-sm font-semibold text-coral">
          {estado.erros.motivo}
        </p>
      )}
      {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" variante="claro" tamanho="p" disabled={pendente}>
          {pendente ? "Recusando…" : "Recusar receita"}
        </Botao>
        {children}
      </div>
    </form>
  );
}
