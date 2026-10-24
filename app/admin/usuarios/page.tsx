import type { Metadata } from "next";
import { EquipeNovaForm, SeletorPapel } from "@/components/admin/OutrosFormularios";
import { Botao } from "@/components/ui/Button";
import { formatarData } from "@/lib/format";
import { alternarAtivo } from "@/server/acoes/admin-usuarios";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { exigirEquipe } from "@/server/sessao";

export const metadata: Metadata = { title: "Usuários" };

export default async function PaginaUsuarios(props: PageProps<"/admin/usuarios">) {
  const eu = await exigirEquipe("/admin/usuarios", ["ADMINISTRADOR"]);
  const sp = await props.searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim().slice(0, 60);
  const where: Prisma.UsuarioWhereInput = q ? { OR: [{ nome: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {};
  const usuarios = await prisma.usuario.findMany({
    where,
    orderBy: [{ papel: "desc" }, { criadoEm: "desc" }],
    take: 80,
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true, _count: { select: { pedidos: true } } },
  });

  return (
    <div className="grid gap-8">
      <section aria-labelledby="usu-titulo">
        <h2 id="usu-titulo" className="font-display text-3xl font-bold text-forest-dark">
          Usuários
        </h2>
        <form action="/admin/usuarios" role="search" className="mt-4 flex max-w-md gap-2">
          <label htmlFor="busca-usuario" className="sr-only">
            Buscar por nome ou e-mail
          </label>
          <input id="busca-usuario" name="q" defaultValue={q} placeholder="Nome ou e-mail" className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm" />
          <button type="submit" className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-dark">
            Buscar
          </button>
        </form>
        <div className="mt-4 overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Usuários cadastrados</caption>
            <thead className="bg-cream text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">Pessoa</th>
                <th scope="col" className="px-4 py-3">Papel</th>
                <th scope="col" className="px-4 py-3">Pedidos</th>
                <th scope="col" className="px-4 py-3">Desde</th>
                <th scope="col" className="px-4 py-3">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {usuarios.map((u) => {
                const sou = u.id === eu.id;
                return (
                  <tr key={u.id}>
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {u.nome}
                      {sou && <span className="ml-1.5 rounded-full bg-mint px-2 py-0.5 text-xs">você</span>}
                      <span className="block text-xs font-normal text-muted">{u.email}</span>
                    </th>
                    <td className="px-4 py-3">
                      <SeletorPapel usuarioId={u.id} papel={u.papel} desabilitado={sou} nome={u.nome} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{u._count.pedidos}</td>
                    <td className="px-4 py-3 text-muted">{formatarData(u.criadoEm)}</td>
                    <td className="px-4 py-3">
                      <form action={alternarAtivo.bind(null, u.id)} className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.ativo ? "bg-mint text-forest-dark" : "bg-coral-soft"}`}>{u.ativo ? "Ativo" : "Bloqueado"}</span>
                        {!sou && (
                          <Botao type="submit" variante="claro" tamanho="p">
                            {u.ativo ? "Bloquear" : "Liberar"}
                          </Botao>
                        )}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Você não altera o próprio papel nem se bloqueia, e a loja sempre mantém ao menos um administrador ativo.</p>
      </section>
      <section aria-labelledby="eq-titulo">
        <h2 id="eq-titulo" className="mb-4 font-display text-2xl font-bold text-forest-dark">
          Adicionar à equipe
        </h2>
        <EquipeNovaForm />
      </section>
    </div>
  );
}
