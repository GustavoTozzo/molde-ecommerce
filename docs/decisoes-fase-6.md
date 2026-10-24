# Decisões da Fase 6: testes dentro do repositório, CI e acessibilidade

Objetivo: tirar a verificação das mãos (scripts soltos fora do repositório) e deixá-la repetível por qualquer pessoa e pelo CI, e acrescentar acessibilidade automatizada.

## O que entrou

| Camada | Ferramenta | Arquivos | Testes |
|---|---|---|---|
| Integração (lógica do pedido) | `node --test` + `tsx`, contra o Postgres | `tests/pedidos.test.ts`, `tests/limite.test.ts` | 28 |
| Ponta a ponta | Playwright (`npm run test:e2e`) | `tests/e2e/*.spec.ts` | 75 + 3 de sessão + 1 de limpeza |
| Acessibilidade | `@axe-core/playwright` (WCAG 2.0/2.1/2.2, A e AA) | `tests/e2e/acessibilidade.spec.ts` | 25 páginas |
| Integração contínua | GitHub Actions | `.github/workflows/ci.yml` | tipos, lint, build, tudo acima |

Cobertura ponta a ponta: **público** (home, catálogo, busca, produto, carrinho e cupom, newsletter, contato, rotas protegidas, 404), **celular** (sem rolagem horizontal em 8 rotas, menu lateral, barra de compra), **conta** (cadastro, login, `callbackUrl` externo, dados e senha, bloqueio, endereços, favoritos entre navegadores, logout), **checkout** (Pix com cupom, cancelamento, cartão sem enviar o número, recusa, receita falsa/grande/válida, acesso à receita por papel, estoque, carrinho adulterado) e **painel** (papéis, fila de receitas completa, pedido de ponta a ponta, cancelamento pela equipe, preço refletido na vitrine, produto novo, cupons, usuários).

## Decisões

**Estado do banco como parte do teste.** A suíte escreve no banco, então: (1) `ajudantes.ts` **recusa** rodar contra qualquer banco que não seja local ou de CI; (2) `resetar()` volta ao estado do seed antes de cada teste (pedidos, receitas, usuários `teste.*`, produtos `produto-teste-*`, cupons, estoque, preço e visibilidade do produto que o painel edita, papéis das contas do seed, filas de contato e newsletter, número do pedido); (3) um projeto `limpeza` repete isso no fim, para não deixar sobras. Os testes rodam em série (`workers: 1`) porque dividem o mesmo banco.

**Sessão por papel, uma vez.** `auth.setup.ts` entra como cliente, farmacêutica e administrador e salva o estado em `tests/e2e/.auth/` (ignorado pelo Git). Os testes reaproveitam. Além de rápido, evita esbarrar no limite de tentativas de login por e-mail. Um detalhe que custou um teste: **contextos novos (`browser.newContext()`) herdam o `storageState` do teste**; para representar um visitante é preciso passar `{ cookies: [], origins: [] }` explicitamente.

**Cache do catálogo e alterações feitas direto no banco.** Alguns testes preparam o cenário gravando no banco (preço, produto oculto), por fora do app, e o cache de leitura da vitrine (1 hora) não sabe. Em vez de esperar o cache vencer, `resetar()` chama `POST /api/revalidar`, uma rota que só existe quando `REVALIDATE_SECRET` está definido (404 caso contrário), compara o segredo em tempo constante e usa `revalidateTag("catalogo", { expire: 0 })`. Isso também é o ponto de entrada natural de um webhook quando o catálogo vier da Shopify (Fase 8).

**Carrinho semeado antes da página carregar.** O estado do navegador (carrinho, favoritos) é persistido por inteiro a cada mudança, inclusive na sincronização de favoritos logo depois do login. Escrever no `localStorage` depois da página carregada fazia o app sobrescrever o que o teste tinha colocado. `colocarNoCarrinho` usa um `addInitScript` de uso único: escreve antes do próximo carregamento.

**Next 16 mantém a tela anterior montada e escondida** (`Activity`). Depois de uma navegação, seletores por atributo como `[name="ativo"]` encontram o campo da tela antiga também; os testes usam `:visible` ou papéis acessíveis (que ignoram o que está escondido).

**Limitador de tentativas e a suíte.** O limite em memória (cadastro, login, compra) barrava a própria suíte, que cria dezenas de contas em minutos. `LIMITES_RELAXADOS=1`, definido **só** pelo `playwright.config.ts`, multiplica os limites por 50. O comportamento do limitador é coberto à parte, sem esse atalho, em `tests/limite.test.ts` (janela, isolamento entre chaves, expiração). A variável está documentada em `.env.example` com o aviso de nunca usá-la em produção.

**Chrome local, Chromium no CI.** Localmente o Playwright usa o Google Chrome já instalado (`channel: "chrome"`), sem baixar navegador; no CI, `npx playwright install --with-deps chromium`.

**CI.** Um job: Postgres 16 como serviço, `prisma migrate deploy`, seed, tipos, lint, integração, **build** (o Next lê o catálogo do banco ao compilar), Chromium, Playwright. Em falha, o relatório e os traces viram artefato. As credenciais do job são valores só de CI para um banco descartável.

## O que a acessibilidade automática achou (e foi corrigido)

O axe reprovou 4 das primeiras 25 páginas; as correções valem para o site todo:

1. **`aria-label` em `<span>` sem papel** nos contadores animados da história da marca (proibido pela ARIA): o valor final passou a ser texto só para leitor de tela (`sr-only`) e o número animado fica `aria-hidden`.
2. **Contraste insuficiente** em dois textos claros sobre fundo verde (`text-white/55` e `/60`): subiram para 80%.
3. **Alvo de toque pequeno** nos pontos do carrossel (WCAG 2.5.8, 24 px): o botão passou a ter 24 px de área e o ponto desenhado continua pequeno dentro dele.
4. **Lista de definição inválida** no resumo do pedido (carrinho, checkout) e no simulador de assinatura: havia um `<p>` e um `<div>` soltos dentro do `<dl>`. Foram para fora dele.

Depois disso as 25 páginas (públicas, da conta e do painel, incluindo o checkout com o cartão aberto) passam sem violações A/AA detectáveis por máquina. **Isto não substitui** teste com leitor de tela, navegação só por teclado e revisão humana de textos alternativos e foco.

## Um bug de produto achado pelos testes

Clicar no coração de um produto logo depois de abrir a página (antes de a sincronização com a conta responder) alterava só o navegador; quando a resposta chegava, a lista do servidor **sobrescrevia** o clique. Agora os cliques feitos entre o envio do instantâneo e a resposta são reaplicados sobre a lista do servidor e enviados à conta (`alternadosDuranteSincronizacao`, em `lib/store.ts`). A sincronização também deixou de lançar erro quando a sessão acaba no meio do caminho (por exemplo, saída em outra aba): devolve `null` e o navegador não mexe nos favoritos.

## Limitações

- O CI **ainda não rodou no GitHub** (o repositório não tem remoto). O fluxo foi escrito a partir do que a suíte exige localmente; o primeiro push provavelmente pede um ajuste fino.
- Cobertura mobile é de layout e menu; o checkout e o painel não são exercitados em tela pequena.
- Sem teste de desempenho (Lighthouse) nem de carga; o limitador em memória não é testado em ambiente com várias instâncias.
- No Windows, o processo do Playwright imprime uma asserção do libuv ao encerrar (`UV_HANDLE_CLOSING`); não afeta o resultado nem o código de saída.
- E-mail transacional e recuperação de senha seguem fora do escopo (dependem de um serviço de envio).

## Verificação

`tsc` e `eslint` sem erros; build de produção sem erros de pré-renderização; **28 testes de integração** e **79 do Playwright (3 de sessão, 75 de especificação, 1 de limpeza) passando** em ~3 min contra o Postgres local.

## Próxima fase

Fase 7, publicação: repositório no GitHub (CI de verdade), banco na Neon (`DATABASE_URL` pooled + `DIRECT_URL`), projeto na Vercel (**sem** `AUTH_URL`), troca de **todas** as senhas de seed e do `AUTH_SECRET`, e decisão sobre e-mail transacional. Depende de contas e URLs que são suas.
