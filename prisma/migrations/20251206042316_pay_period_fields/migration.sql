/*
  Warnings:

  - You are about to drop the column `monthlyAnchorDay` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `payPeriodAnchorDate` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `semiMonthlyFirstDay` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `semiMonthlySecondDay` on the `Organization` table. All the data in the column will be lost.
  - The `payPeriodType` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `weekStartDay` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "monthlyAnchorDay",
DROP COLUMN "payPeriodAnchorDate",
DROP COLUMN "semiMonthlyFirstDay",
DROP COLUMN "semiMonthlySecondDay",
ADD COLUMN     "biWeeklyAnchorDate" TIMESTAMP(3),
DROP COLUMN "payPeriodType",
ADD COLUMN     "payPeriodType" TEXT NOT NULL DEFAULT 'WEEKLY',
DROP COLUMN "weekStartDay",
ADD COLUMN     "weekStartDay" INTEGER;

-- DropEnum
DROP TYPE "PayPeriodType";

-- DropEnum
DROP TYPE "WeekDay";
