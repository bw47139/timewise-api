// src/modules/timecard/payPeriod.service.ts

import { PrismaClient } from "@prisma/client";
import {
  getPayPeriodRange,
  PayPeriodType,
} from "../../utils/payPeriodEngine";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Get organization pay period configuration
 * (engine-safe, enum-safe)
 * ------------------------------------------------------
 */
export async function getPayPeriodConfig(orgId: number): Promise<{
  payPeriodType: PayPeriodType;
  weekStartDay: number;
  biWeeklyAnchorDate: Date | null;
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
      biWeeklyAnchorDate: true,
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
    biWeeklyAnchorDate: org.biWeeklyAnchorDate ?? null,
    semiMonthCut1: org.semiMonthCut1 ?? null,
    semiMonthCut2: org.semiMonthCut2 ?? null,
    monthlyCutDay: org.monthlyCutDay ?? null,
    cutoffTime: org.cutoffTime ?? null,
  };
}

/**
 * ------------------------------------------------------
 * PUBLIC API — resolve pay period range for a date
 * ------------------------------------------------------
 */
export function getPayPeriodForDate(
  date: Date,
  config: {
    payPeriodType: PayPeriodType;
    weekStartDay?: number;
    biWeeklyAnchorDate?: Date | null;
    semiMonthCut1?: number | null;
    semiMonthCut2?: number | null;
    monthlyCutDay?: number | null;
    cutoffTime?: string | null;
  }
): {
  type: PayPeriodType;
  start: string;
  end: string;
} {
  const period = getPayPeriodRange(
    {
      payPeriodType: config.payPeriodType,
      weekStartDay: config.weekStartDay,
      biWeeklyAnchorDate: config.biWeeklyAnchorDate ?? null,
      semiMonthCut1: config.semiMonthCut1 ?? null,
      semiMonthCut2: config.semiMonthCut2 ?? null,
      monthlyCutDay: config.monthlyCutDay ?? null,
      cutoffTime: config.cutoffTime ?? null,
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
 * Re-export enum for downstream consumers
 */
export type { PayPeriodType };
