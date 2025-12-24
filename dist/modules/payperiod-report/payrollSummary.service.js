"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePayrollSummary = generatePayrollSummary;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const WEEKLY_OT_THRESHOLD = 40;
const OVERTIME_MULTIPLIER = 1.5;
/**
 * ======================================================
 * Generate Payroll Summary (WITH DRILL-DOWN)
 *
 * Rule A:
 * Hourly rate = latest PayRate where
 * effectiveDate <= payPeriod.endDate
 *
 * Rule B:
 * Weekly overtime:
 * - First 40 hours = regular
 * - Hours > 40 = overtime (1.5x)
 *
 * Drill-down:
 * - Per-day hours returned for UI
 * ======================================================
 */
async function generatePayrollSummary(organizationId, payPeriod) {
    const startDate = new Date(payPeriod.startDate);
    const endDate = new Date(payPeriod.endDate);
    // --------------------------------------------------
    // 1. Load employees
    // --------------------------------------------------
    const employees = await prisma.employee.findMany({
        where: {
            organizationId,
            ...(payPeriod.locationId
                ? { locationId: payPeriod.locationId }
                : {}),
            isDeleted: false,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    if (employees.length === 0) {
        return emptySummary();
    }
    const employeeIds = employees.map((e) => e.id);
    // --------------------------------------------------
    // 2. Load punches
    // --------------------------------------------------
    const punches = await prisma.punch.findMany({
        where: {
            employeeId: { in: employeeIds },
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            employeeId: true,
            type: true,
            timestamp: true,
        },
        orderBy: [
            { employeeId: "asc" },
            { timestamp: "asc" },
        ],
    });
    // total hours per employee
    const totalHoursMap = computeTotalHours(punches);
    // daily hours per employee (for drill-down)
    const dailyHoursMap = computeDailyHours(punches);
    // --------------------------------------------------
    // 3. Resolve hourly rates
    // --------------------------------------------------
    const rates = await prisma.payRate.findMany({
        where: {
            employeeId: { in: employeeIds },
            effectiveDate: { lte: endDate },
        },
        orderBy: [
            { employeeId: "asc" },
            { effectiveDate: "desc" },
        ],
    });
    const rateMap = new Map();
    for (const r of rates) {
        if (!rateMap.has(r.employeeId)) {
            rateMap.set(r.employeeId, r.rate);
        }
    }
    // --------------------------------------------------
    // 4. Build employee rows
    // --------------------------------------------------
    const employeeRows = employees.map((emp) => {
        const totalHours = totalHoursMap.get(emp.id) ?? 0;
        const rate = rateMap.get(emp.id) ?? 0;
        const regularHours = Math.min(totalHours, WEEKLY_OT_THRESHOLD);
        const overtimeHours = Math.max(totalHours - WEEKLY_OT_THRESHOLD, 0);
        const regularPay = regularHours * rate;
        const overtimePay = overtimeHours * rate * OVERTIME_MULTIPLIER;
        return {
            employeeId: emp.id,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            rate: round2(rate),
            regularHours: round2(regularHours),
            overtimeHours: round2(overtimeHours),
            doubletimeHours: 0,
            ptoHours: 0,
            grossPay: round2(regularPay + overtimePay),
            // ⭐ DRILL-DOWN DATA
            days: dailyHoursMap.get(emp.id) ?? [],
        };
    });
    // --------------------------------------------------
    // 5. Totals
    // --------------------------------------------------
    const totals = employeeRows.reduce((acc, r) => {
        acc.totalRegularHours += r.regularHours;
        acc.totalOvertimeHours += r.overtimeHours;
        acc.totalGrossPay += r.grossPay;
        return acc;
    }, {
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalDoubletimeHours: 0,
        totalPtoHours: 0,
        totalGrossPay: 0,
    });
    return {
        summary: {
            totalRegularHours: round2(totals.totalRegularHours),
            totalOvertimeHours: round2(totals.totalOvertimeHours),
            totalDoubletimeHours: 0,
            totalPtoHours: 0,
            totalGrossPay: round2(totals.totalGrossPay),
        },
        employees: employeeRows,
    };
}
/**
 * ======================================================
 * Helpers
 * ======================================================
 */
// total hours per employee
function computeTotalHours(punches) {
    const map = new Map();
    let currentEmployee = null;
    let lastIn = null;
    for (const p of punches) {
        if (currentEmployee !== p.employeeId) {
            currentEmployee = p.employeeId;
            lastIn = null;
        }
        if (p.type === "IN") {
            lastIn = p.timestamp;
            continue;
        }
        if (p.type === "OUT" && lastIn) {
            const diffMs = p.timestamp.getTime() - lastIn.getTime();
            if (diffMs > 0) {
                const hours = diffMs / 1000 / 60 / 60;
                map.set(p.employeeId, (map.get(p.employeeId) ?? 0) + hours);
            }
            lastIn = null;
        }
    }
    return map;
}
// daily hours per employee (for drill-down UI)
function computeDailyHours(punches) {
    const map = new Map();
    let currentEmployee = null;
    let lastIn = null;
    for (const p of punches) {
        if (currentEmployee !== p.employeeId) {
            currentEmployee = p.employeeId;
            lastIn = null;
        }
        if (p.type === "IN") {
            lastIn = p.timestamp;
            continue;
        }
        if (p.type === "OUT" && lastIn) {
            const diffMs = p.timestamp.getTime() - lastIn.getTime();
            if (diffMs > 0) {
                const hours = diffMs / 1000 / 60 / 60;
                const dayKey = lastIn.toISOString().slice(0, 10);
                if (!map.has(p.employeeId)) {
                    map.set(p.employeeId, new Map());
                }
                const dayMap = map.get(p.employeeId);
                dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + hours);
            }
            lastIn = null;
        }
    }
    const result = new Map();
    for (const [empId, dayMap] of map.entries()) {
        result.set(empId, Array.from(dayMap.entries()).map(([date, hours]) => ({
            date,
            hours: round2(hours),
        })));
    }
    return result;
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
function emptySummary() {
    return {
        summary: {
            totalRegularHours: 0,
            totalOvertimeHours: 0,
            totalDoubletimeHours: 0,
            totalPtoHours: 0,
            totalGrossPay: 0,
        },
        employees: [],
    };
}
