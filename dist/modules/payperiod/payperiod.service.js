"use strict";
// src/modules/payperiod/payperiod.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePayPeriod = computePayPeriod;
/**
 * -----------------------------------------------------
 * WEEKLY
 * -----------------------------------------------------
 */
function weekly(org, ref) {
    const start = new Date(ref);
    const weekStartDay = org.weekStartDay ?? 0; // 0 = Sunday
    const diff = (ref.getDay() - weekStartDay + 7) % 7;
    start.setDate(ref.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { startDate: start, endDate: end };
}
/**
 * -----------------------------------------------------
 * BI-WEEKLY
 * -----------------------------------------------------
 */
function biweekly(org, ref) {
    if (!org.biWeeklyAnchorDate) {
        throw new Error("biWeeklyAnchorDate is required for BIWEEKLY.");
    }
    const anchor = new Date(org.biWeeklyAnchorDate);
    anchor.setHours(0, 0, 0, 0);
    const start = new Date(anchor);
    // Walk forward until we pass ref
    while (start <= ref) {
        start.setDate(start.getDate() + 14);
    }
    // Step back one period to get the active window
    start.setDate(start.getDate() - 14);
    const end = new Date(start);
    end.setDate(start.getDate() + 14);
    return { startDate: start, endDate: end };
}
/**
 * -----------------------------------------------------
 * SEMI-MONTHLY
 * -----------------------------------------------------
 */
function semiMonthly(_org, ref) {
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const day = ref.getDate();
    if (day <= 15) {
        return {
            startDate: new Date(year, month, 1),
            endDate: new Date(year, month, 16),
        };
    }
    return {
        startDate: new Date(year, month, 16),
        endDate: new Date(year, month + 1, 1),
    };
}
/**
 * -----------------------------------------------------
 * MONTHLY
 * -----------------------------------------------------
 */
function monthly(_org, ref) {
    const year = ref.getFullYear();
    const month = ref.getMonth();
    return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 1),
    };
}
/**
 * -----------------------------------------------------
 * Compute pay period (string-union safe)
 * -----------------------------------------------------
 */
function computePayPeriod(org, refDate) {
    switch (org.payPeriodType) {
        case "WEEKLY":
            return weekly(org, refDate);
        case "BIWEEKLY":
            return biweekly(org, refDate);
        case "SEMIMONTHLY":
            return semiMonthly(org, refDate);
        case "MONTHLY":
            return monthly(org, refDate);
        default:
            throw new Error(`Unsupported pay period type: ${org.payPeriodType}`);
    }
}
