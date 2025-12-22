// src/modules/organization/pto.service.ts
import { prisma } from "../../prisma";

export const ptoService = {
  async getSettings(organizationId: number) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        ptoEnabled: true,
        accrualRatePerPeriod: true,
        maxPtoBalance: true,
        carryoverEnabled: true,
        carryoverLimit: true,
      },
    });

    if (!org) return null;

    return {
      ptoEnabled: org.ptoEnabled,
      accrualRatePerPeriod: org.accrualRatePerPeriod,
      maxBalance: org.maxPtoBalance,
      carryoverEnabled: org.carryoverEnabled,
      carryoverLimit: org.carryoverLimit,
    };
  },

  async updateSettings(
    organizationId: number,
    data: {
      ptoEnabled: boolean;
      accrualRatePerPeriod: number;
      maxBalance: number;
      carryoverEnabled: boolean;
      carryoverLimit: number;
    }
  ) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        ptoEnabled: data.ptoEnabled,
        accrualRatePerPeriod: data.accrualRatePerPeriod,
        maxPtoBalance: data.maxBalance,
        carryoverEnabled: data.carryoverEnabled,
        carryoverLimit: data.carryoverLimit,
      },
    });
  },
};
