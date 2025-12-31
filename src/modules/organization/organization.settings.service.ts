import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------------------------
   ORGANIZATION SETTINGS (READ)
--------------------------------------------- */

export function getOrganizationSettings(id: number) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      timezone: true,

      // --------------------
      // Contact / Address
      // --------------------
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,

      // --------------------
      // Pay Period Settings
      // --------------------
      payPeriodType: true,
      weekStartDay: true,
      biweeklyAnchorDate: true,
      cutoffTime: true,

      // --------------------
      // Auto Lunch Rules
      // --------------------
      autoLunchEnabled: true,
      autoLunchMinutes: true,
      autoLunchMinimumShift: true,
      autoLunchDeductOnce: true,
      autoLunchIgnoreIfBreak: true,

      // --------------------
      // Overtime Rules
      // --------------------
      overtimeDailyEnabled: true,
      overtimeDailyThresholdHours: true,
      overtimeWeeklyEnabled: true,
      overtimeWeeklyThresholdHours: true,
      doubleTimeEnabled: true,
      doubletimeDailyThresholdHours: true,

      // --------------------
      // PTO Rules
      // --------------------
      ptoEnabled: true,
      accrualRatePerPeriod: true,
      maxPtoBalance: true,
      carryoverEnabled: true,
      carryoverLimit: true,
    },
  });
}
