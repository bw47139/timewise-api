"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ptoService = void 0;
// src/modules/organization/pto.service.ts
const prisma_1 = require("../../prisma");
exports.ptoService = {
    async getSettings(organizationId) {
        const org = await prisma_1.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                ptoEnabled: true,
                accrualRatePerPeriod: true,
                maxPtoBalance: true,
                carryoverEnabled: true,
                carryoverLimit: true,
            },
        });
        if (!org)
            return null;
        return {
            ptoEnabled: org.ptoEnabled,
            accrualRatePerPeriod: org.accrualRatePerPeriod,
            maxBalance: org.maxPtoBalance,
            carryoverEnabled: org.carryoverEnabled,
            carryoverLimit: org.carryoverLimit,
        };
    },
    async updateSettings(organizationId, data) {
        return prisma_1.prisma.organization.update({
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
