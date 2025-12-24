// src/modules/timecard/payPeriod.service.ts

import { PrismaClient } from "@prisma/client";
import {
  getPayPeriodRange,
  PayPeriodType,
} from "../../utils/payPeriodEngine";

const prisma = new PrismaClient();

/**
 * ------------------------------------------------------
 * Get pay period configuration for an organization + date
 * (schema-safe, engine-safe)
 * ------------------------------------------------------
 */
export async function getPayPeriodConfig(
  organizationId: number,
  date: Date
): Promise<{
  payPeriodType: PayPeriodType;
  weekStartDay: number;
  biWeeklyAnchorDate: Date | null;
  semiMonthCut1: number | null;
  semiMonthCut2: number | null;
  monthlyCutDay: number | null;
  cutoffTime: string | null;
}> {
  // --------------------------------------------------
  // Load organization (ONLY fields that exist)
  // --------------------------------------------------
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      weekStartDay: true,
      timezone: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // --------------------------------------------------
  // Load payroll period covering the date
  // --------------------------------------------------
  const period = await prisma.payrollPeriod.findFirst({
    where: {
      organizationId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });

  if (!period) {
    throw new Error("No payroll period found for date");
  }

  // --------------------------------------------------
  // Normalize config for payPeriodEngine
  // --------------------------------------------------
  return {
    payPeriodType: period.type as PayPeriodType,

    weekStartDay:
      period.weekStartDay ??
      org.weekStartDay ??
      1,

    biWeeklyAnchorDate:
      period.biWeeklyAnchorDate ?? null,

    semiMonthCut1:
      period.semiMonthCut1 ?? null,

    semiMonthCut2:
      period.semiMonthCut2 ?? null,

    monthlyCutDay:
      period.monthlyCutDay ?? null,

    cutoffTime:
      period.cutoffTime ?? null,
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
