"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { limparCarrinho } from "@/lib/store";
import { Botao } from "@/components/ui/Button";

/** Depois de um pedido novo, esvazia o carrinho do navegador (a ação do servidor redireciona e não pode fazê-lo). */
export function LimparCarrinhoAoConfirmar() {
  useEffect(() => {
    limparCarrinho();
  }, []);
  return null;
}

/** Botão "Copiar" para o código de Pix/boleto fictício. */
export function BotaoCopiar({ texto, rotulo = "Copiar código" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Botao
      type="button"
      variante="claro"
      tamanho="p"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1800);
        } catch {
          /* sem permissão de área de transferência: a pessoa ainda pode selecionar o texto */
        }
      }}
    >
      {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
    </Botao>
  );
}

/** Formulário que só envia depois de a pessoa confirmar (para ações que não se desfazem, como cancelar). */
export function FormConfirmar({ acao, mensagem, children }: { acao: () => Promise<void>; mensagem: string; children: ReactNode }) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
