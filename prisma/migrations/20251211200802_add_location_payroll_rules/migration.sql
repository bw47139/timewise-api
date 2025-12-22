-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "autoLunchDeductOnce" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoLunchEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoLunchIgnoreIfBreak" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoLunchMinimumShift" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "autoLunchMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "cutoffTime" TEXT DEFAULT '17:00',
ADD COLUMN     "doubletimeDailyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "doubletimeDailyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
ADD COLUMN     "overtimeDailyEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overtimeDailyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
ADD COLUMN     "overtimeWeeklyEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overtimeWeeklyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 40.0;
