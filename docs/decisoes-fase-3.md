# Decisões da Fase 3: contas e autenticação

Objetivo: cadastro, login e uma área do cliente de verdade (dados, senha, endereços, favoritos), com o catálogo público continuando estático e rápido.

## O que entrou

- **Auth.js v5** (`auth.ts`): provedor `Credentials`, sessão em JWT de 7 dias, rota `app/api/auth/[...nextauth]`.
- **`proxy.ts`** (no Next 16 o antigo `middleware.ts`): manda anônimos de `/conta`, `/admin` e `/checkout` para `/entrar?callbackUrl=…` e fecha `/admin` a quem não é `ADMINISTRADOR` ou `FARMACEUTICO`.
- **Ações de servidor** (`server/acoes/conta.ts`): `autenticar`, `cadastrar`, `sair`, `atualizarDados`, `alterarSenha`, endereços (salvar, remover, tornar principal) e favoritos (alternar, mesclar).
- **Área do cliente**: `/conta` (resumo), `/conta/pedidos`, `/conta/enderecos`, `/conta/dados`; `/favoritos` passa a persistir na conta de quem está logado.
- **Cabeçalho** com "Olá, Fulana · Minha conta" ou "Entrar ou cadastrar-se", lido da sessão sem tornar as páginas dinâmicas.

## Decisões de segurança

**O JWT identifica; o banco decide.** O token guarda `id` e `papel`, mas `usuarioAtual()` (`server/sessao.ts`) relê usuário, papel e `ativo` no banco e é o que páginas e ações usam. Se alguém for rebaixado ou desativado, o efeito é imediato, sem esperar o token expirar. O `proxy.ts` usa só o papel do token (primeira barreira, barata), e por isso é repetido, nunca único: `exigirUsuario()` em cada página e `exigirUsuarioNaAcao()` em cada Server Action. Server Actions são endpoints POST públicos; a checagem não pode ficar só em quem renderiza o formulário.

**Papel nunca vem do formulário.** `cadastrar` sempre cria `CLIENTE`. Administrador e farmacêutico nascem do seed ou do painel.

**Sem vazar quem tem conta pelo tempo de resposta.** Quando o e-mail não existe, o login compara a senha contra um hash bcrypt falso para gastar o mesmo tempo. A mensagem de erro é única ("E-mail ou senha incorretos"). O cadastro revela e-mail repetido (sem verificação por e-mail isso é inevitável); fica registrado como limitação.

**Redirecionamento aberto bloqueado.** `callbackUrl` só é aceito se começar com `/` e não com `//` nem conter `\`; qualquer outro valor cai em `/conta`. Testado com `https://evil.example/x` e `//evil.example/x`.

**Cada ação de dados do cliente filtra por `usuarioId`.** Remover endereço usa `deleteMany({ id, usuarioId })`: informar o id de outra pessoa não apaga nada. Tornar principal confere a propriedade antes.

**Limite de tentativas** (`server/limite.ts`): 8 logins por e-mail e 40 por IP a cada 15 min, 10 cadastros por IP por hora, 5 trocas de senha por usuário a cada 15 min. **Limitação conhecida:** o contador vive na memória de cada instância; na Vercel (serverless) cada instância tem o seu, então o limite real é maior e zera ao reiniciar. Serve contra automação óbvia; para limite firme, trocar por contador compartilhado (tabela no Neon ou KV) na Fase 7. O `x-forwarded-for` só é confiável atrás do proxy da plataforma.

**LGPD.** O cadastro exige aceite dos termos e da política de privacidade e grava `aceiteTermosEm`. Senhas: bcrypt custo 12, mínimo 8 e máximo 72 caracteres (limite do bcrypt).

**Fora do escopo desta fase, por escolha:** recuperação de senha e verificação de e-mail (exigem um serviço de envio; entram junto com a publicação), autenticação em dois fatores e login social.

## Decisões de arquitetura (Cache Components)

**Páginas públicas continuam estáticas.** A sessão é lida em componentes de servidor dentro de `<Suspense>` (`ContaLink`, `SessaoDoServidor`); o cabeçalho recebe esses trechos como *slots* (`conta`, `contaMobile`). O HTML estático sai do cache e só o nome do usuário chega por streaming, com esqueleto no lugar para não piscar "Entrar" a quem já está logado. Consequência: as rotas passaram de "estáticas" para "pré-renderização parcial".

**`proxy.ts` com matcher estreito** (`/conta`, `/admin`, `/checkout`): o resto do site não passa por ele.

**Favoritos.** Visitante: `localStorage`. Logado: o banco é a fonte; no primeiro carregamento autenticado `mesclarFavoritos` junta os do navegador aos da conta e devolve a lista final. Alternar um favorito é otimista (a tela muda na hora; se o servidor falhar, desfaz). Ao sair, os favoritos que vieram da conta são apagados do navegador (`favoritosDeConta`), porque o computador pode ser compartilhado. O carrinho continua no navegador até o checkout (Fase 4).

**`useActionState` e o reset de formulário do React 19.** Depois de cada ação o React limpa o formulário, e sem cuidado o usuário perderia o que digitou a cada erro. As ações devolvem `valores` (nunca senhas) e os campos usam `defaultValue`. O `<select>` precisou de `key` para remontar, senão voltava ao vazio. Esse foi o único bug real que o teste automatizado encontrou no produto.

**`/checkout` com `prefetch={false}`.** É uma rota protegida que redireciona anônimos; prefetchá-la só gerava redirecionamentos inúteis (e, em `http://localhost`, erro de console porque o CSP `upgrade-insecure-requests` tenta promover o redirecionamento a https).

## Verificação

- `tsc` e `eslint` sem erros; build de produção com o `proxy`.
- **37 verificações de conta em Chrome headless** (`auth.mjs`): redirecionamento de anônimo; senha errada com e-mail preservado; login voltando à página pedida; CEP inválido com campos preservados e máscara de CEP; criar, tornar principal e remover endereço conferindo o banco; telefone inválido e gravado só com dígitos; senha atual errada; favorito indo ao banco e aparecendo em **outro navegador**; cliente barrado em `/admin` e administrador liberado; sair limpa favoritos do navegador e volta a exigir login; dois `callbackUrl` externos neutralizados; cadastro (senhas diferentes, aceite, papel `CLIENTE`, hash `$2b$`, e-mail repetido); POST direto em `/api/auth/callback` sem token CSRF não cria sessão.
- As 55 verificações de interação do site público seguem passando (a de checkout agora confere o redirecionamento para o login).

## Próxima fase

Fase 4: checkout real. Pedido gravado em transação com baixa de estoque e `calcularCarrinho` recalculado no servidor (preços, cupom e frete lidos do banco), pagamento simulado (Pix/boleto/cartão de teste), upload de receita para a fila de conferência e "Meus pedidos" com detalhe e acompanhamento.
