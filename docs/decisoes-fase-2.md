# Decisões da Fase 2: banco de dados e camada de leitura

Objetivo: tirar o catálogo de arquivos TypeScript e passá-lo para um banco de verdade, sem mudar a aparência do site e deixando a fonte dos dados trocável (a Shopify entra na Fase 8).

## O que mudou

| Antes | Depois |
|---|---|
| `data/produtos.ts`, `data/conteudo.ts` importados por páginas e componentes | Viraram **fonte do seed** em `prisma/dados/`; a aplicação lê do Postgres |
| Cupons em `lib/site.ts` | Tabela `cupons`, validada por Server Action |
| Carrinho calculado com o catálogo estático | `calcularCarrinho(itens, cupom, catalogo)`: o catálogo vem como argumento |
| Componentes importavam o catálogo | Recebem por props (servidor) ou por `CatalogoContext` (cliente) |

## Decisões

**Um único ponto de leitura: `server/catalogo.ts`.** Páginas e componentes recebem os tipos de `lib/types.ts` (`Produto`, `ProdutoResumo`, `Especialista`…) e não conhecem o Prisma. Trocar para a Shopify é reimplementar esse arquivo com a Storefront API mantendo as assinaturas (`getCatalogo`, `getProduto`, `getAvaliacoes`…).

**`ProdutoResumo` x `Produto`.** O resumo (cartões, busca, carrinho, filtros) viaja inteiro para o navegador via `CatalogoProvider` no layout: são 22 itens e poucos KB, o que mantém busca, filtros e carrinho instantâneos e sem ida ao servidor. O conteúdo longo (descrição, tabela nutricional, FAQ) só é carregado na página do produto. `ingredientes` está no resumo porque a busca também procura por ingrediente.

**Cache Components com `use cache`.** Cada função de leitura usa `'use cache'`, `cacheLife('hours')` e `cacheTag('catalogo')`. As páginas continuam pré-renderizadas (57 rotas estáticas) e o Postgres só é consultado no build e na revalidação. Mutações do painel (Fase 5) chamam `updateTag('catalogo')` para refletir na hora. Efeito colateral aceito: o `next build` precisa alcançar o banco.

**Driver conforme o ambiente.** `server/cliente-prisma.ts` escolhe o adaptador pelo host de `DATABASE_URL`: `*.neon.tech` usa o driver serverless por WebSocket (`@prisma/adapter-neon`), qualquer outro usa `pg` (`@prisma/adapter-pg`). O seed reutiliza a mesma fábrica. `server/prisma.ts` (com `server-only`) é o singleton da aplicação.

**Prisma 7.10.1 fixado.** O `latest` do npm era a versão 8.0.0 candidata; a 7.x mantém a configuração por `prisma.config.ts` (URL do datasource fora do `schema.prisma`). A URL de migração é a **direta** (`DIRECT_URL`); a de execução é a **pooled** (`DATABASE_URL`). No Prisma 7, `migrate dev` não roda `generate` sozinho: rode `npx prisma generate` depois de mudar o schema (o `postinstall` cobre instalações novas).

**Seed idempotente e com trava.** `npm run db:seed` usa `upsert` (produtos, tamanhos, especialistas, criadores, posts, cupons, usuários) e recria apenas as avaliações marcadas `exemplo`. Recusa-se a rodar com as senhas de desenvolvimento em um banco que não seja local.

**Cupom validado no servidor.** `validarCupomAction` só informa que o cupom existe e o quanto vale; o navegador guarda esse resultado para exibição. O desconto de verdade é recalculado no checkout (Fase 4). O estado do navegador mudou de formato (`cupom` agora é objeto), então a chave do `localStorage` subiu para `v2`.

**Mudança de migração sem apagar o banco.** Ao acrescentar `Produto.ordem` e a relação `Receita.revisadaPor` depois da primeira migração, o `prisma migrate reset` exigiria consentimento explícito para destruir dados. Em vez de contornar a trava, a migração `init` foi regenerada a partir do schema anterior (checksum conferido contra o registrado no banco) e a mudança entrou como migração incremental `ordem_e_revisao`.

## Verificação

- `tsc --noEmit` e `eslint` sem erros.
- `next build`: 57 páginas, todas estáticas ou com prerender parcial, lendo do Postgres local.
- 55 verificações de interação em Chrome headless contra `next start` (carrinho, **cupom validado pelo servidor**, busca, filtros, produto, frete, checkout, formulários, rotas, mobile).
- 300 requisições RSC concorrentes ao servidor: 0 falhas, máximo de 566 ms.

## Armadilhas registradas

- Em páginas com muitos `<Link>` (prefetch parcial), o `waitUntil: 'networkidle2'` do Puppeteer não estabilizava no emulador mobile, embora o servidor respondesse em milissegundos (verificado com `curl` e carga concorrente). Os testes usam `waitUntil: 'load'` mais uma pausa curta.
- O `ProdutoResumo` carrega `ingredientes` só por causa da busca; se o catálogo crescer para centenas de itens, mover a busca para o servidor (rota ou Server Action) e tirar o catálogo inteiro do cliente.

## Próxima fase

Fase 3: Auth.js v5 (Credentials + JWT), `proxy.ts` protegendo `/conta` e `/admin`, cadastro e login reais, área do cliente e favoritos persistidos para quem está logado (mesclando os do navegador no primeiro login).
