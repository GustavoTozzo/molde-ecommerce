"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useCatalogo } from "@/components/catalogo/CatalogoContext";
import { calcularCarrinho, chaveItem, type Frequencia, type ItemCarrinho } from "@/lib/carrinho";
import type { CupomAplicado } from "@/lib/types";

/**
 * Estado do navegador: carrinho, cupom exibido, favoritos de visitante e aviso.
 * Fica no localStorage; o servidor só entra no checkout, quando recalcula tudo a
 * partir do banco (preços, cupom, estoque) sem confiar no que está aqui.
 */
interface State {
  itens: ItemCarrinho[];
  cupom: CupomAplicado | null;
  receita: string | null;
  favoritos: string[];
  carrinhoAberto: boolean;
  aviso: { id: number; mensagem: string } | null;
}

const CHAVE = "casa-magistral:estado:v2";
const inicial: State = { itens: [], cupom: null, receita: null, favoritos: [], carrinhoAberto: false, aviso: null };

let state: State = inicial;
let carregado = false;
let avisoTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((l) => l());
}

function persistir() {
  try {
    const { itens, cupom, receita, favoritos } = state;
    localStorage.setItem(CHAVE, JSON.stringify({ itens, cupom, receita, favoritos }));
  } catch {
    /* armazenamento indisponível: segue sem persistir */
  }
}

function carregar() {
  if (carregado || typeof window === "undefined") return;
  carregado = true;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return;
    const lido = JSON.parse(bruto) as Partial<State>;
    state = {
      ...state,
      itens: Array.isArray(lido.itens) ? lido.itens : [],
      cupom: lido.cupom ?? null,
      receita: lido.receita ?? null,
      favoritos: Array.isArray(lido.favoritos) ? lido.favoritos : [],
    };
  } catch {
    /* dados corrompidos: ignora */
  }
}

function definir(parcial: Partial<State>, persistirEstado = true) {
  state = { ...state, ...parcial };
  if (persistirEstado) persistir();
  emitir();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!carregado) {
    carregar();
    window.addEventListener("storage", aoMudarOutraAba);
  }
  return () => {
    listeners.delete(listener);
  };
}

function aoMudarOutraAba(e: StorageEvent) {
  if (e.key !== CHAVE) return;
  carregado = false;
  state = { ...inicial, carrinhoAberto: state.carrinhoAberto };
  carregar();
  emitir();
}

export function useStore<T>(seletor: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => seletor(state),
    () => seletor(inicial),
  );
}

/* ---------- ações ---------- */

export function mostrarAviso(mensagem: string) {
  clearTimeout(avisoTimer);
  definir({ aviso: { id: Date.now(), mensagem } }, false);
  avisoTimer = setTimeout(() => definir({ aviso: null }, false), 3800);
}

export function adicionarAoCarrinho(
  produto: { slug: string; nome: string },
  opcoes: { tamanhoId: string; sabor?: string; qtd?: number; frequencia?: Frequencia; abrir?: boolean },
) {
  const { slug } = produto;
  const frequencia = opcoes.frequencia ?? "unica";
  const qtd = Math.max(1, opcoes.qtd ?? 1);
  const key = chaveItem(slug, opcoes.tamanhoId, opcoes.sabor, frequencia);
  const existente = state.itens.find((i) => i.key === key);
  const itens = existente
    ? state.itens.map((i) => (i.key === key ? { ...i, qtd: Math.min(20, i.qtd + qtd) } : i))
    : [...state.itens, { key, slug, tamanhoId: opcoes.tamanhoId, sabor: opcoes.sabor, qtd, frequencia }];
  definir({ itens, carrinhoAberto: opcoes.abrir ?? state.carrinhoAberto });
  if (!opcoes.abrir) mostrarAviso(`${produto.nome} foi adicionado ao carrinho`);
}

export function alterarQuantidade(key: string, qtd: number) {
  if (qtd < 1) return removerDoCarrinho(key);
  definir({ itens: state.itens.map((i) => (i.key === key ? { ...i, qtd: Math.min(20, qtd) } : i)) });
}

export function removerDoCarrinho(key: string) {
  definir({ itens: state.itens.filter((i) => i.key !== key) });
}

export function alterarFrequencia(key: string, frequencia: Frequencia) {
  const alvo = state.itens.find((i) => i.key === key);
  if (!alvo) return;
  const novaKey = chaveItem(alvo.slug, alvo.tamanhoId, alvo.sabor, frequencia);
  const outro = state.itens.find((i) => i.key === novaKey && i.key !== key);
  const restantes = state.itens.filter((i) => i.key !== key && i.key !== novaKey);
  const qtd = Math.min(20, alvo.qtd + (outro?.qtd ?? 0));
  definir({ itens: [...restantes, { ...alvo, key: novaKey, frequencia, qtd }] });
}

export function aplicarCupom(cupom: CupomAplicado | null) {
  definir({ cupom });
}

export function definirReceita(nomeArquivo: string | null) {
  definir({ receita: nomeArquivo });
}

export function limparCarrinho() {
  definir({ itens: [], cupom: null, receita: null });
}

export function abrirCarrinho() {
  definir({ carrinhoAberto: true }, false);
}

export function fecharCarrinho() {
  definir({ carrinhoAberto: false }, false);
}

export function alternarFavorito(produto: { slug: string; nome: string }) {
  const ja = state.favoritos.includes(produto.slug);
  definir({ favoritos: ja ? state.favoritos.filter((s) => s !== produto.slug) : [...state.favoritos, produto.slug] });
  mostrarAviso(ja ? `${produto.nome} removido dos favoritos` : `${produto.nome} salvo nos favoritos`);
}

/* ---------- hooks de conveniência ---------- */

export function useCarrinho() {
  const itens = useStore((s) => s.itens);
  const cupom = useStore((s) => s.cupom);
  const { porSlug } = useCatalogo();
  return useMemo(() => calcularCarrinho(itens, cupom, porSlug), [itens, cupom, porSlug]);
}

export function useEhFavorito(slug: string): boolean {
  return useStore((s) => s.favoritos.includes(slug));
}
