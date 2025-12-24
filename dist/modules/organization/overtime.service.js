"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overtimeService = void 0;
// src/modules/organization/overtime.service.ts
const prisma_1 = require("../../prisma");
exports.overtimeService = {
    async getRules(organizationId) {
        const org = await prisma_1.prisma.organization.findUnique({
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
        if (!org)
            return null;
        return {
            dailyEnabled: org.overtimeDailyEnabled,
            dailyThreshold: org.overtimeDailyThresholdHours,
            weeklyEnabled: org.overtimeWeeklyEnabled,
            weeklyThreshold: org.overtimeWeeklyThresholdHours,
            doubleTimeEnabled: org.doubleTimeEnabled,
            doubleTimeThreshold: org.doubletimeDailyThresholdHours,
        };
    },
    async updateRules(organizationId, data) {
        return prisma_1.prisma.organization.update({
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
