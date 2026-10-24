"use client";

import { useActionState, useId } from "react";
import { Botao } from "@/components/ui/Button";
import { FaixaMensagem } from "@/components/ui/Campo";
import { reenviarMinhaReceita } from "@/server/acoes/pedido";

const MAXIMO = 3 * 1024 * 1024;

/** Aparece quando o farmacêutico recusou a receita: o cliente envia outro arquivo sem refazer o pedido. */
export function ReenviarReceita({ pedidoId }: { pedidoId: string }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(reenviarMinhaReceita.bind(null, pedidoId), undefined);
  if (estado?.ok) return <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>;
  return (
    <form action={acao} className="mt-4 grid gap-3 rounded-2xl bg-cream p-4">
      <label htmlFor={`${uid}-arq`} className="text-sm font-bold">
        Enviar outra receita (PDF, PNG ou JPG, até 3 MB)
      </label>
      <input
        id={`${uid}-arq`}
        name="receita"
        type="file"
        required
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={(e) => {
          const arq = e.currentTarget.files?.[0];
          if (arq && arq.size > MAXIMO) {
            alert("O arquivo passa de 3 MB. Envie uma foto ou PDF menor.");
            e.currentTarget.value = "";
          }
        }}
        className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-mint file:px-5 file:py-2.5 file:font-bold file:text-forest-dark hover:file:bg-mint-deep"
      />
      {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
      <div>
        <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
          {pendente ? "Enviando…" : "Enviar nova receita"}
        </Botao>
      </div>
    </form>
  );
}
