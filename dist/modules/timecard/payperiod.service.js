"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayPeriodConfig = getPayPeriodConfig;
exports.getPayPeriodForDate = getPayPeriodForDate;
const client_1 = require("@prisma/client");
const payperiod_engine_1 = require("../../utils/payperiod.engine");
const prisma = new client_1.PrismaClient();
/**
 * ------------------------------------------------------
 * Load pay-period configuration
 * (ONLY fields that exist in Prisma)
 * ------------------------------------------------------
 */
async function getPayPeriodConfig(organizationId) {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
            payPeriodType: true,
            weekStartDay: true,
            biweeklyAnchorDate: true,
        },
    });
    if (!org || !org.payPeriodType) {
        throw new Error("Organization pay period config missing");
    }
    return {
        payPeriodType: org.payPeriodType,
        weekStartDay: org.weekStartDay ?? 1,
        biweeklyAnchorDate: org.biweeklyAnchorDate ?? null,
        // 🚨 NOT IN PRISMA — MUST BE NULL
        semiMonthCut1: null,
        semiMonthCut2: null,
        monthlyCutDay: null,
        cutoffTime: null,
    };
}
/**
 * ------------------------------------------------------
 * Resolve pay period range for a date
 * ------------------------------------------------------
 */
async function getPayPeriodForDate(organizationId, date) {
    const config = await getPayPeriodConfig(organizationId);
    const period = (0, payperiod_engine_1.getPayPeriodRange)({
        payPeriodType: config.payPeriodType,
        weekStartDay: config.weekStartDay,
        biWeeklyAnchorDate: config.biweeklyAnchorDate,
        // engine-safe optional fields
        semiMonthCut1: null,
        semiMonthCut2: null,
        monthlyCutDay: null,
        cutoffTime: null,
    }, date);
    return {
        type: period.type,
        start: period.startDate,
        end: period.endDate,
    };
}
