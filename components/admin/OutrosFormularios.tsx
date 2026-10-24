"use client";

import { useActionState, useId, useState } from "react";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem, classeEntrada } from "@/components/ui/Campo";
import { criarCupom } from "@/server/acoes/admin-catalogo";
import { alterarPapel, criarPessoaDaEquipe } from "@/server/acoes/admin-usuarios";

export function CupomNovoForm() {
  const uid = useId();
  const [tipo, setTipo] = useState("PERCENTUAL");
  const [estado, acao, pendente] = useActionState(criarCupom, undefined);
  const v = estado?.valores ?? {};
  const erros = estado?.erros ?? {};
  return (
    <form action={acao} className="grid gap-5 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
      <Campo id={`${uid}-cod`} name="codigo" rotulo="Código" required defaultValue={v.codigo} erro={erros.codigo} placeholder="PRIMEIRA15" autoCapitalize="characters" />
      <div>
        <label htmlFor={`${uid}-tipo`} className="mb-1.5 block text-sm font-bold">
          Tipo
        </label>
        <select id={`${uid}-tipo`} name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={classeEntrada}>
          <option value="PERCENTUAL">Desconto percentual</option>
          <option value="FRETE_GRATIS">Frete grátis</option>
        </select>
      </div>
      {tipo === "PERCENTUAL" && <Campo id={`${uid}-pct`} name="percentual" rotulo="Percentual (1 a 90)" inputMode="numeric" required defaultValue={v.percentual} erro={erros.percentual} />}
      <Campo id={`${uid}-val`} name="validoAte" rotulo="Válido até (opcional)" type="date" defaultValue={v.validoAte} erro={erros.validoAte} />
      <Campo id={`${uid}-max`} name="usosMax" rotulo="Limite de usos (opcional)" inputMode="numeric" defaultValue={v.usosMax} erro={erros.usosMax} />
      <div className="grid gap-3 sm:col-span-2">
        {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
        {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
        <div>
          <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
            {pendente ? "Criando…" : "Criar cupom"}
          </Botao>
        </div>
      </div>
    </form>
  );
}

export function EquipeNovaForm() {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(criarPessoaDaEquipe, undefined);
  const v = estado?.valores ?? {};
  const erros = estado?.erros ?? {};
  return (
    <form action={acao} className="grid gap-5 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
      <Campo id={`${uid}-nome`} name="nome" rotulo="Nome" required defaultValue={v.nome} erro={erros.nome} />
      <Campo id={`${uid}-email`} name="email" rotulo="E-mail" type="email" required defaultValue={v.email} erro={erros.email} autoComplete="off" />
      <div>
        <label htmlFor={`${uid}-papel`} className="mb-1.5 block text-sm font-bold">
          Papel
        </label>
        <select key={v.papel ?? "x"} id={`${uid}-papel`} name="papel" required defaultValue={v.papel ?? "FARMACEUTICO"} className={classeEntrada}>
          <option value="FARMACEUTICO">Farmacêutico (pedidos, receitas, mensagens)</option>
          <option value="ADMINISTRADOR">Administrador (tudo)</option>
        </select>
        {erros.papel && <p role="alert" className="mt-1 text-sm font-semibold text-coral">{erros.papel}</p>}
      </div>
      <Campo id={`${uid}-senha`} name="senha" rotulo="Senha inicial" type="password" required minLength={8} autoComplete="new-password" dica="Mínimo de 8 caracteres. A pessoa troca em Minha conta." erro={erros.senha} />
      <div className="grid gap-3 sm:col-span-2">
        {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
        <div>
          <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
            {pendente ? "Criando…" : "Adicionar à equipe"}
          </Botao>
        </div>
      </div>
    </form>
  );
}

/** Troca de papel com envio imediato ao escolher. */
export function SeletorPapel({ usuarioId, papel, desabilitado, nome }: { usuarioId: string; papel: string; desabilitado: boolean; nome: string }) {
  return (
    <select
      aria-label={`Papel de ${nome}`}
      defaultValue={papel}
      disabled={desabilitado}
      onChange={async (e) => {
        await alterarPapel(usuarioId, e.target.value);
      }}
      className="rounded-full border border-line bg-white px-3 py-1.5 text-sm disabled:bg-cream"
    >
      <option value="CLIENTE">Cliente</option>
      <option value="FARMACEUTICO">Farmacêutico</option>
      <option value="ADMINISTRADOR">Administrador</option>
    </select>
  );
}
