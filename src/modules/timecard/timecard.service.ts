// src/modules/timecard/timecard.service.ts

import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const prisma = new PrismaClient();

/* -----------------------------
   Types
----------------------------- */

interface PairedShift {
  IN: any;
  OUT: any;
  exactSeconds: number;
  exactMinutes: number;
  exactHours: number;
  decimalHours: number;
}

interface DailySummary {
  date: string;
  punches: any[];
  pairedShifts: PairedShift[];
  rawHours: number;
  autoLunchHours: number;
  netHours: number;
  regularHours: number;
  overtimeHours: number;
  doubletimeHours: number;

  exactSeconds: number;
  exactMinutes: number;
  exactHours: number;
  decimalHours: number;

  formattedTotal: string;
  formattedRegular: string;
  formattedOvertime: string;
  formattedDoubletime: string;
}

export const timecardService = {
  async getSummary(employeeId: number, start: string, end: string) {
    const startDate = dayjs.utc(start).startOf("day").toDate();
    const endDate = dayjs.utc(end).endOf("day").toDate();

    // LOAD EMPLOYEE + LOCATION + ORG
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { organization: true, location: true },
    });

    if (!employee) throw new Error("Employee not found");

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
    const daysMap = new Map<string, any[]>();
    for (const p of punches) {
      const d = dayjs.utc(p.timestamp).format("YYYY-MM-DD");
      if (!daysMap.has(d)) daysMap.set(d, []);
      daysMap.get(d)!.push(p);
    }

    const dailySummaries: DailySummary[] = [];

    let totalRegular = 0;
    let totalOT = 0;
    let totalDT = 0;
    let totalAutoLunch = 0;
    let totalNet = 0;

    let totalExactSeconds = 0;
    let totalExactMinutes = 0;
    let totalExactHours = 0;

    for (const [date, dayPunches] of daysMap.entries()) {
      dayPunches.sort(
        (a, b) => dayjs.utc(a.timestamp).valueOf() - dayjs.utc(b.timestamp).valueOf()
      );

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

function pairPunches(punches: any[]): PairedShift[] {
  const pairs: PairedShift[] = [];
  let currentIn: any | null = null;

  for (const p of punches) {
    if (p.type === "IN") {
      currentIn = p;
    } else if (p.type === "OUT" && currentIn) {
      const start = dayjs.utc(currentIn.timestamp);
      const end = dayjs.utc(p.timestamp);

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
   Daily Totals (UPDATED FOR LOCATION)
----------------------------- */

function calculateDailyTotals(
  pairs: PairedShift[],
  org: any,
  loc: any
) {
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

  /* ------------------------------------------
     ⭐ AUTO-LUNCH — LOCATION OVERRIDES ORG
  ------------------------------------------ */
  const autoLunchEnabled = loc?.autoLunchEnabled ?? org?.autoLunchEnabled;
  const autoLunchMinutes = loc?.autoLunchMinutes ?? org?.autoLunchMinutes;
  const autoLunchMinimumShift =
    loc?.autoLunchMinimumShift ?? org?.autoLunchMinimumShift;

  let autoLunchDeduct = 0;

  if (autoLunchEnabled && rawHours >= autoLunchMinimumShift) {
    autoLunchDeduct = autoLunchMinutes; // minutes
  }

  let netMinutes = Math.max(0, rawMinutes - autoLunchDeduct);
  const netHours = netMinutes / 60;

  /* ------------------------------------------
     ⭐ OVERTIME — LOCATION OVERRIDES
  ------------------------------------------ */

  const otDaily = (loc?.overtimeDailyThresholdHours ?? org?.overtimeDailyThresholdHours ?? 8) * 60;
  const dtDaily = (loc?.doubletimeDailyThresholdHours ?? org?.doubletimeDailyThresholdHours ?? 12) * 60;

  let regularMinutes = netMinutes;
  let otMinutes = 0;
  let dtMinutes = 0;

  // Double-time first
  if (netMinutes > dtDaily) {
    dtMinutes = netMinutes - dtDaily;
    netMinutes = dtDaily;
  }

  // Overtime next
  if (netMinutes > otDaily) {
    otMinutes = netMinutes - otDaily;
    regularMinutes = otDaily;
  } else {
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

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatHoursToHHMM(hours: number): string {
  if (!hours || hours <= 0) return "00:00";

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
