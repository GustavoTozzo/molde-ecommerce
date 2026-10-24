"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem } from "@/components/ui/Campo";
import { autenticar, cadastrar } from "@/server/acoes/conta";

/** Acesso real: entrar ou criar conta. O destino pós-login vem de `?callbackUrl=` (validado no servidor). */
export function EntrarForm() {
  const uid = useId();
  const destino = useSearchParams().get("callbackUrl") ?? "/conta";
  const [aba, setAba] = useState<"entrar" | "criar">("entrar");
  const [estadoEntrar, entrar, entrando] = useActionState(autenticar, undefined);
  const [estadoCriar, criar, criando] = useActionState(cadastrar, undefined);

  return (
    <div className="rounded-panel border border-line bg-white p-6 md:p-10">
      <div role="tablist" aria-label="Acesso" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream p-1">
        {(["entrar", "criar"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            id={`${uid}-aba-${a}`}
            aria-selected={aba === a}
            aria-controls={`${uid}-painel`}
            onClick={() => setAba(a)}
            className={cn("rounded-full py-2.5 text-sm font-bold transition", aba === a ? "bg-white shadow-card" : "text-muted hover:text-ink")}
          >
            {a === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <div id={`${uid}-painel`} role="tabpanel" aria-labelledby={`${uid}-aba-${aba}`}>
        {aba === "entrar" ? (
          <form action={entrar} className="grid gap-5">
            <input type="hidden" name="redirectTo" value={destino} />
            <Campo id={`${uid}-e-email`} name="email" rotulo="E-mail" type="email" autoComplete="email" required defaultValue={estadoEntrar?.valores?.email} erro={estadoEntrar?.erros?.email} />
            <Campo id={`${uid}-e-senha`} name="senha" rotulo="Senha" type="password" autoComplete="current-password" required erro={estadoEntrar?.erros?.senha} />
            {estadoEntrar?.erro && <FaixaMensagem tipo="erro">{estadoEntrar.erro}</FaixaMensagem>}
            <Botao type="submit" variante="primario" tamanho="l" className="w-full" disabled={entrando}>
              {entrando ? "Entrando…" : "Entrar"}
            </Botao>
          </form>
        ) : (
          <form action={criar} className="grid gap-5">
            <input type="hidden" name="redirectTo" value={destino} />
            <Campo id={`${uid}-c-nome`} name="nome" rotulo="Nome completo" autoComplete="name" required defaultValue={estadoCriar?.valores?.nome} erro={estadoCriar?.erros?.nome} />
            <Campo id={`${uid}-c-email`} name="email" rotulo="E-mail" type="email" autoComplete="email" required defaultValue={estadoCriar?.valores?.email} erro={estadoCriar?.erros?.email} />
            <Campo id={`${uid}-c-senha`} name="senha" rotulo="Senha" type="password" autoComplete="new-password" required minLength={8} dica="Mínimo de 8 caracteres." erro={estadoCriar?.erros?.senha} />
            <Campo id={`${uid}-c-conf`} name="confirmacao" rotulo="Repita a senha" type="password" autoComplete="new-password" required erro={estadoCriar?.erros?.confirmacao} />
            <div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="aceite" required className="mt-1 size-4 accent-forest" aria-invalid={estadoCriar?.erros?.aceite ? true : undefined} />
                <span>
                  Li e aceito os{" "}
                  <Link href="/institucional/termos" className="font-semibold text-forest underline" target="_blank">
                    termos de uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/institucional/privacidade" className="font-semibold text-forest underline" target="_blank">
                    política de privacidade
                  </Link>
                  .
                </span>
              </label>
              {estadoCriar?.erros?.aceite && (
                <p role="alert" className="mt-1 text-sm font-semibold text-coral">
                  {estadoCriar.erros.aceite}
                </p>
              )}
            </div>
            {estadoCriar?.erro && <FaixaMensagem tipo="erro">{estadoCriar.erro}</FaixaMensagem>}
            <Botao type="submit" variante="primario" tamanho="l" className="w-full" disabled={criando}>
              {criando ? "Criando conta…" : "Criar minha conta"}
            </Botao>
          </form>
        )}
      </div>
    </div>
  );
}
