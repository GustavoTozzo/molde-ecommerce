# Decisões da Fase 5: painel administrativo

Objetivo: dar à equipe da farmácia o que ela precisa para operar a loja: conferir receitas, tocar pedidos até a entrega, manter catálogo, estoque e cupons, responder mensagens e administrar acessos.

## O que entrou

| Área | Quem acessa | O que faz |
|---|---|---|
| Visão geral | equipe | Contadores (receitas a conferir, em preparo, aguardando pagamento etc.) e estoque baixo |
| Pedidos | equipe | Lista com filtro por situação e busca (nº, nome, e-mail); detalhe com ações e histórico |
| Receitas | equipe | Fila (mais antigas primeiro): abrir arquivo, aprovar ou recusar com motivo |
| Mensagens | equipe | Mensagens do formulário de contato, lidas/não lidas, total da newsletter |
| Produtos e estoque | administrador | Cadastro e edição completos, ajuste rápido de estoque, ocultar da loja |
| Cupons | administrador | Criar, ativar e desativar |
| Usuários | administrador | Buscar, mudar papel, bloquear, adicionar pessoas da equipe |

Também saíram do papel: o formulário de **contato** e a **newsletter** agora gravam no banco (antes só simulavam), e o cliente pode **reenviar a receita** depois de uma recusa.

## Decisões

**Papéis em três camadas.** `FARMACEUTICO` cuida de pedidos, receitas e mensagens; `ADMINISTRADOR` faz tudo. A barreira é aplicada em três lugares, e nenhum deles é o único: (1) `proxy.ts` manda anônimos ao login e bloqueia `/admin` a quem não é da equipe; (2) cada página chama `exigirEquipe(destino, papéis)`, que confere o papel **no banco**; (3) cada Server Action chama `exigirEquipeNaAcao(papéis)`. Server Actions são endpoints públicos, então a checagem fica na ação e não no botão. O menu esconde o que o papel não pode usar, mas isso é só aparência; testes confirmam que a farmacêutica é redirecionada em `/admin/produtos`, `/admin/cupons` e `/admin/usuarios`.

**Trilha de auditoria do pedido** (`EventoPedido`). Pedido criado, pagamento aprovado/confirmado, receita anexada/aprovada/recusada, liberado para preparo, enviado (com rastreio), entregue e cancelado ficam registrados com data e **quem** agiu. Aparece no detalhe do pedido da equipe (com o nome) e para o cliente (sem o nome). Numa farmácia de manipulação, saber quem liberou uma fórmula é rastreabilidade, não enfeite.

**Fluxo da receita.** A farmacêutica abre o arquivo (a rota `/api/receitas/[id]` já restringe a dono e equipe), e:
- **aprova**: pedidos pagos que esperavam por ela vão para preparo; se o pedido ainda não foi pago, aprovar a receita **não dispensa o pagamento** (ao pagar, vai direto para preparo);
- **recusa** com motivo obrigatório (5 a 300 caracteres): o pedido fica parado, o cliente vê o motivo e um formulário para enviar outro arquivo, e a nova receita volta para a fila.

A revisão é um `UPDATE … WHERE status = 'PENDENTE'`: se duas pessoas abrirem a mesma receita, só a primeira decisão vale.

**Transições de pedido controladas no servidor.** Enviar só vale para pedido `EM_PREPARO` (não se envia o que não foi pago nem a receita não conferida), entregar só para `ENVIADO`, e a equipe cancela até `EM_PREPARO` (estoque volta, pagamento é estornado, uso do cupom devolvido, assinaturas encerradas). Depois de enviado, só devolução. Todas usam `updateMany` com o status esperado, então clicar duas vezes ou duas pessoas ao mesmo tempo não repete efeitos. Código de rastreio: 5 a 30 letras, números ou hífen, gravado em maiúsculas.

**Catálogo com leitura do próprio autor.** Cada gravação do painel chama `updateTag("catalogo")` (e a etiqueta do produto). Teste: depois de salvar um preço, home, catálogo, página do produto e filtros já mostram o valor novo na primeira leitura. Preços entram como texto em reais ("51,90", "R$ 1.234,56") e viram centavos inteiros (`parseReais`); entrada inválida é recusada sem tocar no valor antigo. O produto novo recebe slug único (acréscimo `-2`, `-3` se repetir), arte e cores derivadas da forma farmacêutica, e FAQ padrão. Produto não é apagado (pedidos o referenciam): oculta-se da loja. Tamanho também não é apagado: zera-se o estoque.

**Proteções contra se trancar para fora.** Ninguém altera o próprio papel nem se bloqueia; e a loja nunca fica sem administrador ativo (rebaixar ou bloquear o último é ignorado). Bloquear tem efeito imediato porque `usuarioAtual()` confere `ativo` no banco a cada página e ação: o usuário bloqueado não entra, e quem foi rebaixado perde o painel na hora, sem esperar o token expirar.

**Mensagens de visitantes são texto puro.** O conteúdo vem de qualquer pessoa na internet; é exibido como texto (o React escapa) com quebras de linha preservadas, nunca como HTML. Contato e newsletter são validados de novo no servidor e limitados por IP; repetir um e-mail já inscrito devolve sucesso (o formulário não serve para descobrir quem está na lista).

## Dois problemas reais que os testes acharam

**1. `params` fora de `<Suspense>` quebrava a regeneração em produção.** As páginas `/produtos/[slug]`, `/blog/[slug]`, `/especialistas/[slug]` e `/institucional/[slug]` liam `await props.params` no topo. No build passava (os endereços vinham do `generateStaticParams`), mas em produção, ao invalidar o cache ou abrir um endereço que não estava na lista (um produto recém-cadastrado), o Next acusava `NEXT_STATIC_GEN_BAILOUT` / "uncached or runtime data during prerendering" e o produto novo dava erro 500. Correção, conforme o guia de ISR do Next: o componente raiz da página não é `async`; ele passa `props.params` para um componente interno dentro de `<Suspense>` (com esqueleto) e é lá que se faz o `await`. Com isso, um produto novo aparece na hora (o esqueleto sai e a página completa é gerada e guardada). Consequência aceita: um endereço inexistente mostra a página "não encontrada" com status 200 (o Next não consegue mudar o status depois de começar a enviar), com `noindex`.

**2. O Auth.js gera um valor aleatório a cada leitura de sessão.** `auth()` cria um token CSRF (`crypto.getRandomValues`) mesmo só para ler a sessão, e o Next, ao pré-renderizar, recusa valor aleatório: o log do servidor se enchia de "unstable value crypto.getRandomValues() while prerendering" em quase todas as rotas (que têm o cabeçalho com a sessão). Correção: `await connection()` no início de `usuarioAtual()`, declarando que a leitura da sessão é por requisição. Depois disso, 0 ocorrências no log de produção durante todas as suítes.

## Limitações conhecidas

- **Sem e-mail transacional.** Cliente e equipe não recebem aviso por e-mail (pedido recebido, receita recusada, enviado). O acompanhamento é pela página do pedido. Recuperação de senha também depende disso (Fase 7).
- **Trilha de auditoria só para pedidos.** Alterações de preço, estoque, cupom e papéis de usuário não ficam registradas (apenas o resultado). Numa operação real, um log geral de ações administrativas faria falta.
- **Estoque sem histórico de movimentações** (só o saldo). Entradas de mercadoria e ajustes manuais não deixam rastro.
- **Imagens:** os produtos usam a arte gerada em `lib/art.ts`; não há upload de foto. FAQ e galeria do produto não são editáveis no painel (o produto novo nasce com FAQ padrão).
- **Mensagens** podem ser marcadas como lidas, mas não respondidas pelo painel (a resposta é por e-mail ou WhatsApp).
- **Assinaturas** continuam sem rotina que gere os pedidos recorrentes (Fase 8).
- Um administrador pode criar contas da equipe com senha inicial; a pessoa deve trocá-la em Minha conta (não há forçar troca no primeiro acesso).

## Verificação

- `tsc` e `eslint` sem erros; build de produção com 0 erros de pré-renderização no log do servidor.
- **24 testes de integração** (`npm run test`): os 19 anteriores mais envio, entrega, aprovação, recusa, reenvio, pagamento antes/depois da aprovação e cancelamento pela equipe.
- **66 verificações do painel no navegador** (`admin.mjs`): controle de acesso por papel (anônimo, cliente, farmacêutica, administrador), lista/filtro/busca de pedidos, fila de receitas (motivo inválido, recusa, reenvio pelo cliente, aprovação), pagamento, rastreio inválido e válido, entrega, cancelamento com estorno, contato e newsletter de visitante até o painel, edição de preço refletida na vitrine, preço inválido recusado, ajuste rápido de estoque, produto novo (slug, arte, vitrine, ocultar), cupons (criar, repetido, usar, desativar) e usuários (criar, bloquear, rebaixar, perda de acesso imediata).
- Suítes anteriores verdes: 55 do site público, 37 de conta, 35 de checkout.
- Nos testes, o banco é restaurado ao final (pedidos, usuários, produtos, cupons, estoque, papéis e sequência do número do pedido).

## Próxima fase

Fase 6: levar os testes de navegador para dentro do repositório (hoje as suítes de navegador moram fora dele), com CI no GitHub Actions rodando lint, tipos, build e testes contra um Postgres de serviço; revisar acessibilidade e desempenho (Lighthouse) das telas novas.
