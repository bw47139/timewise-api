import dayjs from "dayjs";

export type PayPeriodType =
  | "WEEKLY"
  | "BIWEEKLY"
  | "SEMI_MONTHLY"
  | "MONTHLY";

interface PayPeriodConfig {
  payPeriodType: PayPeriodType;
  weekStartDay?: number; // 0 = Sunday, 1 = Monday
  biweeklyAnchorDate?: Date;
}

export function getPayPeriodForDate(
  date: string,
  config: PayPeriodConfig
) {
  const base = dayjs(date);

  // --------------------------------------------------
  // WEEKLY (DEFAULT + SAFE FALLBACK)
  // --------------------------------------------------
  if (
    config.payPeriodType === "WEEKLY" ||
    (config.payPeriodType === "BIWEEKLY" &&
      !config.biweeklyAnchorDate)
  ) {
    const weekStart = config.weekStartDay ?? 1;

    const start = base.startOf("week").add(weekStart, "day");
    const end = start.add(6, "day").endOf("day");

    return {
      type: "WEEKLY",
      start: start.format("YYYY-MM-DD"),
      end: end.format("YYYY-MM-DD"),
    };
  }

  // --------------------------------------------------
  // BIWEEKLY (STRICT ONLY WHEN CONFIGURED)
  // --------------------------------------------------
  if (config.payPeriodType === "BIWEEKLY") {
    const anchor = dayjs(config.biweeklyAnchorDate);

    const diffWeeks = Math.floor(
      base.diff(anchor, "week") / 2
    );

    const start = anchor.add(diffWeeks * 2, "week");
    const end = start.add(13, "day").endOf("day");

    return {
      type: "BIWEEKLY",
      start: start.format("YYYY-MM-DD"),
      end: end.format("YYYY-MM-DD"),
    };
  }

  throw new Error(
    `Unsupported pay period type: ${config.payPeriodType}`
  );
}
