"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Botao } from "@/components/ui/Button";

const assuntos = [
  { id: "pedido", rotulo: "Dúvida sobre um pedido" },
  { id: "produto", rotulo: "Dúvida sobre um produto" },
  { id: "receita", rotulo: "Envio de receita" },
  { id: "formula-personalizada", rotulo: "Fórmula personalizada (em breve)" },
  { id: "outro", rotulo: "Outro assunto" },
];

type Erros = Partial<Record<"nome" | "email" | "mensagem" | "aceite", string>>;

const entrada = "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base aria-[invalid=true]:border-coral";

export function ContatoForm() {
  const uid = useId();
  const params = useSearchParams();
  const assuntoInicial = params.get("assunto");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState(assuntos.some((a) => a.id === assuntoInicial) ? (assuntoInicial as string) : "pedido");
  const [mensagem, setMensagem] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviado, setEnviado] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const novos: Erros = {};
    if (nome.trim().length < 2) novos.nome = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) novos.email = "Informe um e-mail válido.";
    if (mensagem.trim().length < 10) novos.mensagem = "Escreva ao menos 10 caracteres.";
    if (!aceite) novos.aceite = "Precisamos do seu consentimento para responder.";
    setErros(novos);
    const primeiro = Object.keys(novos)[0];
    if (primeiro) {
      document.getElementById(`${uid}-${primeiro}`)?.focus();
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div role="status" className="rounded-panel bg-mint p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-forest" aria-hidden />
        <h2 className="mt-3 font-display text-2xl font-bold">Mensagem recebida (demonstração)</h2>
        <p className="mt-2 text-muted">Em uma loja real, a equipe responderia para {email} em horário comercial. Nada foi enviado a nenhum servidor.</p>
      </div>
    );
  }

  const erro = (campo: keyof Erros) =>
    erros[campo] ? (
      <p id={`${uid}-${campo}-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
        {erros[campo]}
      </p>
    ) : null;
  const aria = (campo: keyof Erros) => ({ "aria-invalid": erros[campo] ? (true as const) : undefined, "aria-describedby": erros[campo] ? `${uid}-${campo}-erro` : undefined });

  return (
    <form onSubmit={enviar} noValidate className="grid gap-5 rounded-panel border border-line bg-white p-6 md:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-nome`} className="mb-1.5 block text-sm font-bold">
            Nome
          </label>
          <input id={`${uid}-nome`} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className={entrada} {...aria("nome")} />
          {erro("nome")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1.5 block text-sm font-bold">
            E-mail
          </label>
          <input id={`${uid}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={entrada} {...aria("email")} />
          {erro("email")}
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-assunto`} className="mb-1.5 block text-sm font-bold">
          Assunto
        </label>
        <select id={`${uid}-assunto`} value={assunto} onChange={(e) => setAssunto(e.target.value)} className={entrada}>
          {assuntos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.rotulo}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${uid}-mensagem`} className="mb-1.5 block text-sm font-bold">
          Mensagem
        </label>
        <textarea id={`${uid}-mensagem`} rows={5} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={entrada} {...aria("mensagem")} />
        <p className="mt-1 text-xs text-muted">Não envie dados de saúde sensíveis por este formulário. Para receitas, use o carrinho.</p>
        {erro("mensagem")}
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input id={`${uid}-aceite`} type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-forest" {...aria("aceite")} />
          <span>Concordo que a Casa Magistral use meus dados apenas para responder a esta mensagem, conforme a política de privacidade.</span>
        </label>
        {erro("aceite")}
      </div>
      <Botao type="submit" variante="primario" tamanho="l" className="justify-self-start">
        Enviar mensagem
      </Botao>
    </form>
  );
}
