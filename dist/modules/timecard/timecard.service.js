"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timecardService = void 0;
exports.getTimecardForRange = getTimecardForRange;
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
const prisma = new client_1.PrismaClient();
/* ======================================================
   ✅ REQUIRED EXPORT — USED BY CONTROLLER / ROUTES
   ====================================================== */
/**
 * Load punches for an employee within a date range
 * (Used by timecard.controller.ts and reports)
 */
async function getTimecardForRange(employeeId, start, end) {
    return prisma.punch.findMany({
        where: {
            employeeId,
            timestamp: {
                gte: start,
                lte: end,
            },
        },
        orderBy: { timestamp: "asc" },
    });
}
/* ======================================================
   MAIN SERVICE
   ====================================================== */
exports.timecardService = {
    async getSummary(employeeId, start, end) {
        const startDate = dayjs_1.default.utc(start).startOf("day").toDate();
        const endDate = dayjs_1.default.utc(end).endOf("day").toDate();
        // LOAD EMPLOYEE + LOCATION + ORG
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { organization: true, location: true },
        });
        if (!employee)
            throw new Error("Employee not found");
        const org = employee.organization;
        const loc = employee.location; // ⭐ LOCATION OVERRIDES
        // FETCH PUNCHES
        const punches = await prisma.punch.findMany({
            where: {
                employeeId,
                timestamp: { gte: startDate, lte: endDate },
            },
            orderBy: { timestamp: "asc" },
        });
        // GROUP BY DAY
        const daysMap = new Map();
        for (const p of punches) {
            const d = dayjs_1.default.utc(p.timestamp).format("YYYY-MM-DD");
            if (!daysMap.has(d))
                daysMap.set(d, []);
            daysMap.get(d).push(p);
        }
        const dailySummaries = [];
        let totalRegular = 0;
        let totalOT = 0;
        let totalDT = 0;
        let totalAutoLunch = 0;
        let totalNet = 0;
        let totalExactSeconds = 0;
        let totalExactMinutes = 0;
        let totalExactHours = 0;
        for (const [date, dayPunches] of daysMap.entries()) {
            dayPunches.sort((a, b) => dayjs_1.default.utc(a.timestamp).valueOf() -
                dayjs_1.default.utc(b.timestamp).valueOf());
            const paired = pairPunches(dayPunches);
            const totals = calculateDailyTotals(paired, org, loc); // ⭐ LOCATION RULES ADDED
            dailySummaries.push({
                date,
                punches: dayPunches,
                pairedShifts: paired,
                rawHours: totals.rawHours,
                autoLunchHours: totals.autoLunchHours,
                netHours: totals.netHours,
                regularHours: totals.regularHours,
                overtimeHours: totals.overtimeHours,
                doubletimeHours: totals.doubletimeHours,
                exactSeconds: totals.exactSeconds,
                exactMinutes: totals.exactMinutes,
                exactHours: totals.exactHours,
                decimalHours: round2(totals.exactHours),
                formattedTotal: formatHoursToHHMM(totals.netHours),
                formattedRegular: formatHoursToHHMM(totals.regularHours),
                formattedOvertime: formatHoursToHHMM(totals.overtimeHours),
                formattedDoubletime: formatHoursToHHMM(totals.doubletimeHours),
            });
            totalRegular += totals.regularHours;
            totalOT += totals.overtimeHours;
            totalDT += totals.doubletimeHours;
            totalAutoLunch += totals.autoLunchHours;
            totalNet += totals.netHours;
            totalExactSeconds += totals.exactSeconds;
            totalExactMinutes += totals.exactMinutes;
            totalExactHours += totals.exactHours;
        }
        dailySummaries.sort((a, b) => a.date.localeCompare(b.date));
        return {
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                organizationId: employee.organizationId,
                locationId: employee.locationId,
                organizationName: org?.name ?? null,
                locationName: loc?.name ?? null,
            },
            range: { start, end },
            totals: {
                regularHours: round2(totalRegular),
                overtimeHours: round2(totalOT),
                doubletimeHours: round2(totalDT),
                autoLunchHours: round2(totalAutoLunch),
                workedHours: round2(totalNet),
                exactSeconds: totalExactSeconds,
                exactMinutes: totalExactMinutes,
                exactHours: totalExactHours,
                decimalHours: round2(totalExactHours),
                formattedWorked: formatHoursToHHMM(totalNet),
                formattedRegular: formatHoursToHHMM(totalRegular),
                formattedOvertime: formatHoursToHHMM(totalOT),
                formattedDoubletime: formatHoursToHHMM(totalDT),
            },
            days: dailySummaries.map((d) => ({
                ...d,
                rawHours: round2(d.rawHours),
                autoLunchHours: round2(d.autoLunchHours),
                netHours: round2(d.netHours),
                regularHours: round2(d.regularHours),
                overtimeHours: round2(d.overtimeHours),
                doubletimeHours: round2(d.doubletimeHours),
                decimalHours: round2(d.decimalHours),
            })),
        };
    },
};
/* -----------------------------
   Pair IN → OUT Punches
----------------------------- */
function pairPunches(punches) {
    const pairs = [];
    let currentIn = null;
    for (const p of punches) {
        if (p.type === "IN") {
            currentIn = p;
        }
        else if (p.type === "OUT" && currentIn) {
            const start = dayjs_1.default.utc(currentIn.timestamp);
            const end = dayjs_1.default.utc(p.timestamp);
            const diffMs = end.diff(start);
            if (diffMs <= 0) {
                currentIn = null;
                continue;
            }
            const diffSeconds = diffMs / 1000;
            const diffMinutes = diffSeconds / 60;
            const diffHours = diffMinutes / 60;
            pairs.push({
                IN: currentIn,
                OUT: p,
                exactSeconds: diffSeconds,
                exactMinutes: diffMinutes,
                exactHours: diffHours,
                decimalHours: round2(diffHours),
            });
            currentIn = null;
        }
    }
    return pairs;
}
/* -----------------------------
   Daily Totals (LOCATION AWARE)
----------------------------- */
function calculateDailyTotals(pairs, org, loc) {
    let rawMinutes = 0;
    let exactSeconds = 0;
    let exactMinutes = 0;
    let exactHours = 0;
    for (const p of pairs) {
        rawMinutes += p.exactMinutes;
        exactSeconds += p.exactSeconds;
        exactMinutes += p.exactMinutes;
        exactHours += p.exactHours;
    }
    const rawHours = rawMinutes / 60;
    const autoLunchEnabled = loc?.autoLunchEnabled ?? org?.autoLunchEnabled;
    const autoLunchMinutes = loc?.autoLunchMinutes ?? org?.autoLunchMinutes;
    const autoLunchMinimumShift = loc?.autoLunchMinimumShift ?? org?.autoLunchMinimumShift;
    let autoLunchDeduct = 0;
    if (autoLunchEnabled && rawHours >= autoLunchMinimumShift) {
        autoLunchDeduct = autoLunchMinutes;
    }
    let netMinutes = Math.max(0, rawMinutes - autoLunchDeduct);
    const netHours = netMinutes / 60;
    const otDaily = (loc?.overtimeDailyThresholdHours ??
        org?.overtimeDailyThresholdHours ??
        8) * 60;
    const dtDaily = (loc?.doubletimeDailyThresholdHours ??
        org?.doubletimeDailyThresholdHours ??
        12) * 60;
    let regularMinutes = netMinutes;
    let otMinutes = 0;
    let dtMinutes = 0;
    if (netMinutes > dtDaily) {
        dtMinutes = netMinutes - dtDaily;
        netMinutes = dtDaily;
    }
    if (netMinutes > otDaily) {
        otMinutes = netMinutes - otDaily;
        regularMinutes = otDaily;
    }
    else {
        regularMinutes = netMinutes;
    }
    return {
        rawHours,
        autoLunchHours: autoLunchDeduct / 60,
        netHours,
        regularHours: regularMinutes / 60,
        overtimeHours: otMinutes / 60,
        doubletimeHours: dtMinutes / 60,
        exactSeconds,
        exactMinutes,
        exactHours,
    };
}
/* -----------------------------
   Utilities
----------------------------- */
function round2(n) {
    return Math.round(n * 100) / 100;
}
function formatHoursToHHMM(hours) {
    if (!hours || hours <= 0)
        return "00:00";
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    if (s > 0) {
        const ss = s.toString().padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }
    return `${hh}:${mm}`;
}
