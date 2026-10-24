"use client";

import { useActionState, useId } from "react";
import { MapPin, Star, Trash2 } from "lucide-react";
import { mascararCep } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem, classeEntrada } from "@/components/ui/Campo";
import { removerEndereco, salvarEndereco, tornarEnderecoPrincipal } from "@/server/acoes/conta";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export interface EnderecoVisao {
  id: string;
  apelido: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

export function EnderecoCartao({ endereco: e }: { endereco: EnderecoVisao }) {
  return (
    <li className={cn("rounded-card border p-5", e.principal ? "border-forest bg-mint/50" : "border-line bg-white")}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-bold">
          <MapPin className="size-4 text-forest" aria-hidden />
          {e.apelido || "Endereço"}
          {e.principal && <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-bold text-white">Principal</span>}
        </p>
      </div>
      <p className="mt-2 text-sm">
        {e.logradouro}, {e.numero}
        {e.complemento ? ` · ${e.complemento}` : ""}
      </p>
      <p className="text-sm text-muted">
        {e.bairro} · {e.cidade}/{e.uf} · CEP {e.cep}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!e.principal && (
          <form action={tornarEnderecoPrincipal.bind(null, e.id)}>
            <Botao type="submit" variante="claro" tamanho="p">
              <Star className="size-4" aria-hidden /> Tornar principal
            </Botao>
          </form>
        )}
        <form action={removerEndereco.bind(null, e.id)}>
          <Botao type="submit" variante="fantasma" tamanho="p" aria-label={`Remover endereço ${e.apelido || e.logradouro}`}>
            <Trash2 className="size-4" aria-hidden /> Remover
          </Botao>
        </form>
      </div>
    </li>
  );
}

export function EnderecoForm() {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(salvarEndereco, undefined);
  const v = estado?.valores ?? {};
  const erros = estado?.erros ?? {};
  return (
    <form action={acao} className="grid gap-5 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Campo id={`${uid}-apelido`} name="apelido" rotulo="Apelido (opcional)" placeholder="Casa, trabalho…" defaultValue={v.apelido} erro={erros.apelido} />
      </div>
      <div className="sm:col-span-3">
        <Campo
          id={`${uid}-cep`}
          name="cep"
          rotulo="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          required
          maxLength={9}
          defaultValue={v.cep}
          onChange={(e) => (e.currentTarget.value = mascararCep(e.currentTarget.value))}
          erro={erros.cep}
        />
      </div>
      <div className="sm:col-span-4">
        <Campo id={`${uid}-rua`} name="logradouro" rotulo="Rua" autoComplete="address-line1" required defaultValue={v.logradouro} erro={erros.logradouro} />
      </div>
      <div className="sm:col-span-2">
        <Campo id={`${uid}-num`} name="numero" rotulo="Número" required defaultValue={v.numero} erro={erros.numero} />
      </div>
      <div className="sm:col-span-3">
        <Campo id={`${uid}-comp`} name="complemento" rotulo="Complemento (opcional)" autoComplete="address-line2" defaultValue={v.complemento} erro={erros.complemento} />
      </div>
      <div className="sm:col-span-3">
        <Campo id={`${uid}-bairro`} name="bairro" rotulo="Bairro" required defaultValue={v.bairro} erro={erros.bairro} />
      </div>
      <div className="sm:col-span-4">
        <Campo id={`${uid}-cidade`} name="cidade" rotulo="Cidade" autoComplete="address-level2" required defaultValue={v.cidade} erro={erros.cidade} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${uid}-uf`} className="mb-1.5 block text-sm font-bold">
          Estado
        </label>
        {/* `key`: o React limpa o formulário depois de cada ação; sem remontar, o <select> volta ao vazio e perde o estado escolhido. */}
        <select key={v.uf ?? "sem-uf"} id={`${uid}-uf`} name="uf" required defaultValue={v.uf ?? ""} aria-invalid={erros.uf ? true : undefined} aria-describedby={erros.uf ? `${uid}-uf-erro` : undefined} className={classeEntrada}>
          <option value="" disabled>
            UF
          </option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        {erros.uf && (
          <p id={`${uid}-uf-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
            {erros.uf}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:col-span-6">
        {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
        {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
        <div>
          <Botao type="submit" variante="primario" tamanho="m" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar endereço"}
          </Botao>
        </div>
      </div>
    </form>
  );
}
