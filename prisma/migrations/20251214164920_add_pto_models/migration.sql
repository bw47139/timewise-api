/*
  Warnings:

  - You are about to drop the column `ptoBalance` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "ptoBalance";

-- CreateTable
CREATE TABLE "PtoBalance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtoBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtoRequest" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PtoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PtoBalance_employeeId_key" ON "PtoBalance"("employeeId");

-- CreateIndex
CREATE INDEX "PtoRequest_employeeId_date_idx" ON "PtoRequest"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "PtoBalance" ADD CONSTRAINT "PtoBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtoRequest" ADD CONSTRAINT "PtoRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
