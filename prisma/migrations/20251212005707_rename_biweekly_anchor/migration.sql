/*
  Warnings:

  - You are about to drop the column `biWeeklyAnchorDate` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `biWeeklyAnchorDate` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "biWeeklyAnchorDate",
ADD COLUMN     "biweeklyAnchorDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "biWeeklyAnchorDate",
ADD COLUMN     "biweeklyAnchorDate" TIMESTAMP(3);
