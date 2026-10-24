import type { Avaliacao, Criador, Especialista, Post } from "@/lib/types";

/** Pessoas, depoimentos e artigos FICTÍCIOS, só para demonstrar o layout. */

export const especialistas: Especialista[] = [
  {
    slug: "helena-duarte",
    nome: "Dra. Helena Duarte",
    titulo: "Médica nutróloga",
    registro: "CRM 00000/UF (exemplo)",
    bio: "Atua em consultório com foco em nutrição clínica e acompanhamento de longo prazo. Participa da curadoria de fórmulas da Casa Magistral.",
    citacao: "Qualidade do insumo e transparência na fórmula são o ponto de partida de qualquer suplementação responsável.",
    avatar: "helena",
    selecao: ["magnesio-bisglicinato-300", "omega-3-1000", "vitamina-d3-2000"],
  },
  {
    slug: "rafael-moura",
    nome: "Dr. Rafael Moura",
    titulo: "Médico do esporte",
    registro: "CRM 00000/UF (exemplo)",
    bio: "Acompanha atletas amadores e profissionais. Gosta de fórmulas simples, com dose clara e rótulo fácil de entender.",
    citacao: "Prefiro fórmulas diretas, com ingredientes que o paciente consegue reconhecer no rótulo.",
    avatar: "rafael",
    selecao: ["creatina-3g", "coenzima-q10-100", "kit-rotina-da-manha"],
  },
  {
    slug: "camila-sato",
    nome: "Camila Sato",
    titulo: "Nutricionista",
    registro: "CRN 00000 (exemplo)",
    bio: "Trabalha com educação alimentar e rotina. Ajuda a montar hábitos possíveis de manter, com ou sem suplementos.",
    citacao: "Suplemento complementa a alimentação; ele não substitui uma rotina equilibrada.",
    avatar: "camila",
    selecao: ["colageno-hidrolisado-vitamina-c", "magnesio-teanina-limao", "kit-noite-tranquila"],
  },
  {
    slug: "beatriz-lemos",
    nome: "Beatriz Lemos",
    titulo: "Farmacêutica magistral",
    registro: "CRF-UF 00000 (exemplo)",
    bio: "Responsável técnica pela manipulação. Confere cada receita e cada lote antes da liberação para envio.",
    citacao: "Cada fórmula manipulada passa por conferência de receita, pesagem e rotulagem antes de sair da farmácia.",
    avatar: "beatriz",
    selecao: ["vitamina-d3-50000", "ferro-quelato-vitamina-c", "vitamina-d3-k2-gotas"],
  },
  {
    slug: "pedro-almeida",
    nome: "Dr. Pedro Almeida",
    titulo: "Dermatologista",
    registro: "CRM 00000/UF (exemplo)",
    bio: "Atende em consultório e acompanha pacientes que usam fórmulas tópicas manipuladas.",
    citacao: "Em pele, constância e proteção solar importam mais do que qualquer produto isolado.",
    avatar: "pedro",
    selecao: ["serum-vitamina-c-10", "gel-acido-hialuronico", "creme-ureia-10"],
  },
];

export const especialistaPorSlug = new Map(especialistas.map((e) => [e.slug, e]));

export const criadores: Criador[] = [
  { handle: "@juliana.rotinas", avatar: "juliana", produto: "colageno-hidrolisado-vitamina-c", legenda: "Minha rotina da manhã" },
  { handle: "@theo.treina", avatar: "theo", produto: "creatina-3g", legenda: "Treino e organização" },
  { handle: "@duda.bemestar", avatar: "duda", produto: "magnesio-teanina-limao", legenda: "Ritual da noite" },
  { handle: "@lara.em.casa", avatar: "lara", produto: "serum-vitamina-c-10", legenda: "Skincare simples" },
  { handle: "@bruno.rotina", avatar: "bruno", produto: "omega-3-1000", legenda: "Suplementos no dia a dia" },
  { handle: "@nina.cuida", avatar: "nina", produto: "multivitaminico-infantil", legenda: "Cuidados com a família" },
];

export const posts: Post[] = [
  {
    slug: "como-ler-o-rotulo-de-um-suplemento",
    titulo: "Como ler o rótulo de um suplemento",
    resumo: "Porção, tabela, ingredientes e avisos legais: um passo a passo para entender o que está na embalagem.",
    categoria: "Guias",
    data: "12/10/2026",
    leitura: "5 min",
    art: "jar",
    accent: "#0B5D4B",
    fundo: "mint",
  },
  {
    slug: "capsulas-saches-ou-gotas",
    titulo: "Cápsulas, sachês ou gotas: qual formato combina com você?",
    resumo: "Vantagens e cuidados de cada forma farmacêutica, para escolher com mais segurança.",
    categoria: "Formas farmacêuticas",
    data: "05/10/2026",
    leitura: "6 min",
    art: "dropper",
    accent: "#E58A2E",
    fundo: "amber-soft",
  },
  {
    slug: "o-que-e-uma-farmacia-de-manipulacao",
    titulo: "O que é uma farmácia de manipulação",
    resumo: "Como funciona o preparo de fórmulas, quem é o responsável técnico e o que muda em relação aos industrializados.",
    categoria: "Bastidores",
    data: "28/09/2026",
    leitura: "7 min",
    art: "box",
    accent: "#0B5D4B",
    fundo: "sky-soft",
  },
  {
    slug: "organizando-a-rotina-de-suplementos",
    titulo: "Organizando a rotina de suplementos sem complicar",
    resumo: "Dicas práticas de horário, armazenamento e lembretes para manter a constância.",
    categoria: "Rotina",
    data: "21/09/2026",
    leitura: "4 min",
    art: "sachet",
    accent: "#2D8FB3",
    fundo: "lilac-soft",
  },
  {
    slug: "como-conservar-suas-formulas",
    titulo: "Como conservar suas fórmulas manipuladas",
    resumo: "Luz, calor e umidade: o que cada tipo de fórmula tolera e por quanto tempo.",
    categoria: "Guias",
    data: "14/09/2026",
    leitura: "4 min",
    art: "syrup",
    accent: "#E58A2E",
    fundo: "coral-soft",
  },
  {
    slug: "perguntas-para-levar-ao-seu-profissional-de-saude",
    titulo: "Perguntas para levar ao seu profissional de saúde",
    resumo: "Uma lista simples para aproveitar melhor a consulta quando o assunto é suplementação.",
    categoria: "Saúde",
    data: "07/09/2026",
    leitura: "5 min",
    art: "serum",
    accent: "#0B5D4B",
    fundo: "cream",
  },
];

/** Avaliações fictícias, neutras (sem alegações de resultado). */
const bancoAvaliacoes: Omit<Avaliacao, "util">[] = [
  { nome: "Camila R.", nota: 5, data: "02/10/2026", titulo: "Chegou bem embalado", texto: "Pedido entregue dentro do prazo, frasco lacrado e com lote e validade no rótulo." },
  { nome: "Eduardo B.", nota: 5, data: "27/09/2026", titulo: "Fácil de usar", texto: "A informação de como usar e o que contém está clara na página. Comprei de novo pela assinatura." },
  { nome: "Sônia M.", nota: 4, data: "19/09/2026", titulo: "Bom atendimento", texto: "Tirei dúvidas no WhatsApp e fui respondida no mesmo dia. Só achei o frete um pouco alto." },
  { nome: "Vinícius A.", nota: 5, data: "11/09/2026", titulo: "Embalagem prática", texto: "O frasco é bem fechado e a tampa de rosca é firme. Cabe bem na necessaire." },
  { nome: "Helena G.", nota: 4, data: "30/08/2026", titulo: "Processo simples", texto: "Enviei a receita pelo carrinho e foi conferida rapidamente. Tudo transparente." },
  { nome: "Marcos F.", nota: 5, data: "22/08/2026", titulo: "Recomendo a loja", texto: "Atendimento cuidadoso e produto conforme a descrição. Já indiquei para a família." },
];

export function avaliacoesDoProduto(slug: string): Avaliacao[] {
  const seed = [...slug].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return bancoAvaliacoes.map((a, i) => ({ ...a, util: ((seed + i * 7) % 23) + 2 }));
}
