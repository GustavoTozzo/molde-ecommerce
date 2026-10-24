"use client";

import { useActionState, useId } from "react";
import { formas, objetivos } from "@/data/taxonomia";
import { Botao } from "@/components/ui/Button";
import { Campo, FaixaMensagem, classeEntrada } from "@/components/ui/Campo";
import { ajustarEstoque, salvarProduto } from "@/server/acoes/admin-catalogo";

const SELOS = [
  { id: "mais-vendido", rotulo: "Mais vendido" },
  { id: "lancamento", rotulo: "Lançamento" },
  { id: "oferta", rotulo: "Oferta" },
  { id: "kit", rotulo: "Kit" },
];

export interface ProdutoEdicao {
  id: string;
  nome: string;
  subtitulo: string;
  forma: string;
  objetivos: string[];
  selos: string[];
  sabores: string[];
  receita: boolean;
  ativo: boolean;
  descricao: string[];
  comoUsar: string;
  ingredientes: string;
  porcao: string;
  tabela: { item: string; qtd: string; vd?: string }[];
  tamanhos: { id: string; codigo: string; rotulo: string; preco: string; precoDe: string; estoque: number }[];
}

function Area({ id, rotulo, erro, dica, ...props }: React.ComponentProps<"textarea"> & { id: string; rotulo: string; erro?: string; dica?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {rotulo}
      </label>
      <textarea id={id} aria-invalid={erro ? true : undefined} aria-describedby={erro ? `${id}-erro` : undefined} className={classeEntrada} {...props} />
      {dica && !erro && <p className="mt-1 text-xs text-muted">{dica}</p>}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Formulário único de produto: dados, tamanhos (preço, "de", estoque) e, no cadastro, o primeiro tamanho. */
export function ProdutoForm({ produto }: { produto?: ProdutoEdicao }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(salvarProduto.bind(null, produto?.id ?? null), undefined);
  const v = estado?.valores ?? {};
  const erros = estado?.erros ?? {};
  const val = (campo: string, padrao: string) => v[campo] ?? padrao;

  return (
    <form action={acao} className="grid gap-6">
      <fieldset className="grid gap-5 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
        <legend className="px-2 font-display text-xl font-bold">Dados do produto</legend>
        <div className="sm:col-span-2">
          <Campo id={`${uid}-nome`} name="nome" rotulo="Nome" required defaultValue={val("nome", produto?.nome ?? "")} erro={erros.nome} />
        </div>
        <Campo id={`${uid}-sub`} name="subtitulo" rotulo="Subtítulo" required defaultValue={val("subtitulo", produto?.subtitulo ?? "")} erro={erros.subtitulo} placeholder="Ex.: Cápsulas manipuladas" />
        <div>
          <label htmlFor={`${uid}-forma`} className="mb-1.5 block text-sm font-bold">
            Forma farmacêutica
          </label>
          <select key={v.forma ?? produto?.forma} id={`${uid}-forma`} name="forma" required defaultValue={val("forma", produto?.forma ?? "")} className={classeEntrada} aria-invalid={erros.forma ? true : undefined}>
            <option value="" disabled>
              Escolha
            </option>
            {formas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.rotulo}
              </option>
            ))}
          </select>
          {erros.forma && <p role="alert" className="mt-1 text-sm font-semibold text-coral">{erros.forma}</p>}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-bold">Objetivos</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {objetivos.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="objetivos" value={o.id} defaultChecked={produto?.objetivos.includes(o.id)} className="size-4 accent-forest" />
                {o.rotulo}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-bold">Selos</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SELOS.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="selos" value={s.id} defaultChecked={produto?.selos.includes(s.id)} className="size-4 accent-forest" />
                {s.rotulo}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <Campo id={`${uid}-sab`} name="sabores" rotulo="Sabores (opcional)" defaultValue={val("sabores", produto?.sabores.join(", ") ?? "")} dica="Separe por vírgula. Se houver sabores, o cliente precisa escolher um." />
        </div>
        <div className="sm:col-span-2">
          <Area id={`${uid}-desc`} name="descricao" rotulo="Descrição" rows={5} required defaultValue={val("descricao", produto?.descricao.join("\n\n") ?? "")} erro={erros.descricao} dica="Deixe uma linha em branco entre parágrafos. Evite promessa de cura ou de resultado." />
        </div>
        <div className="sm:col-span-2">
          <Area id={`${uid}-uso`} name="comoUsar" rotulo="Como usar" rows={2} required defaultValue={val("comoUsar", produto?.comoUsar ?? "")} erro={erros.comoUsar} />
        </div>
        <div className="sm:col-span-2">
          <Area id={`${uid}-ing`} name="ingredientes" rotulo="Ingredientes" rows={2} required defaultValue={val("ingredientes", produto?.ingredientes ?? "")} erro={erros.ingredientes} />
        </div>
        <Campo id={`${uid}-por`} name="porcao" rotulo="Porção" required defaultValue={val("porcao", produto?.porcao ?? "")} erro={erros.porcao} placeholder="Ex.: 1 cápsula" />
        <div className="sm:col-span-2">
          <Area
            id={`${uid}-tab`}
            name="tabela"
            rotulo="Informação nutricional"
            rows={4}
            defaultValue={val("tabela", produto?.tabela.map((l) => [l.item, l.qtd, l.vd].filter(Boolean).join(" | ")).join("\n") ?? "")}
            erro={erros.tabela}
            dica='Uma linha por componente: "Magnésio | 300 mg | 71%". O %VD é opcional. Kits podem ficar vazios.'
          />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="receita" defaultChecked={produto?.receita} className="size-4 accent-forest" /> Venda condicionada à receita
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true} className="size-4 accent-forest" /> Visível na loja
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-card border border-line bg-white p-5">
        <legend className="px-2 font-display text-xl font-bold">Tamanhos, preços e estoque</legend>
        {produto?.tamanhos.map((t) => (
          <div key={t.id} className="mb-4 grid gap-4 border-b border-line pb-4 sm:grid-cols-[6rem_1fr_8rem_8rem_7rem]">
            <p className="self-end pb-3 font-mono text-sm font-bold">{t.codigo}</p>
            <Campo id={`${uid}-${t.id}-r`} name={`t-${t.id}-rotulo`} rotulo="Nome" required defaultValue={val(`t-${t.id}-rotulo`, t.rotulo)} />
            <Campo id={`${uid}-${t.id}-p`} name={`t-${t.id}-preco`} rotulo="Preço (R$)" inputMode="decimal" required defaultValue={val(`t-${t.id}-preco`, t.preco)} />
            <Campo id={`${uid}-${t.id}-d`} name={`t-${t.id}-precoDe`} rotulo='Preço "de"' inputMode="decimal" defaultValue={val(`t-${t.id}-precoDe`, t.precoDe)} />
            <Campo id={`${uid}-${t.id}-e`} name={`t-${t.id}-estoque`} rotulo="Estoque" inputMode="numeric" required defaultValue={val(`t-${t.id}-estoque`, String(t.estoque))} />
          </div>
        ))}
        <p className="mb-3 text-sm font-semibold">{produto ? "Adicionar tamanho (opcional)" : "Primeiro tamanho"}</p>
        <div className="grid gap-4 sm:grid-cols-[6rem_1fr_8rem_8rem_7rem]">
          <Campo id={`${uid}-nc`} name="t-novo-codigo" rotulo="Código" required={!produto} placeholder="60" defaultValue={v["t-novo-codigo"]} />
          <Campo id={`${uid}-nr`} name="t-novo-rotulo" rotulo="Nome" required={!produto} placeholder="60 cápsulas" defaultValue={v["t-novo-rotulo"]} />
          <Campo id={`${uid}-np`} name="t-novo-preco" rotulo="Preço (R$)" inputMode="decimal" required={!produto} placeholder="79,90" defaultValue={v["t-novo-preco"]} />
          <Campo id={`${uid}-nd`} name="t-novo-precoDe" rotulo='Preço "de"' inputMode="decimal" defaultValue={v["t-novo-precoDe"]} />
          <Campo id={`${uid}-ne`} name="t-novo-estoque" rotulo="Estoque" inputMode="numeric" defaultValue={v["t-novo-estoque"] ?? "0"} />
        </div>
        <p className="mt-3 text-xs text-muted">Tamanhos já usados em pedidos não podem ser apagados; para tirar um da venda, zere o estoque.</p>
      </fieldset>

      {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
      {estado?.ok && <FaixaMensagem tipo="ok">{estado.ok}</FaixaMensagem>}
      <div>
        <Botao type="submit" variante="primario" tamanho="l" disabled={pendente}>
          {pendente ? "Salvando…" : produto ? "Salvar alterações" : "Cadastrar produto"}
        </Botao>
      </div>
    </form>
  );
}

/** Estoque editável na própria lista. */
export function EstoqueRapido({ tamanhoId, estoque, rotulo }: { tamanhoId: string; estoque: number; rotulo: string }) {
  const uid = useId();
  const [estado, acao, pendente] = useActionState(ajustarEstoque.bind(null, tamanhoId), undefined);
  return (
    <form action={acao} className="flex items-center gap-2">
      <label htmlFor={uid} className="min-w-0 flex-1 truncate text-sm text-muted">
        {rotulo}
      </label>
      <input id={uid} name="estoque" inputMode="numeric" defaultValue={estoque} className="w-20 rounded-full border border-line px-3 py-1.5 text-right text-sm tabular-nums" aria-invalid={estado?.erro ? true : undefined} />
      <Botao type="submit" variante="claro" tamanho="p" disabled={pendente} aria-label={`Salvar estoque de ${rotulo}`}>
        {pendente ? "…" : estado?.ok ? "✓" : "Salvar"}
      </Botao>
    </form>
  );
}
