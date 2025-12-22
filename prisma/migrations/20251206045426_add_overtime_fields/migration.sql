-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "doubletimeDailyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
ADD COLUMN     "overtimeDailyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
ADD COLUMN     "overtimeWeeklyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 40.0;
