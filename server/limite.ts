import "server-only";

/**
 * Limitador de tentativas em memória (janela deslizante simples).
 *
 * LIMITAÇÃO CONHECIDA: o contador vive na memória de cada instância. Em ambiente
 * serverless (Vercel) cada instância tem o seu, então o limite efetivo é maior que o
 * configurado e zera quando a instância reinicia. Serve como freio contra tentativa
 * automática óbvia; para um limite firme, trocar por um contador compartilhado
 * (Redis/KV ou tabela no banco). Registrado em docs/decisoes-fase-3.md.
 */
const tentativas = new Map<string, number[]>();

/**
 * Só para a suíte de ponta a ponta, que cria dezenas de contas e logins em minutos a partir do mesmo IP.
 * NUNCA definir em produção. O comportamento do limitador em si é coberto por tests/limite.test.ts.
 */
const FATOR = process.env.LIMITES_RELAXADOS === "1" ? 50 : 1;

export function excedeuLimite(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  recentes.push(agora);
  tentativas.set(chave, recentes);

  if (tentativas.size > 5000) {
    for (const [k, v] of tentativas) if (v.every((t) => agora - t >= janelaMs)) tentativas.delete(k);
  }
  return recentes.length > max * FATOR;
}

export function limparLimite(chave: string) {
  tentativas.delete(chave);
}
