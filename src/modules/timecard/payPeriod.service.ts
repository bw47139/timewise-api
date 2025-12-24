import { PrismaClient } from "@prisma/client";
import {
  getPayPeriodRange,
  PayPeriodType,
} from "../../utils/payPeriodEngine";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Get ORGANIZATION pay period configuration
 * (schema-accurate, Prisma-safe)
 * ------------------------------------------------------
 */
export async function getPayPeriodConfig(orgId: number): Promise<{
  payPeriodType: PayPeriodType;
  weekStartDay: number;
  biweeklyAnchorDate: Date | null;
  semiMonthCut1: number | null;
  semiMonthCut2: number | null;
  monthlyCutDay: number | null;
  cutoffTime: string | null;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      payPeriodType: true,
      weekStartDay: true,
      biweeklyAnchorDate: true, // ✅ CORRECT FIELD NAME
      semiMonthCut1: true,
      semiMonthCut2: true,
      monthlyCutDay: true,
      cutoffTime: true,
    },
  });

  if (!org || !org.payPeriodType) {
    throw new Error("Organization pay period configuration not found.");
  }

  return {
    payPeriodType: org.payPeriodType as PayPeriodType,
    weekStartDay: org.weekStartDay ?? 1,
    biweeklyAnchorDate: org.biweeklyAnchorDate ?? null,
    semiMonthCut1: org.semiMonthCut1 ?? null,
    semiMonthCut2: org.semiMonthCut2 ?? null,
    monthlyCutDay: org.monthlyCutDay ?? null,
    cutoffTime: org.cutoffTime ?? null,
  };
}

/**
 * ------------------------------------------------------
 * Resolve pay period RANGE for a date
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
      biWeeklyAnchorDate: config.biweeklyAnchorDate, // engine expects camelCase
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
