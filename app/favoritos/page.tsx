import type { Metadata } from "next";
import { FavoritosLista } from "@/components/conta/FavoritosLista";

export const metadata: Metadata = { title: "Favoritos" };

export default function PaginaFavoritos() {
  return <FavoritosLista />;
}
