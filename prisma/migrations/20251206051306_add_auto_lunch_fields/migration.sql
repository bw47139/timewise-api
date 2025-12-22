-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "autoLunchDeductOnce" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoLunchEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoLunchIgnoreIfBreak" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoLunchMinimumShift" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "autoLunchMinutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Punch" ADD COLUMN     "isAutoLunch" BOOLEAN NOT NULL DEFAULT false;
