"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPayrollPeriods = listPayrollPeriods;
exports.generateBiWeekly = generateBiWeekly;
exports.supervisorApprove = supervisorApprove;
exports.adminLock = adminLock;
exports.unlockPeriod = unlockPeriod;
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const prisma = new client_1.PrismaClient();
/** List payroll periods */
async function listPayrollPeriods(organizationId, locationId) {
    return prisma.payrollPeriod.findMany({
        where: { organizationId, locationId },
        orderBy: { startDate: "desc" },
    });
}
/** Generate bi-weekly (14-day) periods */
async function generateBiWeekly(organizationId, locationId, anchorDate, count = 12) {
    const periods = [];
    let start = (0, dayjs_1.default)(anchorDate);
    for (let i = 0; i < count; i++) {
        const end = start.add(13, "day"); // ← 14 days total
        const period = await prisma.payrollPeriod.upsert({
            where: {
                organizationId_locationId_startDate_endDate: {
                    organizationId,
                    locationId,
                    startDate: start.toDate(),
                    endDate: end.toDate(),
                },
            },
            update: {},
            create: {
                organizationId,
                locationId,
                startDate: start.toDate(),
                endDate: end.toDate(),
                status: client_1.PayrollPeriodStatus.OPEN,
            },
        });
        periods.push(period);
        start = end.add(1, "day");
    }
    return periods;
}
/** Supervisor approval */
async function supervisorApprove(periodId, userId) {
    return prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
            approvedByUserId: userId,
            approvedAt: new Date(),
            status: client_1.PayrollPeriodStatus.APPROVED,
        },
    });
}
/** Admin lock */
async function adminLock(periodId, userId) {
    return prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
            lockedByUserId: userId,
            lockedAt: new Date(),
            status: client_1.PayrollPeriodStatus.LOCKED,
        },
    });
}
/** Unlock period */
async function unlockPeriod(periodId) {
    return prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
            status: client_1.PayrollPeriodStatus.OPEN,
            approvedAt: null,
            approvedByUserId: null,
            lockedAt: null,
            lockedByUserId: null,
        },
    });
}
