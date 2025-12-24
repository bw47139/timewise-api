// src/modules/organization/pay-period.service.ts

import { PayPeriodType } from "../../utils/payperiod.engine";
import { prisma } from "../../prisma";

/**
 * -----------------------------------------------------
 * Canonical runtime-safe pay period values
 * (PayPeriodType is a TYPE, not a runtime enum)
 * -----------------------------------------------------
 */
const VALID_PAY_PERIOD_TYPES = [
  "WEEKLY",
  "BIWEEKLY",
  "SEMIMONTHLY",
  "MONTHLY",
] as const;

type ValidPayPeriodTypeValue = (typeof VALID_PAY_PERIOD_TYPES)[number];

/**
 * -----------------------------------------------------
 * Internal helpers
 * -----------------------------------------------------
 */

function weekStartIntToString(value: number | null): "sunday" | "monday" {
  if (value === 0) return "sunday";
  return "monday";
}

function weekStartStringToInt(value: "sunday" | "monday"): number {
  return value === "sunday" ? 0 : 1;
}

function payPeriodEnumToUi(value: PayPeriodType): string {
  // UI expects lowercase
  return String(value).toLowerCase();
}

function payPeriodUiToEnum(value: string): PayPeriodType {
  const upper = value.toUpperCase().trim();

  if (!VALID_PAY_PERIOD_TYPES.includes(upper as ValidPayPeriodTypeValue)) {
    throw new Error(`Invalid pay period type: ${value}`);
  }

  // Safe cast: validated against runtime list
  return upper as PayPeriodType;
}

/**
 * -----------------------------------------------------
 * Service
 * -----------------------------------------------------
 */

export const payPeriodService = {
  /**
   * Load organization-level pay-period settings
   */
  async getSettings(organizationId: number) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        payPeriodType: true,
        weekStartDay: true,
        biweeklyAnchorDate: true,
        cutoffTime: true,
      },
    });

    if (!org) return null;

    return {
      payPeriodType: payPeriodEnumToUi(org.payPeriodType),
      weekStartDay: weekStartIntToString(org.weekStartDay),
      anchorDate: org.biweeklyAnchorDate
        ? org.biweeklyAnchorDate.toISOString().slice(0, 10)
        : "",
      cutoffTime: org.cutoffTime ?? "17:00",
    };
  },

  /**
   * Update organization-level pay-period settings
   */
  async updateSettings(
    organizationId: number,
    data: {
      payPeriodType: string;
      weekStartDay: "sunday" | "monday";
      anchorDate?: string;
      cutoffTime?: string;
    }
  ) {
    const payPeriodType = payPeriodUiToEnum(data.payPeriodType);

    let anchorDate: Date | null = null;
    if (data.anchorDate) {
      // store at midnight UTC
      anchorDate = new Date(`${data.anchorDate}T00:00:00.000Z`);
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        payPeriodType,
        weekStartDay: weekStartStringToInt(data.weekStartDay),
        biweeklyAnchorDate: anchorDate,
        cutoffTime: data.cutoffTime ?? "17:00",
      },
    });
  },
};
