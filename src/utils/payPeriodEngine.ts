// src/utils/payPeriodEngine.ts

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Supported pay-period types
 */
export type PayPeriodType = "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY" | "MONTHLY";

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
 * Result of a pay-period calculation.
 *
 * - startDate / endDate → calendar dates (inclusive)
 * - queryStartUtc / queryEndUtc → DateTime range you can use for DB queries
 *   (queryEndUtc is exclusive: >= start AND < end)
 */
export interface PayPeriodResult {
  type: PayPeriodType;
  label: string;

  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"

  queryStartUtc: string; // ISO string
  queryEndUtc: string;   // ISO string
}

/**
 * Helper: parse "HH:mm" cutoff string
 */
function parseCutoff(cutoffTime?: string | null): { hour: number; minute: number } {
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
 * WEEKLY pay-period
 * - weekStartDay: 0=Sun .. 6=Sat, default Monday(1)
 * - Period = 7 days
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
 * BI-WEEKLY pay-period
 * - Needs an anchor date
 * - Every 14 days from anchor
 */
function computeBiWeekly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  let anchorInput = settings.biWeeklyAnchorDate;
  if (!anchorInput) {
    // Fallback: treat like weekly if no anchor set
    return computeWeekly(settings, target);
  }

  const anchor = dayjs(anchorInput).startOf("day");
  const diffDays = target.startOf("day").diff(anchor, "day");
  const offset = ((diffDays % 14) + 14) % 14; // safe modulo
  const start = target.startOf("day").subtract(offset, "day");
  const end = start.add(13, "day");

  return { start, end };
}

/**
 * SEMI-MONTHLY pay-period
 * - Two cuts per month, e.g. 1-15 and 16-end
 */
function computeSemiMonthly(settings: PayPeriodSettings, target: dayjs.Dayjs) {
  const cut1 = settings.semiMonthCut1 ?? 1;
  const cut2 = settings.semiMonthCut2 ?? 16;

  const d = target.date();
  const thisMonth = target.startOf("month");

  if (d < cut1) {
    // Period is previous month (second half) up to day before cut1
    const prevMonth = thisMonth.subtract(1, "month");
    const start = prevMonth.date(cut2);
    const end = thisMonth.date(cut1).subtract(1, "day");
    return { start, end };
  } else if (d < cut2) {
    // First semi-monthly period of current month
    const start = thisMonth.date(cut1);
    const end = thisMonth.date(cut2 - 1);
    return { start, end };
  } else {
    // Second semi-monthly period of current month
    const start = thisMonth.date(cut2);
    const end = thisMonth.endOf("month");
    return { start, end };
  }
}

/**
 * MONTHLY pay-period
 * - monthlyCutDay = 1 → calendar month
 * - monthlyCutDay = 16 → 16th to 15th next month, etc.
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
    // Period starts this month at `cut`, ends day before next month's `cut`
    const start = thisMonth.date(cut);
    const end = thisMonth
      .add(1, "month")
      .date(cut)
      .subtract(1, "day");
    return { start, end };
  } else {
    // Period starts previous month at `cut`, ends day before this month's `cut`
    const start = thisMonth
      .subtract(1, "month")
      .date(cut);
    const end = thisMonth.date(cut - 1);
    return { start, end };
  }
}

/**
 * Core engine: given settings + target date, return pay-period range.
 *
 * NOTE:
 * - `targetDate` can be "any date in the period".
 * - Works for WEEKLY, BIWEEKLY, SEMIMONTHLY, MONTHLY.
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
      // Fallback safe behavior
      ({ start, end } = computeWeekly(settings, target));
      break;
  }

  // Cutoff handling: where does the "day" flip for timecard queries?
  const { hour, minute } = parseCutoff(settings.cutoffTime);

  const queryStart = start
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0);

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
 * Helper you will use later in services:
 * - Merges Organization + optional Location overrides into a single settings object.
 *
 * You can safely call this from your timecard or report services.
 */
export function buildEffectiveSettingsFromOrgAndLocation(opts: {
  organization: any;
  location?: any | null;
}): PayPeriodSettings {
  const { organization, location } = opts;

  const effective: PayPeriodSettings = {
    // location overrides org; if location has its own payPeriodType, use it
    payPeriodType: (location?.payPeriodType ||
      organization?.payPeriodType ||
      "WEEKLY") as PayPeriodType,

    weekStartDay:
      location?.weekStartDay ?? organization?.weekStartDay ?? 1,

    biWeeklyAnchorDate:
      location?.biWeeklyAnchorDate ?? organization?.biWeeklyAnchorDate ?? null,

    semiMonthCut1: location?.semiMonthCut1 ?? undefined,
    semiMonthCut2: location?.semiMonthCut2 ?? undefined,

    monthlyCutDay: location?.monthlyCutDay ?? undefined,

    cutoffTime:
      location?.cutoffTime ?? organization?.cutoffTime ?? "00:00",

    timezone: location?.timezone ?? organization?.timezone ?? null,
  };

  return effective;
}
