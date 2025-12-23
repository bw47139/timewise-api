// src/utils/payPeriodEngine.ts

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Supported pay-period types (canonical)
 */
export type PayPeriodType = "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";

/**
 * -----------------------------------------------------
 * Pay-period settings input
 * -----------------------------------------------------
 */
export interface PayPeriodSettings {
  payPeriodType: PayPeriodType;

  weekStartDay?: number | null; // 0=Sun .. 6=Sat
  biWeeklyAnchorDate?: Date | string | null;

  semiMonthCut1?: number | null; // default 1
  semiMonthCut2?: number | null; // default 16

  monthlyCutDay?: number | null; // default 1

  cutoffTime?: string | null; // "HH:mm"
  timezone?: string | null; // reserved for future use
}

/**
 * -----------------------------------------------------
 * Pay-period calculation result
 * -----------------------------------------------------
 */
export interface PayPeriodResult {
  type: PayPeriodType;
  label: string;

  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"

  queryStartUtc: string; // ISO
  queryEndUtc: string; // ISO (exclusive)
}

/**
 * -----------------------------------------------------
 * Helpers
 * -----------------------------------------------------
 */

function parseCutoff(
  cutoffTime?: string | null
): { hour: number; minute: number } {
  if (!cutoffTime) return { hour: 0, minute: 0 };

  const [hStr, mStr] = cutoffTime.split(":");
  const h = Number(hStr);
  const m = Number(mStr);

  return {
    hour: isNaN(h) ? 0 : h,
    minute: isNaN(m) ? 0 : m,
  };
}

/**
 * -----------------------------------------------------
 * WEEKLY
 * -----------------------------------------------------
 */
function computeWeekly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  const weekStart = settings.weekStartDay ?? 1; // default Monday
  let start = target.startOf("day");

  while (start.day() !== weekStart) {
    start = start.subtract(1, "day");
  }

  const end = start.add(6, "day");
  return { start, end };
}

/**
 * -----------------------------------------------------
 * BI-WEEKLY
 * -----------------------------------------------------
 */
function computeBiWeekly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  const anchorInput = settings.biWeeklyAnchorDate;

  if (!anchorInput) {
    return computeWeekly(settings, target);
  }

  const anchor = dayjs(anchorInput).startOf("day");
  const diffDays = target.startOf("day").diff(anchor, "day");
  const offset = ((diffDays % 14) + 14) % 14;

  const start = target.startOf("day").subtract(offset, "day");
  const end = start.add(13, "day");

  return { start, end };
}

/**
 * -----------------------------------------------------
 * SEMI-MONTHLY
 * -----------------------------------------------------
 */
function computeSemiMonthly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  const cut1 = settings.semiMonthCut1 ?? 1;
  const cut2 = settings.semiMonthCut2 ?? 16;

  const d = target.date();
  const thisMonth = target.startOf("month");

  if (d < cut1) {
    const prevMonth = thisMonth.subtract(1, "month");
    const start = prevMonth.date(cut2);
    const end = thisMonth.date(cut1).subtract(1, "day");
    return { start, end };
  }

  if (d < cut2) {
    const start = thisMonth.date(cut1);
    const end = thisMonth.date(cut2 - 1);
    return { start, end };
  }

  const start = thisMonth.date(cut2);
  const end = thisMonth.endOf("month");
  return { start, end };
}

/**
 * -----------------------------------------------------
 * MONTHLY
 * -----------------------------------------------------
 */
function computeMonthly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  const cut = settings.monthlyCutDay ?? 1;

  if (cut <= 1) {
    const start = target.startOf("month");
    const end = target.endOf("month");
    return { start, end };
  }

  const d = target.date();
  const thisMonth = target.startOf("month");

  if (d >= cut) {
    const start = thisMonth.date(cut);
    const end = thisMonth.add(1, "month").date(cut).subtract(1, "day");
    return { start, end };
  }

  const start = thisMonth.subtract(1, "month").date(cut);
  const end = thisMonth.date(cut - 1);
  return { start, end };
}

/**
 * -----------------------------------------------------
 * Core engine
 * -----------------------------------------------------
 */
export function getPayPeriodRange(
  settings: PayPeriodSettings,
  targetDate: Date
): PayPeriodResult {
  const type = settings.payPeriodType;
  const target = dayjs(targetDate).utc().startOf("day");

  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  switch (type) {
    case "WEEKLY":
      ({ start, end } = computeWeekly(settings, target));
      break;

    case "BIWEEKLY":
      ({ start, end } = computeBiWeekly(settings, target));
      break;

    case "SEMIMONTHLY":
      ({ start, end } = computeSemiMonthly(settings, target));
      break;

    case "MONTHLY":
      ({ start, end } = computeMonthly(settings, target));
      break;

    default:
      ({ start, end } = computeWeekly(settings, target));
      break;
  }

  const { hour, minute } = parseCutoff(settings.cutoffTime);

  const queryStart = start.hour(hour).minute(minute).second(0).millisecond(0);

  // end is inclusive in calendar terms, so queryEnd is next day at cutoff (exclusive)
  const queryEnd = end
    .add(1, "day")
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0);

  const label = `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`;

  return {
    type,
    label,
    startDate: start.format("YYYY-MM-DD"),
    endDate: end.format("YYYY-MM-DD"),
    queryStartUtc: queryStart.toDate().toISOString(),
    queryEndUtc: queryEnd.toDate().toISOString(),
  };
}

/**
 * -----------------------------------------------------
 * Effective settings builder (Org + Location)
 * -----------------------------------------------------
 */
export function buildEffectiveSettingsFromOrgAndLocation(opts: {
  organization: any;
  location?: any | null;
}): PayPeriodSettings {
  const { organization, location } = opts;

  return {
    payPeriodType:
      (location?.payPeriodType ??
        organization?.payPeriodType ??
        "WEEKLY") as PayPeriodType,

    weekStartDay: location?.weekStartDay ?? organization?.weekStartDay ?? 1,

    biWeeklyAnchorDate:
      location?.biWeeklyAnchorDate ?? organization?.biWeeklyAnchorDate ?? null,

    semiMonthCut1: location?.semiMonthCut1 ?? undefined,
    semiMonthCut2: location?.semiMonthCut2 ?? undefined,

    monthlyCutDay: location?.monthlyCutDay ?? undefined,

    cutoffTime: location?.cutoffTime ?? organization?.cutoffTime ?? "00:00",

    timezone: location?.timezone ?? organization?.timezone ?? null,
  };
}
