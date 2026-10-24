"use client";

import { useActionState, useId } from "react";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem } from "@/components/ui/Campo";
import { alterarSenha, atualizarDados } from "@/server/acoes/conta";

export function DadosForm({ nome, email, telefone }: { nome: string; email: string; telefone: string }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(atualizarDados, undefined);
  return (
    <form action={acao} className="grid max-w-xl gap-5">
      <Campo id={`${uid}-nome`} name="nome" rotulo="Nome completo" autoComplete="name" required defaultValue={estado?.valores?.nome ?? nome} erro={estado?.erros?.nome} />
      <Campo id={`${uid}-email`} rotulo="E-mail" value={email} readOnly disabled dica="O e-mail é o seu acesso e não pode ser alterado por aqui." />
      <Campo
        id={`${uid}-tel`}
        name="telefone"
        rotulo="Telefone (opcional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={estado?.valores?.telefone ?? telefone}
        dica="Com DDD, só números."
        erro={estado?.erros?.telefone}
      />
      {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
      {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
      <div>
        <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar dados"}
        </Botao>
      </div>
    </form>
  );
}

export function SenhaForm() {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(alterarSenha, undefined);
  return (
    <form action={acao} className="grid max-w-xl gap-5">
      <Campo id={`${uid}-atual`} name="atual" rotulo="Senha atual" type="password" autoComplete="current-password" required erro={estado?.erros?.atual} />
      <Campo id={`${uid}-nova`} name="nova" rotulo="Nova senha" type="password" autoComplete="new-password" required minLength={8} dica="Mínimo de 8 caracteres." erro={estado?.erros?.nova} />
      <Campo id={`${uid}-conf`} name="confirmacao" rotulo="Repita a nova senha" type="password" autoComplete="new-password" required erro={estado?.erros?.confirmacao} />
      {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
      {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
      <div>
        <Botao type="submit" variante="secundario" tamanho="m" disabled={pendente}>
          {pendente ? "Alterando…" : "Alterar senha"}
        </Botao>
      </div>
    </form>
  );
}
