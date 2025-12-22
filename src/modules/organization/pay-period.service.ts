// src/modules/organization/pay-period.service.ts
import { prisma } from "../../prisma";

function weekStartIntToString(value: number | null): "sunday" | "monday" {
  if (value === 0) return "sunday";
  return "monday"; // default
}

function weekStartStringToInt(value: string): number {
  if (value === "sunday") return 0;
  return 1;
}

export const payPeriodService = {
  async getSettings(organizationId: number) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        payPeriodType: true,
        weekStartDay: true,
        biWeeklyAnchorDate: true,
        cutoffTime: true,
      },
    });

    if (!org) return null;

    return {
      payPeriodType: org.payPeriodType.toLowerCase(), // "WEEKLY" -> "weekly"
      weekStartDay: weekStartIntToString(org.weekStartDay ?? 1),
      anchorDate: org.biWeeklyAnchorDate
        ? org.biWeeklyAnchorDate.toISOString().slice(0, 10)
        : "",
      cutoffTime: org.cutoffTime ?? "17:00",
    };
  },

  async updateSettings(
    organizationId: number,
    data: {
      payPeriodType: string;
      weekStartDay: string;
      anchorDate?: string;
      cutoffTime?: string;
    }
  ) {
    const payPeriodTypeDb = data.payPeriodType.toUpperCase(); // "weekly" -> "WEEKLY"

    let anchor: Date | null = null;
    if (data.anchorDate) {
      anchor = new Date(data.anchorDate + "T00:00:00.000Z");
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        payPeriodType: payPeriodTypeDb,
        weekStartDay: weekStartStringToInt(data.weekStartDay),
        biWeeklyAnchorDate: anchor,
        cutoffTime: data.cutoffTime ?? "17:00",
      },
    });
  },
};
