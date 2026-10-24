import type { Metadata } from "next";
import { DadosForm, SenhaForm } from "@/components/conta/DadosForms";
import { prisma } from "@/server/prisma";
import { exigirUsuario } from "@/server/sessao";

export const metadata: Metadata = { title: "Dados e senha" };

export default async function PaginaDados() {
  const usuario = await exigirUsuario("/conta/dados");
  const registro = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id }, select: { telefone: true } });
  return (
    <div className="grid gap-12">
      <section aria-labelledby="dados-titulo">
        <h2 id="dados-titulo" className="mb-5 font-display text-2xl font-bold text-forest-dark">
          Dados pessoais
        </h2>
        <DadosForm nome={usuario.nome} email={usuario.email} telefone={registro.telefone ?? ""} />
      </section>
      <section aria-labelledby="senha-titulo">
        <h2 id="senha-titulo" className="mb-5 font-display text-2xl font-bold text-forest-dark">
          Alterar senha
        </h2>
        <SenhaForm />
      </section>
    </div>
  );
}
