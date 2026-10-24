import type { Metadata } from "next";
import { EnderecoCartao, EnderecoForm } from "@/components/conta/EnderecosUI";
import { prisma } from "@/server/prisma";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Endereços" };

export default async function PaginaEnderecos() {
  const usuario = await exigirUsuario("/conta/enderecos");
  const enderecos = await prisma.endereco.findMany({
    where: { usuarioId: usuario.id },
    orderBy: [{ principal: "desc" }, { criadoEm: "asc" }],
  });

  return (
    <div className="grid gap-12">
      <section aria-labelledby="end-lista">
        <h2 id="end-lista" className="mb-5 font-display text-2xl font-bold text-forest-dark">
          Endereços salvos
        </h2>
        {enderecos.length === 0 ? (
          <p className="rounded-card bg-cream p-6 text-muted">Você ainda não salvou nenhum endereço. Cadastre o primeiro abaixo para agilizar o checkout.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {enderecos.map((e) => (
              <EnderecoCartao key={e.id} endereco={e} />
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="end-novo">
        <h2 id="end-novo" className="mb-5 font-display text-2xl font-bold text-forest-dark">
          Novo endereço
        </h2>
        <EnderecoForm />
      </section>
    </div>
  );
}
