import type { Produto } from "@/lib/types";
import { Acordeao } from "@/components/ui/Acordeao";

function TabelaNutricional({ produto }: { produto: Produto }) {
  if (produto.tabela.length === 0) {
    return <p>Este kit reúne produtos da linha; consulte a tabela de cada item na página correspondente.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-80 border-collapse text-sm">
        <caption className="mb-2 text-left font-bold text-ink">Informação nutricional · Porção: {produto.porcao}</caption>
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th scope="col" className="py-2 pr-4 font-bold">
              Componente
            </th>
            <th scope="col" className="py-2 pr-4 font-bold">
              Por porção
            </th>
            <th scope="col" className="py-2 font-bold">
              %VD*
            </th>
          </tr>
        </thead>
        <tbody>
          {produto.tabela.map((l) => (
            <tr key={l.item} className="border-b border-line">
              <th scope="row" className="py-2 pr-4 text-left font-medium">
                {l.item}
              </th>
              <td className="py-2 pr-4">{l.qtd}</td>
              <td className="py-2">{l.vd ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs">*Percentual de valores diários fornecidos pela porção, com base em uma dieta de 2.000 kcal ou 8.400 kJ.</p>
    </div>
  );
}

export function DetalhesProduto({ produto }: { produto: Produto }) {
  return (
    <Acordeao
      multiplo
      abertoInicial="descricao"
      itens={[
        {
          id: "descricao",
          titulo: "Descrição",
          conteudo: (
            <div className="space-y-3">
              {produto.descricao.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
          ),
        },
        {
          id: "uso",
          titulo: "Como usar",
          conteudo: (
            <div className="space-y-3">
              <p>{produto.comoUsar}</p>
              <p className="text-sm">Conservar em local fresco e seco, ao abrigo da luz. Consulte a validade e o lote impressos no rótulo.</p>
            </div>
          ),
        },
        {
          id: "composicao",
          titulo: "Ingredientes e informação nutricional",
          conteudo: (
            <div className="space-y-5">
              <p>
                <strong className="text-ink">Ingredientes:</strong> {produto.ingredientes}
              </p>
              <TabelaNutricional produto={produto} />
            </div>
          ),
        },
        {
          id: "duvidas",
          titulo: "Perguntas sobre este produto",
          conteudo: (
            <dl className="space-y-4">
              {produto.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-bold text-ink">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          ),
        },
      ]}
    />
  );
}
