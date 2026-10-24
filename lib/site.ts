/**
 * Configuração central do molde. Todo conteúdo abaixo é FICTÍCIO (exemplo).
 * Troque nome, contatos e dados legais pelos reais antes de publicar —
 * e revise com o farmacêutico responsável e com assessoria jurídica.
 */
export const site = {
  ano: 2026,
  nome: "Casa Magistral",
  nomeLogo: "casa magistral",
  tagline: "Farmácia de manipulação online",
  descricao:
    "Fórmulas manipuladas por farmacêuticos, com rastreabilidade de lote e entrega na sua casa. Molde de demonstração com conteúdo fictício.",
  whatsapp: {
    numero: "5500000000000",
    exibicao: "(00) 00000-0000",
    mensagem: "Olá! Gostaria de ajuda com um pedido.",
  },
  email: "atendimento@casamagistral.exemplo",
  horario: "Segunda a sexta, das 8h às 17h (exceto feriados)",
  endereco: "Rua Exemplo, 000 · Centro · Cidade/UF · CEP 00000-000",
  legal: {
    razaoSocial: "Casa Magistral Farmácia de Manipulação Ltda. (exemplo)",
    cnpj: "00.000.000/0001-00",
    farmaceutico: "Nome do Farmacêutico Responsável",
    crf: "CRF-UF 00000",
    afe: "AFE/Anvisa 0.00000-0",
    licenca: "Licença sanitária 000000/0000",
  },
  loja: {
    freteGratisAcima: 24900,
    freteFixo: 1990,
    descontoAssinatura: 0.15,
    parcelasMax: 6,
    parcelaMinima: 2000,
    // Cupons moram no banco (tabela `cupons`) e são validados no servidor.
  },
} as const;

export const navPrincipal = [
  { rotulo: "Mais vendidos", href: "/produtos?ordem=vendas" },
  { rotulo: "Lançamentos", href: "/produtos?selo=lancamento" },
  { rotulo: "Promoções", href: "/produtos?oferta=1" },
  { rotulo: "Kits", href: "/produtos?forma=kits" },
  { rotulo: "Especialistas", href: "/especialistas" },
  { rotulo: "Blog", href: "/blog" },
  { rotulo: "Assinatura", href: "/assinatura", destaque: true },
] as const;

export const beneficiosTopo = [
  { icone: "tag", texto: "15% off em assinaturas" },
  { icone: "truck", texto: "Frete grátis acima de R$ 249" },
  { icone: "shield", texto: "Farmacêutico responsável em todas as fórmulas" },
  { icone: "repeat", texto: "Receba todo mês, cancele quando quiser" },
] as const;

export const linksInstitucionais = [
  { rotulo: "Sobre a Casa Magistral", href: "/sobre" },
  { rotulo: "Especialistas", href: "/especialistas" },
  { rotulo: "Blog", href: "/blog" },
  { rotulo: "Assinatura", href: "/assinatura" },
  { rotulo: "Fale conosco", href: "/contato" },
] as const;

export const linksSuporte = [
  { rotulo: "Perguntas frequentes", href: "/institucional/perguntas-frequentes" },
  { rotulo: "Política de frete", href: "/institucional/frete" },
  { rotulo: "Trocas e devoluções", href: "/institucional/trocas-e-devolucoes" },
  { rotulo: "Venda com receita", href: "/institucional/venda-com-receita" },
  { rotulo: "Política de privacidade", href: "/institucional/privacidade" },
  { rotulo: "Termos de uso", href: "/institucional/termos" },
] as const;
