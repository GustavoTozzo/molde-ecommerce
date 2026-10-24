import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  CRED,
  comprarPelaTela,
  db,
  ESTADO_AUTH,
  estoqueDe,
  itemComReceita,
  MAGNESIO,
  PDF_VALIDO,
  resetar,
  SENHA,
} from "./ajudantes";

async function comoPapel(browser: Browser, papel: keyof typeof ESTADO_AUTH): Promise<{ page: Page; fechar: () => Promise<void> }> {
  const ctx = await browser.newContext({ storageState: ESTADO_AUTH[papel] });
  return { page: await ctx.newPage(), fechar: () => ctx.close() };
}

const lado = (page: Page) => page.getByRole("navigation", { name: "Painel administrativo" });

test.describe("painel: acesso por papel", () => {
  test.beforeEach(resetar);

  test("farmacêutica vê só o que lhe cabe; produtos, cupons e usuários voltam para a conta", async ({ browser }) => {
    const { page, fechar } = await comoPapel(browser, "farmaceutica");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
    await expect(lado(page).getByRole("link")).toHaveText(["Visão geral", "Pedidos", "Receitas", "Mensagens"]);
    for (const rota of ["/admin/produtos", "/admin/produtos/novo", "/admin/cupons", "/admin/usuarios"]) {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/conta$/);
    }
    await fechar();
  });

  test("administrador vê o menu completo", async ({ browser }) => {
    const { page, fechar } = await comoPapel(browser, "admin");
    await page.goto("/admin");
    await expect(lado(page).getByRole("link")).toHaveText(["Visão geral", "Pedidos", "Receitas", "Mensagens", "Produtos e estoque", "Cupons", "Usuários"]);
    await fechar();
  });

  test("a conta da equipe mostra o atalho para o painel; a do cliente não", async ({ browser }) => {
    const equipe = await comoPapel(browser, "farmaceutica");
    await equipe.page.goto("/conta");
    await expect(equipe.page.getByRole("link", { name: "Ir para o painel da loja" })).toBeVisible();
    await equipe.fechar();
    const cliente = await comoPapel(browser, "cliente");
    await cliente.page.goto("/conta");
    await expect(cliente.page.getByRole("link", { name: "Ir para o painel da loja" })).toHaveCount(0);
    await cliente.fechar();
  });
});

test.describe("painel: receitas e pedidos", () => {
  test.beforeEach(resetar);

  test("receita recusada com motivo, reenvio pelo cliente, aprovação e liberação do pedido", async ({ browser }) => {
    const cliente = await comoPapel(browser, "cliente");
    const equipe = await comoPapel(browser, "farmaceutica");
    const pedidoId = await comprarPelaTela(cliente.page, { itens: [await itemComReceita()], forma: "Cartão de crédito", receita: true });
    const primeira = (await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })).receitaId!;

    await equipe.page.goto("/admin/receitas");
    await expect(equipe.page.getByText(`Pedido nº 1`)).toBeVisible();
    const arquivo = await equipe.page.request.get(`/api/receitas/${primeira}`);
    expect(arquivo.status()).toBe(200);

    // motivo curto demais
    await equipe.page.getByLabel("Motivo da recusa").fill("ruim");
    await equipe.page.getByRole("button", { name: "Recusar receita" }).click();
    await expect(equipe.page.getByText("mínimo 5 letras")).toBeVisible();
    await equipe.page.getByLabel("Motivo da recusa").fill("Imagem ilegível, envie outra foto");
    await equipe.page.getByRole("button", { name: "Recusar receita" }).click();
    await expect(equipe.page.getByRole("heading", { name: "Conferidas recentemente" })).toBeVisible();
    await expect(equipe.page.getByText("Motivo: Imagem ilegível, envie outra foto")).toBeVisible();

    const recusada = await db.receita.findUniqueOrThrow({ where: { id: primeira }, include: { revisadaPor: true } });
    expect([recusada.status, recusada.observacao, recusada.revisadaPor?.email]).toEqual(["REJEITADA", "Imagem ilegível, envie outra foto", CRED.farmaceutica.email]);
    expect((await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })).status).toBe("AGUARDANDO_RECEITA");

    // o cliente vê o motivo e reenvia
    await cliente.page.goto(`/conta/pedidos/${pedidoId}`);
    await expect(cliente.page.getByText("Receita não aprovada").first()).toBeVisible();
    await expect(cliente.page.getByText("Observação do farmacêutico: Imagem ilegível, envie outra foto")).toBeVisible();
    await cliente.page.getByLabel(/Enviar outra receita/).setInputFiles(PDF_VALIDO);
    await cliente.page.getByRole("button", { name: "Enviar nova receita" }).click();
    // enquanto envia, o botão muda de nome ("Enviando…"): confere o resultado no banco e na tela
    await expect.poll(async () => (await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })).receitaId).not.toBe(primeira);
    expect((await db.receita.findFirstOrThrow({ where: { id: (await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })).receitaId! } })).status).toBe("PENDENTE");
    await expect(cliente.page.getByText("Receita não aprovada", { exact: true })).toHaveCount(0);
    await expect(cliente.page.getByRole("button", { name: "Enviar nova receita" })).toHaveCount(0);

    // a farmacêutica aprova e o pedido pago entra em preparo
    await equipe.page.goto("/admin/receitas");
    await equipe.page.getByRole("button", { name: "Aprovar receita" }).click();
    await expect(equipe.page.getByText("Nenhuma receita aguardando conferência")).toBeVisible();
    expect((await db.pedido.findUniqueOrThrow({ where: { id: pedidoId } })).status).toBe("EM_PREPARO");
    await cliente.page.reload();
    await expect(cliente.page.getByText("Em preparo").first()).toBeVisible();
    await cliente.fechar();
    await equipe.fechar();
  });

  test("pedido de ponta a ponta: pagamento, envio com rastreio, entrega e histórico", async ({ browser }) => {
    const cliente = await comoPapel(browser, "cliente");
    const equipe = await comoPapel(browser, "farmaceutica");
    const pix = await comprarPelaTela(cliente.page, { itens: [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }], forma: "Pix" });

    await equipe.page.goto(`/admin/pedidos/${pix}`);
    await expect(equipe.page.getByText("Aguardando pagamento").first()).toBeVisible();
    await equipe.page.getByRole("button", { name: "Marcar pagamento como recebido" }).click();
    await expect(equipe.page.getByRole("textbox", { name: "Código de rastreio" })).toBeVisible();
    expect((await db.pedido.findUniqueOrThrow({ where: { id: pix } })).status).toBe("EM_PREPARO");

    await equipe.page.getByLabel("Código de rastreio").fill("abc");
    await equipe.page.getByRole("button", { name: "Marcar como enviado" }).click();
    await expect(equipe.page.getByText("5 a 30 letras")).toBeVisible();
    await equipe.page.getByLabel("Código de rastreio").fill("br123456789br");
    await equipe.page.getByRole("button", { name: "Marcar como enviado" }).click();
    await expect(equipe.page.getByRole("button", { name: "Marcar como entregue" })).toBeVisible();
    expect((await db.pedido.findUniqueOrThrow({ where: { id: pix } })).codigoRastreio).toBe("BR123456789BR");

    await cliente.page.goto(`/conta/pedidos/${pix}`);
    await expect(cliente.page.getByText("BR123456789BR", { exact: true })).toBeVisible();

    await equipe.page.getByRole("button", { name: "Marcar como entregue" }).click();
    await expect(equipe.page.getByText("Pedido encerrado")).toBeVisible();
    const historico = equipe.page.getByRole("list").filter({ hasText: "Pedido criado." });
    await expect(historico).toContainText("Pedido enviado. Rastreio: BR123456789BR.");
    await expect(historico).toContainText("Pedido entregue.");
    await expect(historico).toContainText("Beatriz Lemos"); // quem agiu fica registrado
    await cliente.fechar();
    await equipe.fechar();
  });

  test("a equipe cancela pedido em preparo: estoque volta e o pagamento é estornado", async ({ browser }) => {
    const cliente = await comoPapel(browser, "cliente");
    const equipe = await comoPapel(browser, "farmaceutica");
    const id = await comprarPelaTela(cliente.page, { itens: [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }], forma: "Cartão de crédito" });
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(199);
    await equipe.page.goto(`/admin/pedidos/${id}`);
    equipe.page.once("dialog", (d) => d.accept());
    await equipe.page.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(equipe.page.getByText("Pedido encerrado")).toBeVisible();
    expect(await estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(200);
    expect((await db.pedido.findUniqueOrThrow({ where: { id } })).statusPagamento).toBe("ESTORNADO");
    await cliente.fechar();
    await equipe.fechar();
  });

  test("lista de pedidos: filtro por situação e busca por número e e-mail", async ({ browser }) => {
    const cliente = await comoPapel(browser, "cliente");
    const equipe = await comoPapel(browser, "farmaceutica");
    await comprarPelaTela(cliente.page, { itens: [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }], forma: "Cartão de crédito" }); // nº 1, em preparo
    await comprarPelaTela(cliente.page, { itens: [{ slug: MAGNESIO.slug, tamanhoId: MAGNESIO.tamanhoId, qtd: 1 }], forma: "Pix" }); // nº 2, aguardando

    await equipe.page.goto("/admin/pedidos");
    await expect(equipe.page.getByRole("link", { name: "nº 1" })).toBeVisible();
    await expect(equipe.page.getByRole("link", { name: "nº 2" })).toBeVisible();
    await equipe.page.goto("/admin/pedidos?status=EM_PREPARO");
    await expect(equipe.page.getByRole("link", { name: "nº 1" })).toBeVisible();
    await expect(equipe.page.getByRole("link", { name: "nº 2" })).toHaveCount(0);
    await equipe.page.goto("/admin/pedidos?q=2");
    await expect(equipe.page.getByRole("link", { name: "nº 2" })).toBeVisible();
    await equipe.page.goto(`/admin/pedidos?q=${CRED.cliente.email.slice(0, 7)}`);
    await expect(equipe.page.getByRole("link", { name: "nº 1" })).toBeVisible();
    await cliente.fechar();
    await equipe.fechar();
  });

  test("mensagem de visitante chega ao painel e pode ser marcada como lida", async ({ browser }) => {
    await db.mensagemContato.create({ data: { nome: "Visitante Teste", email: "v@teste.example", assunto: "pedido", mensagem: "Qual o prazo de entrega para Belo Horizonte?" } });
    const equipe = await comoPapel(browser, "farmaceutica");
    await equipe.page.goto("/admin/mensagens");
    await expect(equipe.page.getByText("Qual o prazo de entrega para Belo Horizonte?")).toBeVisible();
    await equipe.page.getByRole("button", { name: "Marcar como lida" }).click();
    await expect(equipe.page.getByRole("button", { name: "Marcar como não lida" })).toBeVisible();
    expect((await db.mensagemContato.findFirstOrThrow({ where: { email: "v@teste.example" } })).lida).toBe(true);
    await equipe.fechar();
  });

  test("visão geral conta o que precisa de atenção", async ({ browser }) => {
    const cliente = await comoPapel(browser, "cliente");
    const equipe = await comoPapel(browser, "farmaceutica");
    await comprarPelaTela(cliente.page, { itens: [await itemComReceita()], forma: "Cartão de crédito", receita: true });
    await db.tamanho.updateMany({ where: { codigo: MAGNESIO.tamanhoId, produto: { slug: MAGNESIO.slug } }, data: { estoque: 3 } });
    await equipe.page.goto("/admin");
    await expect(equipe.page.getByRole("link", { name: /Receitas para conferir/ })).toContainText("1");
    await expect(equipe.page.getByText("Magnésio Bisglicinato 300 mg")).toBeVisible(); // estoque baixo
    await cliente.fechar();
    await equipe.fechar();
  });
});

test.describe("painel: administração", () => {
  test.beforeEach(resetar);

  test("preço editado aparece na vitrine na hora; preço inválido é recusado; estoque rápido grava", async ({ browser }) => {
    const admin = await comoPapel(browser, "admin");
    const vitrine = await (await browser.newContext({ storageState: { cookies: [], origins: [] } })).newPage();
    const produto = await db.produto.findUniqueOrThrow({ where: { slug: MAGNESIO.slug }, include: { tamanhos: true } });
    const t30 = produto.tamanhos.find((t) => t.codigo === "30")!;
    const campoPreco = (p: Page) => p.locator(`input[name="t-${t30.id}-preco"]`);

    await admin.page.goto(`/admin/produtos/${produto.id}`);
    await campoPreco(admin.page).fill("51,90");
    await admin.page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(admin.page.getByText("Produto salvo.")).toBeVisible();
    expect((await db.tamanho.findUniqueOrThrow({ where: { id: t30.id } })).preco).toBe(5190);
    await vitrine.goto(`/produtos/${MAGNESIO.slug}`);
    await expect(vitrine.getByText("R$ 51,90").first()).toBeVisible(); // invalidação imediata do cache da vitrine

    await admin.page.goto(`/admin/produtos/${produto.id}`);
    await campoPreco(admin.page).fill("abc");
    await admin.page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(admin.page.getByText(/confira preço/i)).toBeVisible();
    expect((await db.tamanho.findUniqueOrThrow({ where: { id: t30.id } })).preco).toBe(5190); // não mudou

    await admin.page.goto("/admin/produtos");
    const cartao = admin.page.getByRole("listitem").filter({ has: admin.page.getByRole("link", { name: "Magnésio Bisglicinato 300 mg" }) }).first();
    await cartao.getByLabel("30 cápsulas", { exact: true }).fill("7");
    await cartao.getByRole("button", { name: "Salvar estoque de 30 cápsulas" }).click();
    await expect.poll(() => estoqueDe(MAGNESIO.slug, MAGNESIO.tamanhoId)).toBe(7);

    await db.tamanho.update({ where: { id: t30.id }, data: { preco: 4990 } });
    await vitrine.context().close();
    await admin.fechar();
  });

  test("produto novo: slug, arte da forma, vitrine; ocultar tira da loja", async ({ browser }) => {
    const admin = await comoPapel(browser, "admin");
    const vitrine = await (await browser.newContext({ storageState: { cookies: [], origins: [] } })).newPage();
    await admin.page.goto("/admin/produtos/novo");
    const campo = (nome: string) => admin.page.locator(`[name="${nome}"]`);
    await campo("nome").fill("Produto Teste Painel");
    await campo("subtitulo").fill("Cápsulas de teste");
    await campo("forma").selectOption("capsulas");
    await campo("descricao").fill("Descrição de teste do produto criado pelo painel administrativo.");
    await campo("comoUsar").fill("Conforme orientação.");
    await campo("ingredientes").fill("Ingrediente de teste.");
    await campo("porcao").fill("1 cápsula");
    await campo("tabela").fill("Componente de teste | 100 mg | 10%");
    await campo("t-novo-codigo").fill("30");
    await campo("t-novo-rotulo").fill("30 cápsulas");
    await campo("t-novo-preco").fill("39,90");
    await campo("t-novo-estoque").fill("15");
    await admin.page.getByRole("button", { name: "Cadastrar produto" }).click();
    await admin.page.waitForURL(/\/admin\/produtos\/.+criado=1/);
    await expect(admin.page.getByText("Produto cadastrado")).toBeVisible();
    // O Next 16 mantém a tela anterior montada e escondida (Activity): seletores por atributo precisam de :visible.
    await expect(admin.page.locator('[name="ativo"]:visible')).toHaveCount(1);

    const novo = await db.produto.findUniqueOrThrow({ where: { slug: "produto-teste-painel" }, include: { tamanhos: true } });
    expect([novo.artKind, novo.forma, novo.tamanhos[0].estoque, novo.tamanhos[0].preco]).toEqual(["jar", "capsulas", 15, 3990]);

    await vitrine.goto("/produtos/produto-teste-painel");
    await expect(vitrine.getByRole("heading", { name: "Produto Teste Painel" })).toBeVisible();
    await vitrine.goto("/produtos?q=Painel");
    await expect(vitrine.getByRole("link", { name: /Produto Teste Painel/ }).first()).toBeVisible();

    await admin.page.locator('[name="ativo"]:visible').uncheck();
    await admin.page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(admin.page.getByText("Produto salvo.")).toBeVisible();
    await vitrine.goto("/produtos/produto-teste-painel");
    await expect(vitrine.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await vitrine.goto("/produtos?q=Painel");
    await expect(vitrine.getByText("Nenhum produto encontrado")).toBeVisible();
    await vitrine.context().close();
    await admin.fechar();
  });

  test("cupons: criar, repetir, usar no carrinho e desativar", async ({ browser }) => {
    const admin = await comoPapel(browser, "admin");
    await admin.page.goto("/admin/cupons");
    const principal = admin.page.getByRole("main");
    await principal.getByLabel("Código").fill("teste20");
    await principal.getByLabel(/Percentual/).fill("20");
    await principal.getByRole("button", { name: "Criar cupom" }).click();
    await expect(principal.getByText("Cupom TESTE20 criado.")).toBeVisible();
    expect((await db.cupom.findUniqueOrThrow({ where: { codigo: "TESTE20" } })).percentual).toBe(20);
    await principal.getByLabel("Código").fill("TESTE20");
    await principal.getByLabel(/Percentual/).fill("20");
    await principal.getByRole("button", { name: "Criar cupom" }).click();
    await expect(principal.getByText("Já existe um cupom")).toBeVisible();

    const visitante = await (await browser.newContext({ storageState: { cookies: [], origins: [] } })).newPage();
    const aplicar = async (codigo: string) => {
      await visitante.goto("/carrinho");
      await visitante.getByPlaceholder("Digite o código").fill(codigo);
      await visitante.getByRole("button", { name: "Aplicar" }).click();
    };
    await visitante.goto("/");
    await visitante.evaluate(
      ([k]) => localStorage.setItem(k, JSON.stringify({ itens: [{ key: "m", slug: "magnesio-bisglicinato-300", tamanhoId: "30", qtd: 1, frequencia: "unica" }], cupom: null, favoritos: [], favoritosDeConta: false })),
      ["casa-magistral:estado:v2"],
    );
    await aplicar("TESTE20");
    await expect(visitante.getByText("TESTE20 · 20% de desconto")).toBeVisible();

    await principal.getByRole("button", { name: "Desativar" }).first().click();
    await expect.poll(async () => (await db.cupom.findUniqueOrThrow({ where: { codigo: "TESTE20" } })).ativo).toBe(false);
    await visitante.getByRole("button", { name: "Remover cupom" }).click();
    await aplicar("TESTE20");
    await expect(visitante.getByRole("main").getByRole("alert")).toContainText("inválido ou expirado");
    await visitante.context().close();
    await admin.fechar();
  });

  test("usuários: criar equipe, bloquear, rebaixar; o próprio papel fica travado", async ({ browser }) => {
    const admin = await comoPapel(browser, "admin");
    const novoEmail = `teste.equipe.${Date.now()}@casamagistral.exemplo`;
    await admin.page.goto("/admin/usuarios");
    const principal = admin.page.getByRole("main");

    const minhaLinha = principal.getByRole("row").filter({ hasText: CRED.admin.email });
    await expect(minhaLinha.getByRole("combobox")).toBeDisabled();
    await expect(minhaLinha.getByRole("button", { name: /Bloquear/ })).toHaveCount(0);

    await principal.getByLabel("Nome", { exact: true }).fill("Nova Farmacêutica");
    await principal.getByLabel("E-mail", { exact: true }).fill(novoEmail);
    await principal.getByLabel("Senha inicial").fill(SENHA);
    await principal.getByRole("button", { name: "Adicionar à equipe" }).click();
    await expect(principal.getByText(/foi adicionado/)).toBeVisible();
    expect((await db.usuario.findUniqueOrThrow({ where: { email: novoEmail } })).papel).toBe("FARMACEUTICO");

    await admin.page.goto(`/admin/usuarios?q=${encodeURIComponent(novoEmail)}`);
    await admin.page.getByRole("button", { name: "Bloquear" }).click();
    await expect.poll(async () => (await db.usuario.findUniqueOrThrow({ where: { email: novoEmail } })).ativo).toBe(false);
    const anonimo = await (await browser.newContext({ storageState: { cookies: [], origins: [] } })).newPage();
    await anonimo.goto("/entrar");
    await anonimo.getByRole("main").getByLabel("E-mail", { exact: true }).fill(novoEmail);
    await anonimo.getByRole("main").getByLabel("Senha", { exact: true }).fill(SENHA);
    await anonimo.getByRole("main").getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(anonimo.getByRole("main").getByRole("alert")).toContainText("incorretos");
    await anonimo.context().close();

    // rebaixar a farmacêutica do seed: perde o painel na mesma hora, sem esperar o token expirar
    const equipe = await comoPapel(browser, "farmaceutica");
    await equipe.page.goto("/admin");
    await expect(equipe.page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
    await admin.page.goto(`/admin/usuarios?q=${encodeURIComponent(CRED.farmaceutica.email)}`);
    await admin.page.getByRole("combobox", { name: /Papel de/ }).selectOption("CLIENTE");
    await expect.poll(async () => (await db.usuario.findUniqueOrThrow({ where: { email: CRED.farmaceutica.email } })).papel).toBe("CLIENTE");
    await equipe.page.goto("/admin");
    await expect(equipe.page).toHaveURL(/\/conta$/);
    await equipe.fechar();
    await admin.fechar();
  });
});
