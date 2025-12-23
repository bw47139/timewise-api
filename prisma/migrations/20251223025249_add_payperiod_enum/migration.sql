/*
  Warnings:

  - The `payPeriodType` column on the `Location` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payPeriodType` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PayPeriodType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "payPeriodType",
ADD COLUMN     "payPeriodType" "PayPeriodType" NOT NULL DEFAULT 'WEEKLY';

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "payPeriodType",
ADD COLUMN     "payPeriodType" "PayPeriodType" NOT NULL DEFAULT 'WEEKLY';
