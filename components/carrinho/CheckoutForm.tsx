"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState, useSyncExternalStore } from "react";
import { CreditCard, FileText, Lock, QrCode, ReceiptText, ShoppingBag } from "lucide-react";
import { EnderecoVisao } from "@/components/conta/EnderecosUI";
import { Botao, LinkBotao } from "@/components/ui/Button";
import { Campo, FaixaMensagem, classeEntrada } from "@/components/ui/Campo";
import { formatBRL, mascararCep, parcelamento } from "@/lib/format";
import { site } from "@/lib/site";
import { useCarrinho, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { finalizarPedido } from "@/server/acoes/pedido";
import { ResumoValores } from "./Complementos";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const TAMANHO_MAXIMO_RECEITA = 3 * 1024 * 1024;

type Forma = "PIX" | "CARTAO" | "BOLETO";

/** Chave única por abertura desta página: o servidor a usa para não criar dois pedidos num reenvio. */
function useChaveUnica(): string {
  const ref = useRef<string | null>(null);
  return useSyncExternalStore(
    () => () => {},
    () => (ref.current ??= crypto.randomUUID()),
    () => "",
  );
}

const soDigitos = (v: string) => v.replace(/\D/g, "");

function luhn(numero: string): boolean {
  let soma = 0;
  for (let i = 0; i < numero.length; i++) {
    let d = Number(numero[numero.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  }
  return soma % 10 === 0;
}

function mascararCartao(v: string): string {
  return soDigitos(v).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

function mascararValidade(v: string): string {
  const d = soDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

interface CartaoErros {
  numero?: string;
  nome?: string;
  validade?: string;
  cvv?: string;
}

function validarCartao(c: { numero: string; nome: string; validade: string; cvv: string }): CartaoErros {
  const erros: CartaoErros = {};
  const n = soDigitos(c.numero);
  if (n.length < 13 || n.length > 19 || !luhn(n)) erros.numero = "Confira o número do cartão.";
  if (c.nome.trim().length < 3) erros.nome = "Informe o nome impresso no cartão.";
  const [mm, aa] = c.validade.split("/").map(Number);
  const hoje = new Date();
  const fim = mm >= 1 && mm <= 12 && aa >= 0 ? new Date(2000 + aa, mm, 0, 23, 59, 59) : null;
  if (!fim || fim < hoje) erros.validade = "Validade inválida ou vencida.";
  if (!/^\d{3,4}$/.test(c.cvv)) erros.cvv = "Informe o código de segurança.";
  return erros;
}

function Secao({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Lock; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-white p-5 md:p-7">
      <h2 className="mb-5 flex items-center gap-2.5 font-display text-2xl font-bold text-forest-dark">
        <Icone className="size-6 text-forest" aria-hidden /> {titulo}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({ enderecos }: { enderecos: EnderecoVisao[] }) {
  const uid = useId();
  const resumo = useCarrinho();
  const itens = useStore((s) => s.itens);
  const cupom = useStore((s) => s.cupom);
  const chave = useChaveUnica();
  const [estado, acao, enviando] = useActionState(finalizarPedido, undefined);
  const v = estado?.valores ?? {};
  const erros = estado?.erros ?? {};

  const [enderecoId, setEnderecoId] = useState(enderecos.find((e) => e.principal)?.id ?? enderecos[0]?.id ?? "novo");
  const [forma, setForma] = useState<Forma>("PIX");
  const [parcelas, setParcelas] = useState(1);
  const [cartao, setCartao] = useState({ numero: "", nome: "", validade: "", cvv: "" });
  const [errosCartao, setErrosCartao] = useState<CartaoErros>({});
  const [erroReceita, setErroReceita] = useState<string | null>(null);

  if (resumo.linhas.length === 0) {
    return (
      <div className="mt-10 rounded-panel bg-cream px-6 py-20 text-center">
        <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-mint text-forest">
          <ShoppingBag className="size-11" aria-hidden />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold">Seu carrinho está vazio</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Adicione produtos para finalizar a compra.</p>
        <LinkBotao href="/produtos" variante="primario" tamanho="l" className="mt-7">
          Ver produtos
        </LinkBotao>
      </div>
    );
  }

  const maxParcelas = parcelamento(resumo.total, site.loja.parcelasMax, site.loja.parcelaMinima).parcelas;
  const parcelasEfetivas = Math.min(parcelas, maxParcelas);
  const final4 = soDigitos(cartao.numero).slice(-4);
  const itensParaEnvio = JSON.stringify(itens.map((i) => ({ slug: i.slug, tamanhoId: i.tamanhoId, sabor: i.sabor, qtd: i.qtd, frequencia: i.frequencia })));
  const alterarCartao = (campo: keyof typeof cartao, valor: string) => setCartao((c) => ({ ...c, [campo]: valor }));

  return (
    <form
      action={acao}
      className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12"
      onSubmit={(e) => {
        // Os dados do cartão só existem aqui no navegador (os campos nem têm `name`): conferimos o formato
        // antes de enviar, e ao servidor só vão os 4 últimos dígitos.
        if (forma === "CARTAO") {
          const problemas = validarCartao(cartao);
          setErrosCartao(problemas);
          if (Object.keys(problemas).length > 0) e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="itens" value={itensParaEnvio} />
      <input type="hidden" name="cupom" value={cupom?.codigo ?? ""} />
      <input type="hidden" name="chave" value={chave} />
      <input type="hidden" name="cartaoFinal4" value={forma === "CARTAO" ? final4 : ""} />

      <div className="grid h-fit gap-6">
        <Secao titulo="Entrega" icone={ReceiptText}>
          {enderecos.length > 0 && (
            <fieldset className="grid gap-3">
              <legend className="sr-only">Endereço de entrega</legend>
              {enderecos.map((e) => (
                <label key={e.id} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4", enderecoId === e.id ? "border-forest bg-mint/50" : "border-line")}>
                  <input type="radio" name="enderecoId" value={e.id} checked={enderecoId === e.id} onChange={() => setEnderecoId(e.id)} className="mt-1 accent-forest" />
                  <span className="text-sm">
                    <strong className="block">{e.apelido || "Endereço"}</strong>
                    {e.logradouro}, {e.numero}
                    {e.complemento ? ` · ${e.complemento}` : ""} — {e.bairro}, {e.cidade}/{e.uf} · CEP {e.cep}
                  </span>
                </label>
              ))}
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold", enderecoId === "novo" ? "border-forest bg-mint/50" : "border-line")}>
                <input type="radio" name="enderecoId" value="novo" checked={enderecoId === "novo"} onChange={() => setEnderecoId("novo")} className="accent-forest" />
                Entregar em outro endereço
              </label>
            </fieldset>
          )}
          {enderecos.length === 0 && <input type="hidden" name="enderecoId" value="novo" />}

          {enderecoId === "novo" && (
            <div className={cn("grid gap-5 sm:grid-cols-6", enderecos.length > 0 && "mt-5")}>
              <div className="sm:col-span-3">
                <Campo id={`${uid}-cep`} name="cep" rotulo="CEP" inputMode="numeric" autoComplete="postal-code" required maxLength={9} defaultValue={v.cep} onChange={(e) => (e.currentTarget.value = mascararCep(e.currentTarget.value))} erro={erros.cep} />
              </div>
              <div className="sm:col-span-3">
                <Campo id={`${uid}-apelido`} name="apelido" rotulo="Apelido (opcional)" placeholder="Casa, trabalho…" defaultValue={v.apelido} erro={erros.apelido} />
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
                {/* `key`: o React limpa o formulário depois de cada ação; sem remontar, o <select> volta ao vazio. */}
                <select key={v.uf ?? "sem-uf"} id={`${uid}-uf`} name="uf" required defaultValue={v.uf ?? ""} aria-invalid={erros.uf ? true : undefined} className={classeEntrada}>
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
                  <p role="alert" className="mt-1 text-sm font-semibold text-coral">
                    {erros.uf}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-3 text-sm sm:col-span-6">
                <input type="checkbox" name="salvarEndereco" defaultChecked={v.salvarEndereco === "on"} className="size-4 accent-forest" />
                Salvar este endereço na minha conta
              </label>
            </div>
          )}
        </Secao>

        {resumo.precisaReceita && (
          <Secao titulo="Receita" icone={FileText}>
            <p className="text-sm text-muted">Há itens de venda sob receita no pedido. Anexe uma foto nítida ou o PDF da receita (até 3 MB). O farmacêutico responsável confere antes de preparar a fórmula.</p>
            <div className="mt-4">
              <label htmlFor={`${uid}-receita`} className="mb-1.5 block text-sm font-bold">
                Arquivo da receita
              </label>
              <input
                id={`${uid}-receita`}
                name="receita"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                required
                aria-invalid={erroReceita ? true : undefined}
                aria-describedby={erroReceita ? `${uid}-receita-erro` : undefined}
                onChange={(e) => {
                  const arq = e.currentTarget.files?.[0];
                  if (arq && arq.size > TAMANHO_MAXIMO_RECEITA) {
                    setErroReceita("O arquivo passa de 3 MB. Envie uma foto ou PDF menor.");
                    e.currentTarget.value = "";
                  } else setErroReceita(null);
                }}
                className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-mint file:px-5 file:py-2.5 file:font-bold file:text-forest-dark hover:file:bg-mint-deep"
              />
              {erroReceita && (
                <p id={`${uid}-receita-erro`} role="alert" className="mt-1 text-sm font-semibold text-coral">
                  {erroReceita}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">O arquivo é guardado de forma restrita: só você e a equipe farmacêutica conseguem abri-lo.</p>
            </div>
          </Secao>
        )}

        <Secao titulo="Pagamento" icone={CreditCard}>
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Forma de pagamento</legend>
            {(
              [
                { id: "PIX", rotulo: "Pix", detalhe: "Aprovação imediata", icone: QrCode },
                { id: "CARTAO", rotulo: "Cartão de crédito", detalhe: `até ${site.loja.parcelasMax}x sem juros`, icone: CreditCard },
                { id: "BOLETO", rotulo: "Boleto", detalhe: "Vence em 3 dias", icone: ReceiptText },
              ] as const
            ).map(({ id, rotulo, detalhe, icone: Icone }) => (
              <label key={id} className={cn("flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 text-sm", forma === id ? "border-forest bg-mint/50" : "border-line")}>
                <input type="radio" name="formaPagamento" value={id} checked={forma === id} onChange={() => setForma(id)} className="sr-only" />
                <Icone className="size-5 text-forest" aria-hidden />
                <strong>{rotulo}</strong>
                <span className="text-muted">{detalhe}</span>
              </label>
            ))}
          </fieldset>
          {erros.formaPagamento && (
            <p role="alert" className="mt-2 text-sm font-semibold text-coral">
              {erros.formaPagamento}
            </p>
          )}

          {forma === "CARTAO" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <Campo
                  id={`${uid}-cc-num`}
                  rotulo="Número do cartão"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cartao.numero}
                  onChange={(e) => alterarCartao("numero", mascararCartao(e.target.value))}
                  erro={errosCartao.numero ?? erros.cartao}
                  dica="Simulação: use 4242 4242 4242 4242. Final 0002 = recusado. Nada disso é enviado ao servidor, só os 4 últimos dígitos."
                />
              </div>
              <div className="sm:col-span-6">
                <Campo id={`${uid}-cc-nome`} rotulo="Nome impresso no cartão" autoComplete="cc-name" value={cartao.nome} onChange={(e) => alterarCartao("nome", e.target.value)} erro={errosCartao.nome} />
              </div>
              <div className="sm:col-span-3">
                <Campo id={`${uid}-cc-val`} rotulo="Validade (MM/AA)" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={cartao.validade} onChange={(e) => alterarCartao("validade", mascararValidade(e.target.value))} erro={errosCartao.validade} />
              </div>
              <div className="sm:col-span-3">
                <Campo id={`${uid}-cc-cvv`} rotulo="Código (CVV)" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={cartao.cvv} onChange={(e) => alterarCartao("cvv", soDigitos(e.target.value))} erro={errosCartao.cvv} />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor={`${uid}-parcelas`} className="mb-1.5 block text-sm font-bold">
                  Parcelas
                </label>
                <select id={`${uid}-parcelas`} name="parcelas" value={parcelasEfetivas} onChange={(e) => setParcelas(Number(e.target.value))} className={classeEntrada}>
                  {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? `À vista · ${formatBRL(resumo.total)}` : `${n}x de ${formatBRL(Math.round(resumo.total / n))} sem juros`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {forma !== "CARTAO" && <input type="hidden" name="parcelas" value="1" />}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Pagamento simulado para demonstração: nenhuma cobrança real é feita e nenhum dado financeiro real deve ser informado.
          </p>
        </Secao>
      </div>

      <aside className="h-fit space-y-5 rounded-panel bg-cream p-6 lg:sticky lg:top-44" aria-label="Resumo do pedido">
        <h2 className="font-display text-2xl font-bold">Resumo do pedido</h2>
        <ul className="divide-y divide-line">
          {resumo.linhas.map((l) => (
            <li key={l.item.key} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span>
                <strong className="block">{l.produto.nome}</strong>
                <span className="text-muted">
                  {l.tamanho.rotulo}
                  {l.item.sabor ? ` · ${l.item.sabor}` : ""} · {l.item.qtd} un.
                </span>
              </span>
              <span className="font-semibold">{formatBRL(l.total)}</span>
            </li>
          ))}
        </ul>
        {cupom && (
          <p className="rounded-2xl bg-white px-4 py-2.5 text-sm">
            Cupom <strong>{cupom.codigo}</strong> aplicado
          </p>
        )}
        <ResumoValores resumo={resumo} />
        {estado?.erro && <FaixaMensagem tipo="erro">{estado.erro}</FaixaMensagem>}
        <Botao type="submit" variante="primario" tamanho="l" className="w-full" disabled={enviando || !chave}>
          <Lock className="size-4" aria-hidden /> {enviando ? "Confirmando…" : "Confirmar pedido"}
        </Botao>
        <p className="text-center text-xs text-muted">Os valores são conferidos de novo no servidor ao confirmar. Ao continuar, você concorda com os <Link href="/institucional/termos" className="underline">termos de uso</Link>.</p>
      </aside>
    </form>
  );
}
