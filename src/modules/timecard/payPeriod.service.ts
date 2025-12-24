import { PrismaClient } from "@prisma/client";
import {
  getPayPeriodRange,
  PayPeriodType,
} from "../../utils/payPeriodEngine";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Load pay-period configuration from ACTIVE payrollPeriod
 * ------------------------------------------------------
 */
export async function getPayPeriodConfig(
  organizationId: number
): Promise<{
  payPeriodType: PayPeriodType;
  weekStartDay: number;
  biweeklyAnchorDate: Date | null;
  semiMonthCut1: number | null;
  semiMonthCut2: number | null;
  monthlyCutDay: number | null;
  cutoffTime: string | null;
}> {
  // 1️⃣ Load organization-level config
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      payPeriodType: true,
      weekStartDay: true,
      biweeklyAnchorDate: true,
    },
  });

  if (!org || !org.payPeriodType) {
    throw new Error("Organization pay period config missing");
  }

  // 2️⃣ Load ACTIVE payroll period
  const period = await prisma.payrollPeriod.findFirst({
    where: {
      organizationId,
      status: "OPEN",
    },
    orderBy: { startDate: "desc" },
  });

  if (!period) {
    throw new Error("No active payroll period found");
  }

  return {
    payPeriodType: org.payPeriodType as PayPeriodType,
    weekStartDay: org.weekStartDay ?? 1,
    biweeklyAnchorDate: org.biweeklyAnchorDate ?? null,
    semiMonthCut1: period.semiMonthCut1 ?? null,
    semiMonthCut2: period.semiMonthCut2 ?? null,
    monthlyCutDay: period.monthlyCutDay ?? null,
    cutoffTime: period.cutoffTime ?? null,
  };
}

/**
 * ------------------------------------------------------
 * Resolve pay period range for a date
 * ------------------------------------------------------
 */
export async function getPayPeriodForDate(
  organizationId: number,
  date: Date
): Promise<{
  type: PayPeriodType;
  start: string;
  end: string;
}> {
  const config = await getPayPeriodConfig(organizationId);

  const period = getPayPeriodRange(
    {
      payPeriodType: config.payPeriodType,
      weekStartDay: config.weekStartDay,
      biWeeklyAnchorDate: config.biweeklyAnchorDate,
      semiMonthCut1: config.semiMonthCut1,
      semiMonthCut2: config.semiMonthCut2,
      monthlyCutDay: config.monthlyCutDay,
      cutoffTime: config.cutoffTime,
    },
    date
  );

  return {
    type: period.type,
    start: period.startDate,
    end: period.endDate,
  };
}

/**
 * Re-export enum
 */
export type { PayPeriodType };
