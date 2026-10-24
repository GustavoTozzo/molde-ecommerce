import type { Metadata } from "next";
import { getEspecialistas } from "@/server/catalogo";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { EspecialistasLista } from "@/components/especialistas/EspecialistasLista";

export const metadata: Metadata = {
  title: "Especialistas",
  description: "Conheça os profissionais de saúde que participam da curadoria de fórmulas da Casa Magistral.",
};

export default async function PaginaEspecialistas() {
  const especialistas = await getEspecialistas();
  return (
    <div className="pb-4">
      <CabecalhoPagina
        titulo="Quem participa da nossa curadoria"
        sobretitulo="Especialistas"
        trilha={[{ rotulo: "Especialistas" }]}
        descricao="Médicos, nutricionistas e farmacêuticos que ajudam a revisar fórmulas, rótulos e informações. Perfis e registros fictícios, apenas para ilustrar o layout."
      />
      <EspecialistasLista especialistas={especialistas} />
      <div className="wrap mt-14">
        <p className="rounded-2xl bg-cream p-5 text-sm text-muted">
          <strong className="text-ink">Aviso de uso do molde:</strong> ao publicar o site real, só exiba profissionais que autorizaram por escrito, com número de registro verdadeiro, e confira as regras do conselho de classe e da Anvisa sobre publicidade de produtos e de serviços de saúde.
        </p>
      </div>
    </div>
  );
}
