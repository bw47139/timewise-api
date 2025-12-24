"use strict";
// src/modules/organization/pay-period.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.payPeriodService = void 0;
const prisma_1 = require("../../prisma");
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
];
/**
 * -----------------------------------------------------
 * Internal helpers
 * -----------------------------------------------------
 */
function weekStartIntToString(value) {
    if (value === 0)
        return "sunday";
    return "monday";
}
function weekStartStringToInt(value) {
    return value === "sunday" ? 0 : 1;
}
function payPeriodEnumToUi(value) {
    // UI expects lowercase
    return String(value).toLowerCase();
}
function payPeriodUiToEnum(value) {
    const upper = value.toUpperCase().trim();
    if (!VALID_PAY_PERIOD_TYPES.includes(upper)) {
        throw new Error(`Invalid pay period type: ${value}`);
    }
    // Safe cast: validated against runtime list
    return upper;
}
/**
 * -----------------------------------------------------
 * Service
 * -----------------------------------------------------
 */
exports.payPeriodService = {
    /**
     * Load organization-level pay-period settings
     */
    async getSettings(organizationId) {
        const org = await prisma_1.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                payPeriodType: true,
                weekStartDay: true,
                biweeklyAnchorDate: true,
                cutoffTime: true,
            },
        });
        if (!org)
            return null;
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
    async updateSettings(organizationId, data) {
        const payPeriodType = payPeriodUiToEnum(data.payPeriodType);
        let anchorDate = null;
        if (data.anchorDate) {
            // store at midnight UTC
            anchorDate = new Date(`${data.anchorDate}T00:00:00.000Z`);
        }
        return prisma_1.prisma.organization.update({
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
