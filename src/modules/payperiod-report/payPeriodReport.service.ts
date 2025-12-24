// src/modules/payperiod-report/payPeriodReport.service.ts

import { PrismaClient } from "@prisma/client";

import { computePayPeriod } from "../payperiod/payperiod.service";

const prisma = new PrismaClient();

/** Small helper to round milliseconds into hours with 2 decimals */
function msToHours(ms: number): number {
  return Math.round((ms / 1000 / 60 / 60) * 100) / 100;
}

/**
 * Generate a pay-period summary for one employee in one organization,
 * for whatever pay-period contains refDate.
 */
export async function generatePayPeriodSummary(
  organizationId: number,
  employeeId: number,
  refDate: Date
) {
  // 1) Load organization so we know its pay-period + overtime rules
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return null;

  // 2) Compute this pay period (start/end) using your existing engine
  const { startDate, endDate } = computePayPeriod(org, refDate);

  // 3) Load all punches for this employee inside this pay period
  const punches = await prisma.punch.findMany({
    where: {
      employeeId,
      timestamp: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  // 4) Build IN → OUT sessions for each day
  const sessions: {
    date: string;
    in: Date;
    out: Date | null;
    workedMs: number;
  }[] = [];

  let lastIn: Date | null = null;

  for (const p of punches) {
    if (p.type === "IN") {
      lastIn = p.timestamp;
    } else if (p.type === "OUT" && lastIn) {
      const workedMs = p.timestamp.getTime() - lastIn.getTime();
      sessions.push({
        date: lastIn.toISOString().split("T")[0], // YYYY-MM-DD
        in: lastIn,
        out: p.timestamp,
        workedMs,
      });
      lastIn = null;
    }
  }

  // 5) Group sessions by day
  const dayMap: Record<string, any> = {};

  for (const s of sessions) {
    if (!dayMap[s.date]) {
      dayMap[s.date] = {
        date: s.date,
        workedMs: 0,
        sessions: [] as typeof sessions,
      };
    }
    dayMap[s.date].workedMs += s.workedMs;
    dayMap[s.date].sessions.push(s);
  }

  // 6) Apply simple auto-lunch rule (if enabled)
  for (const day of Object.values(dayMap)) {
    let workedHours = msToHours(day.workedMs);

    if (org.autoLunchEnabled && workedHours >= org.autoLunchMinimumShift) {
      const deductionMs = org.autoLunchMinutes * 60 * 1000;
      day.workedMs -= deductionMs;
      day.autoLunchApplied = true;
    } else {
      day.autoLunchApplied = false;
    }
  }

  // 7) Daily overtime & double time
  for (const day of Object.values(dayMap)) {
    const hours = msToHours(day.workedMs);

    day.regular = Math.min(hours, org.overtimeDailyThresholdHours);
    day.dailyOvertime = Math.max(0, hours - org.overtimeDailyThresholdHours);
    day.doubletime = Math.max(0, hours - org.doubletimeDailyThresholdHours);
  }

  // 8) Weekly overtime (simple: total hours in period vs weekly threshold)
  let weeklyHours = 0;
  let weeklyOvertime = 0;

  for (const date of Object.keys(dayMap).sort()) {
    const day = dayMap[date];
    weeklyHours += msToHours(day.workedMs);

    if (weeklyHours > org.overtimeWeeklyThresholdHours) {
      weeklyOvertime = weeklyHours - org.overtimeWeeklyThresholdHours;
    }
  }

  // 9) Build final totals
  const totals = {
    totalHours: 0,
    regularHours: 0,
    dailyOvertimeHours: 0,
    weeklyOvertimeHours: weeklyOvertime,
    doubletimeHours: 0,
    autoLunchDeductedMinutes: org.autoLunchEnabled ? org.autoLunchMinutes : 0,
  };

  for (const day of Object.values(dayMap)) {
    totals.totalHours += msToHours(day.workedMs);
    totals.regularHours += day.regular;
    totals.dailyOvertimeHours += day.dailyOvertime;
    totals.doubletimeHours += day.doubletime;
  }

  return {
    organizationId,
    employeeId,
    payPeriod: {
      startDate,
      endDate,
      type: org.payPeriodType,
    },
    totals,
    days: Object.values(dayMap),
  };
}
