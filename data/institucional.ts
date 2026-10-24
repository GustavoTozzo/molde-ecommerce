export interface PaginaInstitucional {
  slug: string;
  titulo: string;
  resumo: string;
  secoes: { titulo: string; texto: string[] }[];
}

/**
 * Textos de EXEMPLO. Antes de publicar, substitua por conteúdo revisado pelo
 * farmacêutico responsável e por assessoria jurídica (LGPD, CDC, Anvisa).
 */
export const paginasInstitucionais: PaginaInstitucional[] = [
  {
    slug: "frete",
    titulo: "Política de frete e prazos",
    resumo: "Como calculamos o frete, os prazos de preparo e de entrega.",
    secoes: [
      { titulo: "Frete grátis", texto: ["Pedidos acima de R$ 249,00 (após descontos) têm frete grátis para todo o Brasil."] },
      { titulo: "Prazo de preparo", texto: ["Fórmulas manipuladas são preparadas após a confirmação do pagamento e, quando exigido, da conferência da receita. O prazo de preparo aparece no carrinho."] },
      { titulo: "Prazo de entrega", texto: ["O prazo de entrega depende do CEP e da modalidade escolhida (econômica ou expressa) e é contado a partir da postagem."] },
      { titulo: "Conservação no transporte", texto: ["Itens sensíveis a temperatura seguem em embalagem apropriada. Em caso de avaria, entre em contato em até 7 dias."] },
    ],
  },
  {
    slug: "trocas-e-devolucoes",
    titulo: "Trocas e devoluções",
    resumo: "Quando e como trocar ou devolver um produto.",
    secoes: [
      { titulo: "Direito de arrependimento", texto: ["Para compras online, o consumidor pode desistir em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor. Produtos manipulados sob medida e já preparados seguem regras específicas, que devem ser explicadas ao cliente antes da compra."] },
      { titulo: "Defeito ou envio incorreto", texto: ["Se o produto chegar com avaria, lacre violado ou diferente do pedido, fale conosco com fotos do item e da embalagem para providenciarmos a troca."] },
      { titulo: "Como solicitar", texto: ["Pelo WhatsApp ou pelo formulário de contato, informando o número do pedido."] },
    ],
  },
  {
    slug: "venda-com-receita",
    titulo: "Venda com receita",
    resumo: "Como funciona o envio e a conferência da receita.",
    secoes: [
      { titulo: "Quais produtos exigem receita", texto: ["Os itens marcados como “venda com receita” só são dispensados mediante apresentação de prescrição válida, emitida por profissional habilitado."] },
      { titulo: "Como enviar", texto: ["No carrinho, anexe uma foto nítida ou PDF da receita. O farmacêutico responsável confere dados, validade e legibilidade antes de preparar a fórmula."] },
      { titulo: "Substâncias de controle especial", texto: ["Este molde não prevê a venda de substâncias sujeitas a controle especial (Portaria SVS/MS nº 344/1998). Esse fluxo exige regras próprias e deve ser avaliado pelo responsável técnico e pelo jurídico."] },
    ],
  },
  {
    slug: "privacidade",
    titulo: "Política de privacidade",
    resumo: "Como os dados pessoais são tratados (texto de exemplo).",
    secoes: [
      { titulo: "Dados que coletamos", texto: ["Nome, e-mail, telefone e endereço para processar pedidos e responder mensagens. Dados de saúde, como receitas, são dados pessoais sensíveis e recebem tratamento reforçado."] },
      { titulo: "Para que usamos", texto: ["Cada dado é usado para uma finalidade informada no momento da coleta, com a base legal correspondente da LGPD."] },
      { titulo: "Seus direitos", texto: ["Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pelo canal do encarregado (DPO), informado nesta página na versão real."] },
      { titulo: "Armazenamento no navegador", texto: ["Este molde guarda carrinho e favoritos apenas no seu navegador (localStorage). Nada é enviado a servidores."] },
    ],
  },
  {
    slug: "termos",
    titulo: "Termos de uso",
    resumo: "Regras gerais de uso do site (texto de exemplo).",
    secoes: [
      { titulo: "Uso do site", texto: ["As informações do site têm caráter educativo e não substituem consulta, diagnóstico ou prescrição de profissional de saúde."] },
      { titulo: "Preços e disponibilidade", texto: ["Preços e prazos podem mudar sem aviso prévio. O valor válido é o exibido no fechamento do pedido."] },
      { titulo: "Propriedade intelectual", texto: ["Marca, textos e imagens pertencem ao titular do site, salvo indicação em contrário."] },
    ],
  },
];

export const paginaPorSlug = new Map(paginasInstitucionais.map((p) => [p.slug, p]));
