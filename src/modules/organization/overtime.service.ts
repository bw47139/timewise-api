// src/modules/organization/overtime.service.ts
import { prisma } from "../../prisma";

export const overtimeService = {
  async getRules(organizationId: number) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        overtimeDailyThresholdHours: true,
        overtimeWeeklyThresholdHours: true,
        doubletimeDailyThresholdHours: true,
        overtimeDailyEnabled: true,
        overtimeWeeklyEnabled: true,
        doubleTimeEnabled: true,
      },
    });

    if (!org) return null;

    return {
      dailyEnabled: org.overtimeDailyEnabled,
      dailyThreshold: org.overtimeDailyThresholdHours,
      weeklyEnabled: org.overtimeWeeklyEnabled,
      weeklyThreshold: org.overtimeWeeklyThresholdHours,
      doubleTimeEnabled: org.doubleTimeEnabled,
      doubleTimeThreshold: org.doubletimeDailyThresholdHours,
    };
  },

  async updateRules(
    organizationId: number,
    data: {
      dailyEnabled: boolean;
      dailyThreshold: number;
      weeklyEnabled: boolean;
      weeklyThreshold: number;
      doubleTimeEnabled: boolean;
      doubleTimeThreshold: number;
    }
  ) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        overtimeDailyEnabled: data.dailyEnabled,
        overtimeDailyThresholdHours: data.dailyThreshold,
        overtimeWeeklyEnabled: data.weeklyEnabled,
        overtimeWeeklyThresholdHours: data.weeklyThreshold,
        doubleTimeEnabled: data.doubleTimeEnabled,
        doubletimeDailyThresholdHours: data.doubleTimeThreshold,
      },
    });
  },
};
