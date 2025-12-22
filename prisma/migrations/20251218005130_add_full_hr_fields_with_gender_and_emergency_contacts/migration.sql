/*
  Warnings:

  - You are about to drop the column `emergencyContactName` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactPhone` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContactRelation` on the `Employee` table. All the data in the column will be lost.
  - The `gender` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "emergencyContactName",
DROP COLUMN "emergencyContactPhone",
DROP COLUMN "emergencyContactRelation",
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "preferredName" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmergencyContact_employeeId_idx" ON "EmergencyContact"("employeeId");

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
