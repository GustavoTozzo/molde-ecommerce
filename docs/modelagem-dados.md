# Modelagem de dados

Fonte da verdade: [`prisma/schema.prisma`](../prisma/schema.prisma). Este documento explica **por que** o modelo é assim. Nomes de tabelas e campos em português, no plural nas tabelas (`produtos`, `pedidos`).

## Visão geral

```
Usuario ──< Endereco
   │──< Pedido ──< ItemPedido >── Produto ──< Tamanho
   │      │  └──> Receita (opcional)               │──< Avaliacao
   │      └──< Assinatura >── Produto/Tamanho      │──< Favorito >── Usuario
   │──< Receita (enviadas)   ▲ revisadaPor         └──< ProdutoDeEspecialista >── Especialista
   └──< Favorito, Avaliacao                          Criador ──> Produto
Cupom, Post, MensagemContato, InscritoNewsletter (independentes)
```

## Decisões que valem registrar

**Dinheiro é `Int` em centavos.** Nada de `Float` ou `Decimal` no código de aplicação: soma, desconto percentual (`Math.round`) e parcelas são feitos em inteiros e formatados só na borda (`formatBRL`). Evita `0,1 + 0,2` e arredondamento divergente entre cliente e servidor.

**Taxonomia como `String`, não enum.** `forma`, `objetivos`, `fundo`, `selos` e `artKind` são texto livre no banco; o TypeScript restringe os valores (`FormaId`, `ObjetivoId`…) e o repositório faz o `as`. Motivo: novas categorias não deveriam exigir migração. A contrapartida é que o painel administrativo (Fase 5) valida esses campos com `zod` antes de gravar.

**Tamanho tem `codigo` além do `id`.** O carrinho do navegador guarda `tamanhoId = codigo` ("30", "60", "kit"), que é legível, estável entre ambientes e não vaza identificadores do banco. `@@unique([produtoId, codigo])` garante que o par identifica um tamanho. No checkout o servidor resolve `(slug, codigo)` para o registro real.

**Pedido guarda snapshots.** `ItemPedido` copia `nome`, `tamanhoRotulo`, `precoTabela` e `precoUnitario`; `Pedido.enderecoEntrega` é JSON copiado do endereço. Editar ou apagar o cadastro depois não reescreve a história do pedido. As chaves estrangeiras para `Produto`/`Tamanho` existem para relatórios, sem cascata de exclusão.

**O servidor nunca confia no preço do cliente.** `lib/carrinho.ts#calcularCarrinho` é uma função pura usada nos dois lados: o navegador a chama para exibir; o checkout (Fase 4) a chama de novo com preços, cupom e estoque lidos do banco, dentro da transação. O que o navegador enviar de preço, desconto ou total é ignorado.

**Cupons moram no banco** (`cupons`): `tipo` (`PERCENTUAL` ou `FRETE_GRATIS`), `percentual`, `validoAte`, `usosMax` e `usos`. A validação (`server/cupons.ts`) confere ativo, vigência e limite.

**Receita é um arquivo sensível.** `Receita.conteudo` (`Bytes`) guarda o arquivo no próprio banco **só na demonstração** (limite de 4 MB). Em produção, mover para armazenamento privado com URL assinada e definir prazo de retenção (LGPD: dado de saúde). `status` (`PENDENTE`, `APROVADA`, `REJEITADA`), `revisadaPor` e `revisadaEm` registram quem conferiu.

**Números de pedido legíveis.** `Pedido.numero` é `autoincrement` e único; o `id` (cuid) continua sendo a chave interna e o que aparece em URLs.

**Agregados denormalizados.** `Produto.nota`, `qtdAvaliacoes` e `vendas` são colunas, não cálculos: os cartões do catálogo precisam deles em toda listagem. Na demonstração, `nota` e `qtdAvaliacoes` vêm do seed e **não batem** com as 6 avaliações de exemplo por produto (`Avaliacao.exemplo = true`). Com avaliações reais, recalcular na gravação de cada avaliação.

**Conteúdo editorial no banco** (`especialistas`, `criadores`, `posts`) para que o painel os edite. `Post.corpo` (Markdown) fica vazio até a etapa do blog.

## Índices

`produtos(forma)` e `produtos(ativo, publicadoEm)` para listagens; `pedidos(usuarioId, criadoEm)` para "meus pedidos" e `pedidos(status)` para a fila do painel; `receitas(status, criadoEm)` para a fila de conferência; `avaliacoes(produtoId, criadoEm)`.

## Migrações

`prisma/migrations/` é versionado. Em desenvolvimento: `npm run db:migrate`. Em qualquer ambiente compartilhado ou de produção: `npm run db:deploy`, que só aplica o que já existe e nunca gera nem apaga nada.
