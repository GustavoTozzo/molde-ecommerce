-- CreateTable
CREATE TABLE "eventos_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "autorId" TEXT,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_pedido_pedidoId_criadoEm_idx" ON "eventos_pedido"("pedidoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "eventos_pedido" ADD CONSTRAINT "eventos_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_pedido" ADD CONSTRAINT "eventos_pedido_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

