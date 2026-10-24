# Casa Magistral: molde de e-commerce de produtos manipulados

Loja online para uma **farmácia de manipulação**, construída como aplicação de verdade: front-end completo (home, catálogo, produto, carrinho, assinatura, especialistas, blog, institucionais) sobre **Next.js 16 + PostgreSQL (Prisma)**, com conta de usuário, checkout com pagamento simulado, fila de receitas e painel administrativo nas fases seguintes.

> **Todo o conteúdo é fictício** (marca, produtos, preços, pessoas, avaliações, dados legais) e o **pagamento é simulado**: nenhum dado financeiro real é coletado. O site fica com `noindex`. Antes de operar de verdade, veja [Antes de publicar](#antes-de-publicar).

Estudo que originou o layout: [`docs/estudo-de-referencia.md`](docs/estudo-de-referencia.md). Nada do site de referência foi copiado.

## Status

- [x] **Fase 1** — Front-end do molde com dados estáticos (estudo de referência, design system, 57 páginas)
- [x] **Fase 2** — Banco de dados e camada de leitura (Prisma + Postgres, seed, repositório com `use cache`) — decisões em [`docs/decisoes-fase-2.md`](docs/decisoes-fase-2.md)
- [ ] **Fase 3** — Contas e autenticação (Auth.js, cadastro, login, área do cliente, favoritos persistidos)
- [ ] **Fase 4** — Checkout real (pedido em transação, estoque, cupons no servidor, pagamento simulado, upload de receita)
- [ ] **Fase 5** — Painel administrativo (produtos, pedidos, fila de receitas, cupons, mensagens)
- [ ] **Fase 6** — Formulários persistidos, testes automatizados e CI
- [ ] **Fase 7** — Publicação (GitHub, Neon, Vercel)
- [ ] **Fase 8** — Preparação para migrar o catálogo e o checkout para a Shopify

## Como rodar

Requer Node.js 20.9+ e um PostgreSQL 16 local (a porta 5440 evita conflito com instalações existentes).

```bash
# 1. banco local (Docker)
docker run --name casa-magistral-db -e POSTGRES_USER=casa -e POSTGRES_PASSWORD=casa -e POSTGRES_DB=casa_magistral -p 5440:5432 -d postgres:16

# 2. dependências e variáveis
npm install                    # roda `prisma generate` no postinstall
cp .env.example .env           # gere o AUTH_SECRET como indicado no arquivo

# 3. tabelas e dados de demonstração
npm run db:deploy              # aplica as migrações
npm run db:seed                # catálogo, conteúdo, cupons e 3 usuários de desenvolvimento

# 4. aplicação
npm run dev                    # http://localhost:3000
npm run build && npm run start
npm run typecheck && npm run lint
```

Comandos úteis: `npm run db:migrate` (cria migração a partir de mudanças no `schema.prisma`), `npm run db:studio` (navegador de dados), `npm run db:seed` (idempotente: pode rodar de novo sem duplicar nada).

> O Next.js 16 mudou convenções em relação às versões anteriores (`params` assíncrono, Cache Components, `proxy.ts` no lugar de `middleware.ts`). Antes de alterar rotas, leia o `AGENTS.md` e a documentação em `node_modules/next/dist/docs/`.

### Usuários de desenvolvimento

Criados por `npm run db:seed` com os valores de `.env` (padrões em `.env.example`): `ADMINISTRADOR`, `FARMACEUTICO` e `CLIENTE`. São credenciais **só de desenvolvimento**: o seed se recusa a usar as senhas padrão em um banco que não seja local.

## O que já funciona

- **Catálogo vindo do banco:** 22 produtos com tamanhos, sabores, tabela nutricional, FAQ, avaliações de exemplo, especialistas, criadores e posts, lidos por um repositório com cache (`server/catalogo.ts`).
- **Cabeçalho:** barra de avisos, busca com sugestões e teclado (combobox), menu amplo, menu lateral no mobile, contador do carrinho e favoritos.
- **Home:** hero em carrossel, categorias, prateleiras, banners, vídeos de criadores, depoimentos, especialista em destaque, blog, história e FAQ.
- **Catálogo (`/produtos`):** filtros por forma, objetivo, preço, receita e oferta; ordenação; busca tolerante a acentos (nome, forma, objetivo e ingrediente); filtros na URL.
- **Produto (`/produtos/[slug]`):** galeria, tamanho e sabor, compra única ou assinatura, simulação de frete, aviso de venda com receita, tabela nutricional, avaliações, relacionados e JSON-LD.
- **Carrinho:** gaveta e página `/carrinho`; **cupom validado no servidor** (tabela `cupons`); barra de frete grátis; anexo de receita (ainda simulado até a Fase 4).
- **Acessibilidade e segurança:** link "pular para o conteúdo", foco visível, `aria-*`, cabeçalhos HTTP (CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

Verificação da Fase 2: build de produção (57 páginas lendo do Postgres), `tsc` e `eslint` sem erros, e 55 verificações de interação em Chrome headless.

## Estrutura

```
app/                  rotas (App Router)
components/           layout, home, produto, catalogo (+ CatalogoContext), carrinho, ui, ...
data/                 taxonomia, conteúdo editorial estático (FAQ/depoimentos), institucional
lib/                  tipos, site.ts (marca e regras), store.ts (carrinho no navegador),
                      carrinho.ts (cálculo puro, usado no cliente e no servidor), catalogo.ts (busca/filtros)
server/               prisma.ts (singleton), cliente-prisma.ts (fábrica), catalogo.ts (leitura com cache),
                      cupons.ts, acoes/ (Server Actions)
prisma/               schema.prisma, migrations/, seed.ts, dados/ (fonte do seed)
docs/                 estudo da referência, modelagem de dados, decisões por fase
```

## Como adaptar a marca

1. **Nome, contatos e dados legais:** `lib/site.ts` (cabeçalho, rodapé, contato e regras de frete, parcelas e assinatura).
2. **Cores e fontes:** variáveis em `app/globals.css` (`@theme`) e fontes em `app/layout.tsx`.
3. **Produtos e conteúdo:** hoje em `prisma/dados/` (alimenta o `npm run db:seed`); no painel administrativo (Fase 5) passam a ser editados pelo navegador. Preços em **centavos**.
4. **Imagens:** a arte é gerada em `lib/art.ts`. Para fotos reais, troque `ProductArt` e `Avatar` por `next/image`.
5. **Textos institucionais e FAQ:** `data/institucional.ts` e `data/conteudo.ts`.

## O que é real e o que ainda é simulado

| Tema | Hoje | Fase |
|---|---|---|
| Catálogo, conteúdo, cupons | Banco Postgres, leitura com cache | 2 (pronto) |
| Conta e login | Formulário simulado | 3 |
| Favoritos | localStorage | 3 |
| Pedidos, estoque, totais | Confirmação simulada no navegador | 4 |
| Pagamento | Simulado (Pix, boleto e cartão fictícios) | 4 |
| Receita | Guarda só o nome do arquivo | 4 (upload) e 5 (conferência) |
| Frete | Simulação por região do CEP | pós-Shopify / transportadora |
| Avaliações | Exemplos marcados como fictícios | 6 |

## Fora do escopo

- **Fluxo de manipulação personalizada** (envio de receita, orçamento e calculadora): há apenas a faixa "em breve" e o contato com assunto pré-selecionado.
- **Artigos do blog:** a listagem e o modelo de página existem; os textos vêm depois.
- **Venda real:** requer validação farmacêutica e jurídica (abaixo).

## Antes de publicar

Este projeto não é validação jurídica nem farmacêutica. Revise com o farmacêutico responsável e com assessoria jurídica:

- razão social, CNPJ, endereço, responsável técnico e autorizações (Anvisa/Vigilância Sanitária);
- textos de produto (evite promessas de cura ou de resultado; publicidade de medicamentos, suplementos e serviços de saúde tem regras próprias);
- uso de depoimentos, fotos e nomes de profissionais (autorização e regras do conselho de classe);
- política de privacidade (LGPD; dados de receita são sensíveis), trocas e devoluções;
- venda de itens que exijam receita e exclusão de substâncias de controle especial (Portaria SVS/MS 344/1998);
- troca de **todas** as senhas de seed e remoção do `noindex` em `app/layout.tsx` quando a marca real estiver configurada.

## Design no Figma

Arquivo com fundamentos, biblioteca de arte vetorial e componentes: https://www.figma.com/design/olzWPgXxWXG6wpysrExMYS. As telas completas não foram desenhadas porque o limite do plano gratuito foi atingido; as telas finais estão no código.
