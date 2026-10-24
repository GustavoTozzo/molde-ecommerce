"use client";

import { useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Botao } from "@/components/ui/Button";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Formulário de newsletter (somente front-end: valida e mostra confirmação). */
export function NewsletterForm({ className }: { className?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<{ email?: string; aceite?: string }>({});
  const [enviado, setEnviado] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const novos: typeof erros = {};
    if (!EMAIL.test(email.trim())) novos.email = "Digite um e-mail válido, como nome@email.com.br.";
    if (!aceite) novos.aceite = "Marque a caixa para autorizar o envio.";
    setErros(novos);
    if (Object.keys(novos).length === 0) setEnviado(true);
  }

  if (enviado) {
    return (
      <p role="status" className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-forest-dark">
        <CheckCircle2 className="size-6 shrink-0 text-forest" aria-hidden />
        Tudo certo! Em uma loja real, enviaríamos o cupom BEMVINDO10 para {email}. (Demonstração: nada foi enviado.)
      </p>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={`${id}-email`} className="sr-only">
            Seu e-mail
          </label>
          <input
            id={`${id}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com.br"
            autoComplete="email"
            aria-invalid={erros.email ? true : undefined}
            aria-describedby={erros.email ? `${id}-erro-email` : undefined}
            className="w-full rounded-full border-2 border-transparent bg-white px-6 py-3.5 text-base placeholder:text-muted focus:border-forest focus:outline-none"
          />
        </div>
        <Botao type="submit" variante="primario" tamanho="l">
          Quero receber
        </Botao>
      </div>
      {erros.email && (
        <p id={`${id}-erro-email`} role="alert" className="mt-2 text-sm font-semibold text-coral">
          {erros.email}
        </p>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          aria-invalid={erros.aceite ? true : undefined}
          className="mt-0.5 size-5 shrink-0 accent-forest"
        />
        <span>Aceito receber novidades por e-mail e concordo com a política de privacidade. Posso cancelar quando quiser.</span>
      </label>
      {erros.aceite && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-coral">
          {erros.aceite}
        </p>
      )}
    </form>
  );
}
