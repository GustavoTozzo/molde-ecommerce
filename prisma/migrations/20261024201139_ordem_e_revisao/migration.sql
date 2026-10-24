-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_revisadaPorId_fkey" FOREIGN KEY ("revisadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
