"use client";

import { useEffect } from "react";
import { definirSessao, favoritosAtuais } from "@/lib/store";
import { mesclarFavoritos } from "@/server/acoes/conta";

/**
 * Liga o estado do navegador à sessão do servidor:
 * - logado: junta os favoritos deste navegador aos da conta e passa a usar a lista da conta;
 * - deslogado: se os favoritos eram de uma conta, apaga-os daqui (navegador pode ser compartilhado).
 */
export function SincronizarConta({ logado }: { logado: boolean }) {
  useEffect(() => {
    if (!logado) {
      definirSessao(false);
      return;
    }
    let cancelado = false;
    mesclarFavoritos(favoritosAtuais())
      .then((lista) => !cancelado && definirSessao(true, lista ?? undefined))
      .catch(() => !cancelado && definirSessao(true));
    return () => {
      cancelado = true;
    };
  }, [logado]);
  return null;
}
