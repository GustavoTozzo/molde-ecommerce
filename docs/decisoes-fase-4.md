# Decisões da Fase 4: checkout real

Objetivo: transformar o checkout de demonstração em um fluxo de compra completo (pedido, estoque, cupom, pagamento simulado, receita e acompanhamento), sem confiar em nada que venha do navegador.

## O que entrou

- **`/checkout`** (exige login): endereço salvo ou novo (com opção de salvar), forma de pagamento (Pix, cartão com parcelas, boleto), upload da receita quando há item sob receita e resumo com os valores.
- **`criarPedido`** (`server/pedidos.ts`): cria o pedido numa transação. Também `confirmarPagamentoSimulado` e `cancelarPedido`.
- **`/conta/pedidos/[id]`**: linha do tempo, pagamento (QR Code e "copia e cola" do Pix fictício, linha digitável do boleto), receita, itens, totais, entrega e cancelamento.
- **`/api/receitas/[id]`**: entrega do arquivo da receita só ao dono e à equipe.
- **Testes de integração no repositório** (`npm run test`): 19 testes contra o Postgres local.

## Decisões

**O navegador só diz o que quer comprar.** O formulário envia `slug`, `tamanho`, `sabor`, `quantidade` e `frequência`. Preços, desconto de assinatura, cupom, frete, exigência de receita e estoque são recalculados no servidor com `calcularCarrinho` (a mesma função pura da tela) alimentada por dados do banco. Não existe campo de preço ou total para forjar.

**Estoque sem venda dupla.** A baixa é um `UPDATE … WHERE estoque >= qtd` por item dentro da transação: atômico, então duas compras simultâneas do último frasco não passam as duas (a segunda encontra zero linhas, a transação desfaz tudo e a pessoa recebe "Estoque insuficiente de X"). Teste: 8 compras simultâneas com 3 unidades em estoque resultam em exatamente 3 pedidos e estoque 0.

**Idempotência.** Cada abertura do checkout gera uma chave (`useSyncExternalStore` para não causar divergência de hidratação); o servidor a grava em `Pedido.chaveIdempotencia` (único por usuário). Reenviar o formulário, clicar duas vezes ou repetir a requisição devolve o pedido já criado em vez de cobrar duas vezes; duas requisições simultâneas com a mesma chave também resultam em um pedido só (a perdedora cai na violação de unicidade e devolve o da vencedora).

**Cupom.** Validado de novo dentro da transação e contabilizado com `UPDATE` condicional (`usos < usosMax`), então um cupom de uso único não é usado duas vezes por compras simultâneas. Cancelar o pedido devolve o uso.

**Pagamento simulado, sem dado financeiro real.** `server/pagamento.ts` é o único lugar a trocar por um gateway. Pix e boleto nascem `PENDENTE` com código fictício (prefixos `PIX-SIMULADO-` e `99999.`); um botão "Simular pagamento (demonstração)" faz o papel do webhook. Cartão: o número, o nome, a validade e o CVV **nem têm atributo `name`**, ou seja, o formulário não os envia. O navegador confere o formato (Luhn, validade) e manda ao servidor só os 4 últimos dígitos e as parcelas. Um teste do navegador inspeciona o corpo do POST e confirma que o número completo e o CVV não saem da página. Cartão terminado em `0002` é recusado (não cria pedido, não baixa estoque); os demais são aprovados. Com um gateway real, a captura usaria os campos hospedados do provedor, para que o dado de cartão também nunca passe pelo servidor da loja.

**Máquina de estados do pedido.**

| Situação | `status` | `statusPagamento` |
|---|---|---|
| Cartão aprovado, sem receita | `EM_PREPARO` | `CONFIRMADO` |
| Cartão aprovado, com receita | `AGUARDANDO_RECEITA` | `CONFIRMADO` |
| Pix ou boleto emitido | `AGUARDANDO_PAGAMENTO` | `PENDENTE` |
| Pagamento confirmado (simulado) | `EM_PREPARO` ou `AGUARDANDO_RECEITA` | `CONFIRMADO` |
| Cancelado antes do preparo | `CANCELADO` | `ESTORNADO` (se já pago) |

O cliente só cancela em `AGUARDANDO_PAGAMENTO` e `AGUARDANDO_RECEITA`. O cancelamento devolve o estoque, estorna o pagamento confirmado, devolve o uso do cupom e encerra as assinaturas criadas pelo pedido, tudo numa transação; o `UPDATE` com o status esperado impede cancelar duas vezes (e devolver o estoque duas vezes). Pedido em preparo exige falar com a farmácia (a equipe cancela no painel, Fase 5).

**Receita (dado sensível de saúde).**
- O tipo do arquivo é decidido pelos **primeiros bytes** (PDF, PNG ou JPEG), não pelo nome nem pelo `Content-Type` que o navegador declara. Um `.pdf` que é só texto é recusado. Limite de 3 MB, conferido no navegador e no servidor; `serverActions.bodySizeLimit` subiu para 4 MB (o padrão do Next é 1 MB, e o teto da função na Vercel é 4,5 MB).
- O nome é higienizado (sem caminhos ou caracteres de controle) e a extensão vem do tipo detectado.
- Fica no banco (`Receita.conteudo`), o que é aceitável para demonstração; em produção, armazenamento privado com URL assinada e prazo de retenção definido (LGPD).
- `/api/receitas/[id]`: 401 sem login; **404 para quem não é o dono nem da equipe** (não confirma a existência da receita de ninguém); `nosniff` e `Cache-Control: private, no-store`.
- Cada pedido com item sob receita exige um arquivo novo; reaproveitar receita aprovada fica para depois.

**Isolamento entre clientes.** A página do pedido busca por `{ id, usuarioId }`; pedir o id de outra pessoa dá 404. Endereço usado no checkout é conferido pelo dono. Os testes do navegador confirmam 404 para um segundo cliente no pedido e na receita alheios, e 200 para o administrador na receita.

**Endereço como snapshot.** O pedido guarda uma cópia do endereço (JSON); editar ou apagar o cadastro depois não muda pedidos antigos. Salvar um endereço novo é cortesia: se falhar, o pedido não é derrubado.

**Parcelas.** Até 6x sem juros, com parcela mínima de R$ 20; o servidor confere o número escolhido contra o total real.

**Cabeçalho em `<Suspense>`.** A página do pedido é uma rota dinâmica sem `generateStaticParams`; nesse caso o `usePathname()` do cabeçalho exige um limite de Suspense (o build acusou). O mesmo vale para a navegação lateral da conta.

**Receita na tela do carrinho.** O envio simulado (só o nome do arquivo) saiu do carrinho; ali fica um aviso e o upload de verdade acontece no checkout. O estado do navegador deixou de ter o campo `receita`.

## Limitações conhecidas (registradas, não escondidas)

- **Assinatura:** o pedido cria os registros de assinatura com a próxima entrega, mas **não existe rotina que gere os pedidos recorrentes** nem cobrança recorrente. É a parte que mais depende de gateway/Shopify (Fase 8).
- **Frete** segue a regra fixa de `lib/site.ts` (grátis acima de R$ 249, senão R$ 19,90), sem cotação por CEP.
- **Estoque** não aparece na vitrine: dá para pôr no carrinho um item esgotado e só descobrir no checkout (com mensagem clara). Mostrar "indisponível" na página do produto é um próximo passo barato.
- **`Produto.vendas`** (ranking "mais vendidos") não é atualizado pelos pedidos.
- **Limitador de tentativas** em memória (ver Fase 3): até 20 pedidos por hora por usuário.
- Em `http://localhost` com `next start`, o CSP `upgrade-insecure-requests` pode gerar erro de console em prefetch com redirecionamento; some em HTTPS e foi evitado no checkout com `prefetch={false}`.

## Verificação

- `tsc`, `eslint` e build de produção sem erros.
- **19 testes de integração** (`tests/pedidos.test.ts`): totais e snapshots, frete grátis/fixo, Pix e confirmação, pedido alheio, cartão recusado, receita obrigatória, produto/tamanho/sabor inválidos, assinatura e desconto, idempotência (sequencial e simultânea), 8 compras para 3 unidades, cupom (percentual, frete, vencido, esgotado, corrida pelo último uso) e cancelamento (estoque, estorno, assinatura, dupla chamada, dono).
- **35 verificações no navegador** (`checkout.mjs`): Pix com cupom e endereço salvo, totais no banco, estoque, carrinho esvaziado, simulação de pagamento, cancelamento, validação local do cartão, recusa, aprovação em 2x **sem enviar o número do cartão**, novo endereço salvo, upload (falso, grande e válido), acesso à receita (dono, anônimo, outro cliente, equipe) e estoque insuficiente.
- As suítes anteriores seguem verdes: 37 de conta e 55 do site público.
- Nos testes, o banco é restaurado ao final (estoque, usos de cupom, usuários e pedidos de teste).

## Próxima fase

Fase 5, painel administrativo: pedidos (listar, filtrar, enviar com código de rastreio, entregar, cancelar), **fila de conferência de receitas** (aprovar ou recusar com observação, o que move o pedido para preparo), produtos e estoque, cupons e mensagens. Papéis: `FARMACEUTICO` cuida de receitas e pedidos; `ADMINISTRADOR` tem acesso total. Inclui reenvio de receita recusada.
