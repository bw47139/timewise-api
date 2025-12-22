-- CreateEnum
CREATE TYPE "PayPeriodType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "monthlyAnchorDay" INTEGER,
ADD COLUMN     "payPeriodAnchorDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payPeriodType" "PayPeriodType" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "semiMonthlyFirstDay" INTEGER,
ADD COLUMN     "semiMonthlySecondDay" INTEGER,
ADD COLUMN     "weekStartDay" "WeekDay" NOT NULL DEFAULT 'SUNDAY';
