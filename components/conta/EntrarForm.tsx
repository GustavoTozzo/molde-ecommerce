"use client";

import { useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Button";

const entrada = "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base aria-[invalid=true]:border-coral";

/** Tela de acesso de DEMONSTRAÇÃO: valida os campos, mas não autentica ninguém. */
export function EntrarForm() {
  const uid = useId();
  const [aba, setAba] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (aba === "criar" && nome.trim().length < 2) n.nome = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) n.email = "Informe um e-mail válido.";
    if (senha.length < 8) n.senha = "A senha deve ter ao menos 8 caracteres.";
    setErros(n);
    if (Object.keys(n).length === 0) setOk(true);
  }

  if (ok) {
    return (
      <div role="status" className="rounded-panel bg-mint p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-forest" aria-hidden />
        <h2 className="mt-3 font-display text-2xl font-bold">Acesso simulado</h2>
        <p className="mt-2 text-muted">Este molde não possui autenticação. Integre seu provedor de identidade (por exemplo, Auth.js ou o serviço da sua plataforma de e-commerce).</p>
      </div>
    );
  }

  const campo = (id: string, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`${uid}-${id}`} className="mb-1.5 block text-sm font-bold">
        {rotulo}
      </label>
      <input
        id={`${uid}-${id}`}
        className={entrada}
        aria-invalid={erros[id] ? true : undefined}
        aria-describedby={erros[id] ? `${uid}-${id}-erro` : undefined}
        {...props}
      />
      {erros[id] && (
        <p id={`${uid}-${id}-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
          {erros[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="rounded-panel border border-line bg-white p-6 md:p-10">
      <div role="tablist" aria-label="Acesso" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-cream p-1">
        {(["entrar", "criar"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={aba === a}
            onClick={() => {
              setAba(a);
              setErros({});
            }}
            className={cn("rounded-full py-2.5 text-sm font-bold transition", aba === a ? "bg-white shadow-card" : "text-muted hover:text-ink")}
          >
            {a === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>
      <form onSubmit={enviar} noValidate className="grid gap-5">
        {aba === "criar" && campo("nome", "Nome completo", { value: nome, onChange: (e) => setNome(e.target.value), autoComplete: "name" })}
        {campo("email", "E-mail", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email" })}
        {campo("senha", "Senha", { type: "password", value: senha, onChange: (e) => setSenha(e.target.value), autoComplete: aba === "entrar" ? "current-password" : "new-password" })}
        <Botao type="submit" variante="primario" tamanho="l" className="w-full">
          {aba === "entrar" ? "Entrar" : "Criar minha conta"}
        </Botao>
      </form>
    </div>
  );
}
