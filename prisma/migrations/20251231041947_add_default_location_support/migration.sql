/*
  Warnings:

  - You are about to drop the column `accrualRatePerPeriod` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `autoLunchDeductOnce` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `autoLunchEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `autoLunchIgnoreIfBreak` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `autoLunchMinimumShift` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `autoLunchMinutes` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `biweeklyAnchorDate` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `carryoverEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `carryoverLimit` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `cutoffTime` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `doubleTimeEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `doubletimeDailyThresholdHours` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `maxPtoBalance` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyCutDay` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeDailyEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeDailyThresholdHours` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeWeeklyEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeWeeklyThresholdHours` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `payPeriodType` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `ptoEnabled` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `weekStartDay` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `zipcode` on the `Organization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[defaultLocationId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "accrualRatePerPeriod",
DROP COLUMN "address",
DROP COLUMN "autoLunchDeductOnce",
DROP COLUMN "autoLunchEnabled",
DROP COLUMN "autoLunchIgnoreIfBreak",
DROP COLUMN "autoLunchMinimumShift",
DROP COLUMN "autoLunchMinutes",
DROP COLUMN "biweeklyAnchorDate",
DROP COLUMN "carryoverEnabled",
DROP COLUMN "carryoverLimit",
DROP COLUMN "city",
DROP COLUMN "cutoffTime",
DROP COLUMN "doubleTimeEnabled",
DROP COLUMN "doubletimeDailyThresholdHours",
DROP COLUMN "logoUrl",
DROP COLUMN "maxPtoBalance",
DROP COLUMN "monthlyCutDay",
DROP COLUMN "overtimeDailyEnabled",
DROP COLUMN "overtimeDailyThresholdHours",
DROP COLUMN "overtimeWeeklyEnabled",
DROP COLUMN "overtimeWeeklyThresholdHours",
DROP COLUMN "payPeriodType",
DROP COLUMN "phone",
DROP COLUMN "ptoEnabled",
DROP COLUMN "state",
DROP COLUMN "weekStartDay",
DROP COLUMN "zipcode",
ADD COLUMN     "defaultLocationId" INTEGER,
ALTER COLUMN "timezone" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_defaultLocationId_key" ON "Organization"("defaultLocationId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
