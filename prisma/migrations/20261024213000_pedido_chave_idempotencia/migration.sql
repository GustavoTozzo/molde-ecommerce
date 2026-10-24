-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "chaveIdempotencia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_usuarioId_chaveIdempotencia_key" ON "pedidos"("usuarioId", "chaveIdempotencia");

