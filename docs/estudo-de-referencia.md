# Estudo da referência: estrutura e estilo

Análise feita em 2026-10-23 sobre a loja e o blog da marca usada como referência de estudo (vivatrue.com.br e blog.vivatrue.com.br). O objetivo foi entender **padrões de estrutura e de interface** para montar um molde genérico. Nada do conteúdo, das imagens, do logotipo ou dos textos da marca foi copiado: nome, identidade visual, arte, produtos e copy deste molde são originais.

## Como a análise foi feita

- Capturas de tela da home (desktop 1440 px e mobile 390 px), da coleção "mais vendidos" e da listagem do blog, usando Chrome em modo headless (o painel do navegador embutido era pequeno demais para capturas úteis).
- Extração de estilos computados (tipografia, cores mais usadas, raios, botões) e de variáveis CSS da página.
- A página de produto exibiu uma verificação anti-robô da Cloudflare para o robô de captura; a verificação **não foi contornada**. A estrutura dela foi lida apenas como texto, pelo navegador embutido.

## Estrutura da home (ordem das seções)

1. Barra de avisos com 4 benefícios (cashback, assinatura, frete etc.).
2. Cabeçalho em duas linhas: logotipo, busca em formato de pílula, conta, ajuda e carrinho; abaixo, botão de menu "todos os produtos" e links rápidos. Cabeçalho fixo e compacto ao rolar.
3. Hero em carrossel de banners arredondados, com setas e pontos.
4. Categorias em círculos.
5. Prateleira "mais vendidos" em carrossel, com cartões de produto.
6. Faixa promocional.
7. Grade editorial 2×2 (objetivo + chamada + imagem).
8. Slider de produto em destaque.
9. Vídeos de criadores/influenciadores com produto e botão de compra.
10. Prateleira de uma linha secundária de produtos.
11. Depoimentos de clientes em painel de cor.
12. Vitrine de médico/especialista com foto circular e citação.
13. Prateleira "recomendados para você".
14. Bloco de texto institucional e de SEO.
15. Rodapé: newsletter, colunas de links (produtos, objetivos, suporte, institucional), meios de pagamento, selos de segurança, dados legais e horário.

Elementos flutuantes: botão de cashback; pop-up de boas-vindas com desconto na primeira compra.

## Coleção e produto

- **Coleção:** título com contagem, ordenação, trilha de navegação, filtros laterais em acordeão (disponibilidade, preço, forma de apresentação, sabor), grade de 4 colunas, selos nos cartões (mais vendido, desconto, lançamento).
- **Cartão de produto:** imagem, nome, preço "de/por", nota com contagem de avaliações, preço de assinatura e botão de adicionar ao carrinho.
- **Página de produto (lida em texto):** seletores de sabor e tamanho, preço sem e com assinatura, escolha de frequência de entrega, blocos de composição por porção, seção "o que é", ingredientes, estudo/ciência, sugestão de consumo, perguntas frequentes, tabela nutricional, avaliações com filtro e perguntas e respostas.

## Blog

Cabeçalho de cor sólida com busca e botão para a loja, menu de categorias, lista de artigos (miniatura, categoria, título, resumo, data e tempo de leitura) e coluna "mais lidos".

## Estilo visual (observado)

- Plataforma: loja em Shopify com tema próprio; e-mail marketing e avaliações de terceiros.
- Cantos bem arredondados (cartões de 12 a 32 px, botões de 8 px ou em pílula), muito respiro e fundos em tons quentes bem claros.
- Uma cor de marca forte para botões e títulos, um marrom-vinho escuro para textos de destaque e um verde-limão para selos e estados secundários.
- Tipografia própria: um título em sans condensada em peso forte e um texto em sans humanista.
- Fotografia de estilo "lifestyle" (mãos, copos, rotina) e embalagem em fundo neutro.

## O que o molde adotou e o que mudou

| Padrão | No molde |
|---|---|
| Estrutura e ordem das seções da home | Mantida em linhas gerais (hero, categorias, prateleiras, editorial, criadores, depoimentos, especialista, blog, rodapé). |
| Pílula de busca, menu "todos os produtos" | Reimplementados, com sugestões de busca e menu amplo por forma e objetivo. |
| Cartão de produto com assinatura | Reimplementado; preço de assinatura calculado por regra única (`lib/site.ts`). |
| Identidade visual | **Nova**: verde-floresta, âmbar e creme; Bricolage Grotesque e Figtree. |
| Imagens | **Nenhuma** do site original. Arte vetorial própria gerada por código; troca por fotos reais prevista. |
| Produtos | **Manipulados** (cápsulas, sachês, gotas, cremes, xaropes, kits) em vez de suplementos industrializados, com a marcação "venda com receita". |
| Cashback, pop-up de desconto | Não incluídos. Cupom e frete grátis ficaram no carrinho. |
| Depoimentos e especialistas | Placeholders fictícios, sem alegações de resultado e com aviso sobre regras de publicidade. |
